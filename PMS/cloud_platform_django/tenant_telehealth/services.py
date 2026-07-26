import boto3
import uuid
from django.conf import settings
from .models import *
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class ChimeService:
    def __init__(self):
        self.chime_sdk_meetings = boto3.client(
            'chime-sdk-meetings',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        
        # S3 client for recording storage
        self.s3_client = boto3.client(
            's3',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        
        # Media Pipelines for recording
        self.chime_sdk_media_pipelines = boto3.client(
            'chime-sdk-media-pipelines',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )

    def create_meeting(self, with_audio=True, with_video=False, with_content=False):
        try:
            external_meeting_id = str(uuid.uuid4())

            meeting_config = {
                'ClientRequestToken': str(uuid.uuid4()),
                'MediaRegion': settings.AWS_REGION,
                'ExternalMeetingId': external_meeting_id,
            }

            meeting_features = {}
            if with_audio:
                meeting_features['Audio'] = {'EchoReduction': 'AVAILABLE'}
            if with_video:
                meeting_features['Video'] = {'MaxResolution': 'HD'}
            if with_content:
                meeting_features['Content'] = {'MaxResolution': 'FHD'}

            if meeting_features:
                meeting_config['MeetingFeatures'] = meeting_features

            response = self.chime_sdk_meetings.create_meeting(**meeting_config)
            meeting_data = response['Meeting']

            # ✅ ONLY return AWS data (callers persist the TelehealthMeeting row;
            # the scheduled flow updates its existing row, ad-hoc create makes one).
            return {
                'meeting_id': meeting_data['MeetingId'],
                'external_meeting_id': external_meeting_id,
                'media_region': meeting_data['MediaRegion'],
                'media_placement': meeting_data['MediaPlacement']
            }

        except Exception as e:
            logger.error(f"Error in create_meeting: {str(e)}")
            raise Exception(f"Failed to create meeting: {str(e)}")

    def create_attendee(self, meeting_id, attendee_name, capabilities=None):
        """Create an attendee with specific capabilities"""
        try:
            meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id)
            external_user_id = str(uuid.uuid4())
            
            attendee_config = {
                'MeetingId': meeting_id,
                'ExternalUserId': external_user_id
            }
            
            # Set capabilities (audio, video, content for screen share)
            if capabilities:
                attendee_config['Capabilities'] = capabilities
            else:
                attendee_config['Capabilities'] = {
                    'Audio': 'SendReceive',
                    'Video': 'SendReceive',
                    'Content': 'SendReceive'  # Required for screen sharing
                }
            
            response = self.chime_sdk_meetings.create_attendee(**attendee_config)
            attendee_data = response['Attendee']
            
            # Save to database
            attendee = TelehealthAttendee.objects.create(
                meeting=meeting,
                attendee_id=attendee_data['AttendeeId'],
                external_user_id=external_user_id,
                attendee_name=attendee_name,
                join_token=attendee_data['JoinToken']
            )
            
            return {
                'attendee_id': attendee.attendee_id,
                'external_user_id': attendee.external_user_id,
                'join_token': attendee.join_token,
                'attendee_name': attendee.attendee_name,
                'capabilities': attendee_data.get('Capabilities', {})
            }
        except TelehealthMeeting.DoesNotExist:
            raise Exception("Meeting not found")
        except Exception as e:
            raise Exception(f"Failed to create attendee: {str(e)}")

    def start_screen_share(self, meeting_id, attendee_id):
        """Start screen sharing for an attendee"""
        try:
            attendee = TelehealthAttendee.objects.get(
                attendee_id=attendee_id,
                meeting__meeting_id=meeting_id
            )
            
            # Update attendee capabilities to enable content sharing
            self.update_attendee_capabilities(
                meeting_id,
                attendee_id,
                capabilities={
                    'Audio': 'SendReceive',
                    'Video': 'SendReceive',
                    'Content': 'Send'  # Enable content sending
                }
            )
            
            # Create screen share session
            screen_share = TelehealthScreenShareSession.objects.create(
                meeting=attendee.meeting,
                attendee=attendee,
                status='active'
            )
            
            attendee.is_screen_sharing = True
            attendee.save()
            
            return {
                'screen_share_id': screen_share.id,
                'status': 'active',
                'attendee_id': attendee_id
            }
        except TelehealthAttendee.DoesNotExist:
            raise Exception("Attendee not found")
        except Exception as e:
            raise Exception(f"Failed to start screen share: {str(e)}")

    def stop_screen_share(self, meeting_id, attendee_id):
        """Stop screen sharing for an attendee"""
        try:
            attendee = TelehealthAttendee.objects.get(
                attendee_id=attendee_id,
                meeting__meeting_id=meeting_id
            )
            
            # Update capabilities to disable content sharing
            self.update_attendee_capabilities(
                meeting_id,
                attendee_id,
                capabilities={
                    'Audio': 'SendReceive',
                    'Video': 'SendReceive',
                    'Content': 'None'  # Disable content
                }
            )
            
            # Update screen share session
            screen_share = TelehealthScreenShareSession.objects.filter(
                attendee=attendee,
                status='active'
            ).first()
            
            if screen_share:
                screen_share.status = 'stopped'
                screen_share.stopped_at = timezone.now()
                duration = (screen_share.stopped_at - screen_share.started_at).total_seconds()
                screen_share.duration_seconds = int(duration)
                screen_share.save()
            
            attendee.is_screen_sharing = False
            attendee.save()
            
            return {'status': 'stopped', 'attendee_id': attendee_id}
        except TelehealthAttendee.DoesNotExist:
            raise Exception("Attendee not found")
        except Exception as e:
            raise Exception(f"Failed to stop screen share: {str(e)}")

    def start_recording(self, meeting_id, started_by_attendee_id, recording_type='composite'):
        """Start recording a meeting"""
        try:
            meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id)
            attendee = TelehealthAttendee.objects.get(attendee_id=started_by_attendee_id)
            recording_id = str(uuid.uuid4())
            
            # S3 configuration for storing recordings
            s3_bucket = settings.CHIME_RECORDINGS_BUCKET
            s3_key = f"recordings/{meeting.external_meeting_id}/{recording_id}"
            
            # Create media capture pipeline
            pipeline_config = {
                'SourceType': 'ChimeSdkMeeting',
                'SourceArn': f"arn:aws:chime::{settings.AWS_ACCOUNT_ID}:meeting/{meeting_id}",
                'SinkType': 'S3Bucket',
                'SinkArn': f"arn:aws:s3:::{s3_bucket}/{s3_key}",
            }
            
            # Note: This is a simplified version. In production, you need to:
            # 1. Set up proper IAM roles for media pipelines
            # 2. Configure the media pipeline with proper settings
            # For now, we'll track recording state in database
            
            recording = TelehealthMeetingRecording.objects.create(
                meeting=meeting,
                recording_id=recording_id,
                status='recording',
                recording_type=recording_type,
                s3_bucket=s3_bucket,
                s3_key=s3_key,
                started_by=attendee
            )
            
            meeting.is_recording = True
            meeting.recording_started_at = timezone.now()
            meeting.save()
            
            return {
                'recording_id': recording.recording_id,
                'status': 'recording',
                'started_at': recording.started_at.isoformat()
            }
        except TelehealthMeeting.DoesNotExist:
            raise Exception("Meeting not found")
        except Exception as e:
            logger.error(f"Failed to start recording: {str(e)}")
            raise Exception(f"Failed to start recording: {str(e)}")

    def stop_recording(self, meeting_id, recording_id):
        """Stop recording a meeting"""
        try:
            recording = TelehealthMeetingRecording.objects.get(
                recording_id=recording_id,
                meeting__meeting_id=meeting_id
            )
            
            recording.status = 'processing'
            recording.stopped_at = timezone.now()
            duration = (recording.stopped_at - recording.started_at).total_seconds()
            recording.duration_seconds = int(duration)
            recording.save()
            
            meeting = recording.meeting
            meeting.is_recording = False
            meeting.save()
            
            # In production, stop the media pipeline here
            # self.chime_sdk_media_pipelines.delete_media_capture_pipeline(...)
            
            return {
                'recording_id': recording.recording_id,
                'status': 'processing',
                'duration_seconds': recording.duration_seconds
            }
        except TelehealthMeetingRecording.DoesNotExist:
            raise Exception("Recording not found")
        except Exception as e:
            raise Exception(f"Failed to stop recording: {str(e)}")

    def get_recording_url(self, recording_id):
        """Generate a presigned URL for downloading recording"""
        try:
            recording = TelehealthMeetingRecording.objects.get(recording_id=recording_id)
            
            if recording.status != 'completed':
                raise Exception("Recording is not ready yet")
            
            # Generate presigned URL (valid for 1 hour)
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': recording.s3_bucket,
                    'Key': recording.s3_key
                },
                ExpiresIn=3600
            )
            
            recording.file_url = url
            recording.save()
            
            return {
                'recording_id': recording.recording_id,
                'download_url': url,
                'expires_in': 3600
            }
        except TelehealthMeetingRecording.DoesNotExist:
            raise Exception("Recording not found")
        except Exception as e:
            raise Exception(f"Failed to get recording URL: {str(e)}")

    def update_attendee_capabilities(self, meeting_id, attendee_id, capabilities):
        """Update attendee's capabilities"""
        try:
            response = self.chime_sdk_meetings.update_attendee_capabilities(
                MeetingId=meeting_id,
                AttendeeId=attendee_id,
                Capabilities=capabilities
            )
            return response['Attendee']
        except Exception as e:
            raise Exception(f"Failed to update attendee capabilities: {str(e)}")

    def delete_meeting(self, meeting_id):
        """Delete a Chime meeting"""
        try:
            self.chime_sdk_meetings.delete_meeting(MeetingId=meeting_id)
            TelehealthMeeting.objects.filter(meeting_id=meeting_id).update(is_active=False)
            return True
        except Exception as e:
            raise Exception(f"Failed to delete meeting: {str(e)}")

    def get_meeting(self, meeting_id):
        """Get meeting details"""
        try:
            response = self.chime_sdk_meetings.get_meeting(MeetingId=meeting_id)
            return response['Meeting']
        except Exception as e:
            raise Exception(f"Failed to get meeting: {str(e)}")

    def list_attendees(self, meeting_id):
        """List all attendees in a meeting"""
        try:
            response = self.chime_sdk_meetings.list_attendees(MeetingId=meeting_id)
            return response['Attendees']
        except Exception as e:
            raise Exception(f"Failed to list attendees: {str(e)}")
    
    def get_attendee(self, meeting_id, attendee_id):
        """Get specific attendee details"""
        try:
            response = self.chime_sdk_meetings.get_attendee(
                MeetingId=meeting_id,
                AttendeeId=attendee_id
            )
            return response['Attendee']
        except Exception as e:
            raise Exception(f"Failed to get attendee: {str(e)}")
    
    def batch_create_attendees(self, meeting_id, attendee_list):
        """Create multiple attendees at once"""
        try:
            attendees_data = []
            for attendee_name in attendee_list:
                attendees_data.append({
                    'ExternalUserId': str(uuid.uuid4()),
                    'Capabilities': {
                        'Audio': 'SendReceive',
                        'Video': 'SendReceive',
                        'Content': 'SendReceive'
                    }
                })
            
            response = self.chime_sdk_meetings.batch_create_attendee(
                MeetingId=meeting_id,
                Attendees=attendees_data
            )
            
            return {
                'attendees': response.get('Attendees', []),
                'errors': response.get('Errors', [])
            }
        except Exception as e:
            raise Exception(f"Failed to batch create attendees: {str(e)}")