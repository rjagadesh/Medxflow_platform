import boto3
import uuid
from django.conf import settings
from .models import Meeting, Attendee, ScreenShareSession, MeetingRecording
from django.utils import timezone
import logging
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent
import asyncio
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import io
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
        """Create a new Chime meeting with specified capabilities"""
        try:
            external_meeting_id = str(uuid.uuid4())
            
            meeting_config = {
                'ClientRequestToken': str(uuid.uuid4()),
                'MediaRegion': settings.AWS_REGION,
                'ExternalMeetingId': external_meeting_id,
            }
            
            # Configure meeting features
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
            
            # Save to database
            meeting = Meeting.objects.create(
                meeting_id=meeting_data['MeetingId'],
                external_meeting_id=external_meeting_id,
                media_region=meeting_data['MediaRegion'],
                media_placement=meeting_data['MediaPlacement']
            )
            
            return {
                'meeting_id': meeting.meeting_id,
                'external_meeting_id': meeting.external_meeting_id,
                'media_region': meeting.media_region,
                'media_placement': meeting.media_placement
            }
        except Exception as e:
            logger.error(f"Error in create_meeting: {str(e)}")
            raise Exception(f"Failed to create meeting: {str(e)}")

    def create_attendee(self, meeting_id, attendee_name, capabilities=None):
        """Create an attendee with specific capabilities"""
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id)
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
            attendee = Attendee.objects.create(
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
        except Meeting.DoesNotExist:
            raise Exception("Meeting not found")
        except Exception as e:
            raise Exception(f"Failed to create attendee: {str(e)}")

    def start_screen_share(self, meeting_id, attendee_id):
        """Start screen sharing for an attendee"""
        try:
            attendee = Attendee.objects.get(
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
            screen_share = ScreenShareSession.objects.create(
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
        except Attendee.DoesNotExist:
            raise Exception("Attendee not found")
        except Exception as e:
            raise Exception(f"Failed to start screen share: {str(e)}")

    def stop_screen_share(self, meeting_id, attendee_id):
        """Stop screen sharing for an attendee"""
        try:
            attendee = Attendee.objects.get(
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
            screen_share = ScreenShareSession.objects.filter(
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
        except Attendee.DoesNotExist:
            raise Exception("Attendee not found")
        except Exception as e:
            raise Exception(f"Failed to stop screen share: {str(e)}")

    def start_recording(self, meeting_id, started_by_attendee_id, recording_type='composite'):
        """Start recording a meeting"""
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id)
            attendee = Attendee.objects.get(attendee_id=started_by_attendee_id)
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
            
            recording = MeetingRecording.objects.create(
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
        except Meeting.DoesNotExist:
            raise Exception("Meeting not found")
        except Exception as e:
            logger.error(f"Failed to start recording: {str(e)}")
            raise Exception(f"Failed to start recording: {str(e)}")

    def stop_recording(self, meeting_id, recording_id):
        """Stop recording a meeting"""
        try:
            recording = MeetingRecording.objects.get(
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
        except MeetingRecording.DoesNotExist:
            raise Exception("Recording not found")
        except Exception as e:
            raise Exception(f"Failed to stop recording: {str(e)}")

    def get_recording_url(self, recording_id):
        """Generate a presigned URL for downloading recording"""
        try:
            recording = MeetingRecording.objects.get(recording_id=recording_id)
            
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
        except MeetingRecording.DoesNotExist:
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
            Meeting.objects.filter(meeting_id=meeting_id).update(is_active=False)
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

class TranscriptionService:
    """Service for live captions and transcription using AWS Transcribe"""
    
    def __init__(self):
        self.transcribe = boto3.client(
            'transcribe',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        
        self.s3_client = boto3.client(
            's3',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        
        # Channel layer for WebSocket broadcasting
        self.channel_layer = get_channel_layer()
        
        # Store active transcription sessions
        self.active_sessions = {}
    
    def start_live_transcription(self, meeting_id, language_code='en-US', 
                                enable_medical=True, enable_speaker_diarization=True):
        """
        Start live transcription for a meeting
        This creates the transcript record and returns configuration for the client
        """
        try:
            from .models import MeetingTranscript, Meeting
            
            meeting = Meeting.objects.get(meeting_id=meeting_id)
            
            # Check if transcript already exists
            transcript, created = MeetingTranscript.objects.get_or_create(
                meeting=meeting,
                defaults={
                    'status': 'processing',
                    'language': language_code,
                    'enable_speaker_identification': enable_speaker_diarization,
                    'enable_medical_terminology': enable_medical,
                    'started_at': timezone.now()
                }
            )
            
            if not created:
                if transcript.status == 'completed':
                    # Restart transcription
                    transcript.status = 'processing'
                    transcript.started_at = timezone.now()
                    transcript.completed_at = None
                    transcript.save()
                elif transcript.status == 'processing':
                    # Already processing
                    logger.info(f"Transcription already active for meeting {meeting_id}")
            
            logger.info(f"Live transcription initialized for meeting {meeting_id}")
            
            return {
                'transcript_id': transcript.id,
                'meeting_id': meeting_id,
                'status': 'active',
                'language': language_code,
                'medical_terminology': enable_medical,
                'speaker_identification': enable_speaker_diarization,
                'websocket_url': f'ws://{settings.WEBSOCKET_HOST}/ws/transcription/{meeting_id}/',
                'message': 'Connect to WebSocket and start sending audio'
            }
            
        except Exception as e:
            logger.error(f"Failed to start live transcription: {str(e)}", exc_info=True)
            raise Exception(f"Failed to start transcription: {str(e)}")
    
    def start_file_transcription(self, meeting_id, audio_file_url, language_code='en-US'):
        """
        Start transcription job for pre-recorded audio file
        This is for batch processing, not live streaming
        """
        try:
            from .models import MeetingTranscript, Meeting
            
            meeting = Meeting.objects.get(meeting_id=meeting_id)
            
            # Create transcript record
            transcript = MeetingTranscript.objects.create(
                meeting=meeting,
                status='processing',
                language=language_code,
                started_at=timezone.now()
            )
            
            # Generate unique job name
            job_name = f"transcription_{meeting_id}_{transcript.id}"
            
            # Start AWS Transcribe job
            response = self.transcribe.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={'MediaFileUri': audio_file_url},
                MediaFormat='mp3',  # or 'wav', 'flac', 'mp4'
                LanguageCode=language_code,
                Settings={
                    'ShowSpeakerLabels': True,
                    'MaxSpeakerLabels': 10,
                    'ChannelIdentification': False
                },
                OutputBucketName=settings.CHIME_RECORDINGS_BUCKET
            )
            
            transcript.transcription_job_name = job_name
            transcript.save()
            
            logger.info(f"Started transcription job {job_name} for meeting {meeting_id}")
            
            return {
                'transcript_id': transcript.id,
                'job_name': job_name,
                'status': 'processing',
                'message': 'Transcription job started. Check status periodically.'
            }
            
        except Exception as e:
            logger.error(f"Failed to start file transcription: {str(e)}", exc_info=True)
            raise
    
    def check_transcription_job_status(self, transcript_id):
        """Check status of batch transcription job"""
        try:
            from .models import MeetingTranscript
            
            transcript = MeetingTranscript.objects.get(id=transcript_id)
            
            if not transcript.transcription_job_name:
                raise Exception("No transcription job found for this transcript")
            
            response = self.transcribe.get_transcription_job(
                TranscriptionJobName=transcript.transcription_job_name
            )
            
            job = response['TranscriptionJob']
            job_status = job['TranscriptionJobStatus']
            
            if job_status == 'COMPLETED':
                # Get transcript from S3
                transcript_uri = job['Transcript']['TranscriptFileUri']
                self._process_completed_job(transcript, transcript_uri)
                
                return {
                    'status': 'completed',
                    'transcript_id': transcript_id
                }
            
            elif job_status == 'FAILED':
                transcript.status = 'failed'
                transcript.save()
                
                failure_reason = job.get('FailureReason', 'Unknown error')
                logger.error(f"Transcription job failed: {failure_reason}")
                
                return {
                    'status': 'failed',
                    'error': failure_reason
                }
            
            else:
                return {
                    'status': 'processing',
                    'progress': job.get('CompletionTime', 'In progress')
                }
            
        except Exception as e:
            logger.error(f"Failed to check job status: {str(e)}", exc_info=True)
            raise
    
    def _process_completed_job(self, transcript, transcript_uri):
        """Process completed transcription job results"""
        try:
            import requests
            from .models import TranscriptSegment
            
            # Download transcript JSON from S3
            response = requests.get(transcript_uri)
            transcription_data = response.json()
            
            # Extract transcript text
            full_text = transcription_data['results']['transcripts'][0]['transcript']
            
            # Extract speaker segments
            items = transcription_data['results']['items']
            speaker_labels = transcription_data['results'].get('speaker_labels', {})
            segments_data = speaker_labels.get('segments', [])
            
            total_words = 0
            speakers = set()
            
            for segment_data in segments_data:
                speaker_label = segment_data['speaker_label']
                start_time = float(segment_data['start_time'])
                end_time = float(segment_data['end_time'])
                
                # Get text for this segment
                segment_items = segment_data['items']
                segment_text = ' '.join([
                    item['content'] for item in items 
                    if item.get('start_time') and 
                    float(item['start_time']) >= start_time and 
                    float(item['start_time']) <= end_time
                ])
                
                if segment_text:
                    # Calculate average confidence
                    confidences = [
                        float(item.get('alternatives', [{}])[0].get('confidence', 0))
                        for item in items
                        if item.get('start_time') and
                        float(item['start_time']) >= start_time and
                        float(item['start_time']) <= end_time and
                        'alternatives' in item
                    ]
                    
                    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
                    
                    # Create segment
                    TranscriptSegment.objects.create(
                        transcript=transcript,
                        speaker_label=speaker_label,
                        text=segment_text,
                        start_time=start_time,
                        end_time=end_time,
                        duration=end_time - start_time,
                        confidence=avg_confidence,
                        words=[]
                    )
                    
                    total_words += len(segment_text.split())
                    speakers.add(speaker_label)
            
            # Update transcript
            transcript.full_transcript = full_text
            transcript.total_words = total_words
            transcript.total_speakers = len(speakers)
            transcript.status = 'completed'
            transcript.completed_at = timezone.now()
            transcript.save()
            
            # Extract keywords and analyze
            self.extract_medical_keywords(transcript.id)
            self.analyze_transcript(transcript.id)
            
            logger.info(f"Processed completed transcription job for transcript {transcript.id}")
            
        except Exception as e:
            logger.error(f"Failed to process completed job: {str(e)}", exc_info=True)
            transcript.status = 'failed'
            transcript.save()
    
    def save_caption(self, meeting_id, text, speaker_label, is_final, 
                    confidence, sequence_number):
        """
        Save a caption (called by WebSocket consumer during live transcription)
        """
        try:
            from .models import LiveCaption, Meeting
            
            meeting = Meeting.objects.get(meeting_id=meeting_id)
            
            # Don't save empty captions
            if not text or not text.strip():
                logger.warning(f"Skipping empty caption for meeting {meeting_id}")
                return None
            
            caption = LiveCaption.objects.create(
                meeting=meeting,
                text=text,
                speaker_label=speaker_label,
                is_final=is_final,
                confidence=confidence,
                sequence_number=sequence_number
            )
            
            # Broadcast to connected clients
            self._broadcast_caption(meeting_id, {
                'id': caption.id,
                'text': text,
                'speaker': speaker_label,
                'is_final': is_final,
                'confidence': confidence,
                'sequence': sequence_number,
                'timestamp': caption.timestamp.isoformat()
            })
            
            # If final, also save to transcript segment
            if is_final:
                self._save_as_segment(meeting, text, speaker_label, confidence)
            
            logger.debug(f"Saved caption: {text[:50]}... (final: {is_final})")
            
            return caption
            
        except Exception as e:
            logger.error(f"Failed to save caption: {str(e)}", exc_info=True)
            raise
    
    def _save_as_segment(self, meeting, text, speaker_label, confidence):
        """Convert final caption to transcript segment"""
        try:
            from .models import TranscriptSegment, MeetingTranscript
            
            transcript = MeetingTranscript.objects.filter(
                meeting=meeting,
                status='processing'
            ).first()
            
            if not transcript:
                logger.warning(f"No active transcript found for meeting {meeting.meeting_id}")
                return
            
            # Calculate time from meeting start
            time_elapsed = (timezone.now() - transcript.started_at).total_seconds()
            
            # Get last segment to calculate start time
            last_segment = TranscriptSegment.objects.filter(
                transcript=transcript
            ).order_by('-end_time').first()
            
            start_time = last_segment.end_time if last_segment else 0
            end_time = time_elapsed
            
            segment = TranscriptSegment.objects.create(
                transcript=transcript,
                speaker_label=speaker_label,
                text=text,
                start_time=start_time,
                end_time=end_time,
                duration=end_time - start_time,
                confidence=confidence,
                words=[]
            )
            
            # Update transcript word count
            transcript.total_words += len(text.split())
            
            # Update speaker count
            speaker_labels = TranscriptSegment.objects.filter(
                transcript=transcript
            ).values_list('speaker_label', flat=True).distinct()
            transcript.total_speakers = len(speaker_labels)
            
            transcript.save()
            
            logger.debug(f"Saved segment for transcript {transcript.id}")
            
        except Exception as e:
            logger.error(f"Failed to save segment: {str(e)}", exc_info=True)
    
    def _broadcast_caption(self, meeting_id, caption_data):
        """Broadcast caption to WebSocket clients"""
        try:
            if self.channel_layer:
                async_to_sync(self.channel_layer.group_send)(
                    f"meeting_{meeting_id}",
                    {
                        "type": "caption_message",
                        "caption": caption_data
                    }
                )
        except Exception as e:
            logger.warning(f"Failed to broadcast caption: {str(e)}")
    
    def stop_live_transcription(self, meeting_id):
        """Stop live transcription"""
        try:
            from .models import MeetingTranscript, Meeting
            
            meeting = Meeting.objects.get(meeting_id=meeting_id)
            transcript = MeetingTranscript.objects.filter(
                meeting=meeting,
                status='processing'
            ).first()
            
            if not transcript:
                raise Exception("No active transcription found")
            
            transcript.status = 'completed'
            transcript.completed_at = timezone.now()
            transcript.save()
            
            # Generate full transcript from segments
            self.generate_full_transcript(transcript.id)
            
            # Broadcast stop message
            if self.channel_layer:
                async_to_sync(self.channel_layer.group_send)(
                    f"meeting_{meeting_id}",
                    {
                        "type": "transcription_stopped",
                        "message": "Transcription completed"
                    }
                )
            
            logger.info(f"Live transcription stopped for meeting {meeting_id}")
            
            return {
                'transcript_id': transcript.id,
                'status': 'completed',
                'total_segments': transcript.segments.count(),
                'total_words': transcript.total_words,
                'duration': (transcript.completed_at - transcript.started_at).total_seconds()
            }
            
        except Exception as e:
            logger.error(f"Failed to stop transcription: {str(e)}", exc_info=True)
            raise
    
    def get_live_captions(self, meeting_id, limit=50):
        """Get recent live captions"""
        try:
            from .models import LiveCaption, Meeting
            
            meeting = Meeting.objects.get(meeting_id=meeting_id)
            
            # Get recent captions
            captions = LiveCaption.objects.filter(
                meeting=meeting
            ).order_by('-sequence_number')[:limit]
            
            captions_list = list(reversed(captions))  # Oldest first
            
            result = []
            for caption in captions_list:
                result.append({
                    'id': caption.id,
                    'text': caption.text,
                    'speaker': caption.speaker_label,
                    'is_final': caption.is_final,
                    'confidence': caption.confidence,
                    'sequence': caption.sequence_number,
                    'timestamp': caption.timestamp.isoformat()
                })
            
            return {
                'meeting_id': meeting_id,
                'captions': result,
                'total': len(result)
            }
            
        except Exception as e:
            logger.error(f"Failed to get captions: {str(e)}", exc_info=True)
            raise
    
    def generate_full_transcript(self, transcript_id):
        """Generate full transcript text from segments"""
        try:
            from .models import MeetingTranscript, TranscriptSegment
            
            transcript = MeetingTranscript.objects.get(id=transcript_id)
            segments = TranscriptSegment.objects.filter(
                transcript=transcript
            ).order_by('start_time')
            
            full_text = []
            total_words = 0
            speakers = set()
            
            for segment in segments:
                timestamp = self._format_timestamp(segment.start_time)
                full_text.append(
                    f"[{timestamp}] {segment.speaker_label}: {segment.text}"
                )
                
                total_words += len(segment.text.split())
                speakers.add(segment.speaker_label)
            
            transcript.full_transcript = "\n\n".join(full_text)
            transcript.total_words = total_words
            transcript.total_speakers = len(speakers)
            transcript.save()
            
            # Extract keywords and analyze
            self.extract_medical_keywords(transcript_id)
            self.analyze_transcript(transcript_id)
            
            logger.info(f"Generated full transcript for {transcript_id}")
            
            return transcript
            
        except Exception as e:
            logger.error(f"Failed to generate transcript: {str(e)}", exc_info=True)
            raise
    
    def extract_medical_keywords(self, transcript_id):
        """Extract medical keywords from transcript"""
        try:
            from .models import MeetingTranscript, MeetingKeyword
            
            transcript = MeetingTranscript.objects.get(id=transcript_id)
            
            # Enhanced medical terminology dictionary
            medical_terms = {
                'symptoms': [
                    'pain', 'fever', 'cough', 'headache', 'fatigue', 
                    'nausea', 'dizziness', 'shortness of breath', 'vomiting',
                    'diarrhea', 'chest pain', 'abdominal pain', 'swelling',
                    'rash', 'weakness', 'numbness', 'bleeding', 'bruising'
                ],
                'diagnosis': [
                    'diabetes', 'hypertension', 'asthma', 'infection', 
                    'allergy', 'cancer', 'covid', 'flu', 'pneumonia',
                    'bronchitis', 'arthritis', 'migraine', 'depression',
                    'anxiety', 'copd', 'heart disease', 'stroke'
                ],
                'medication': [
                    'aspirin', 'ibuprofen', 'antibiotics', 'insulin', 
                    'medication', 'prescription', 'dosage', 'paracetamol',
                    'lisinopril', 'metformin', 'atorvastatin', 'albuterol',
                    'prednisone', 'warfarin', 'gabapentin'
                ],
                'procedures': [
                    'surgery', 'biopsy', 'x-ray', 'blood test', 
                    'examination', 'mri', 'ct scan', 'ultrasound',
                    'ecg', 'colonoscopy', 'endoscopy', 'immunization',
                    'injection', 'physical therapy'
                ],
                'vitals': [
                    'blood pressure', 'heart rate', 'temperature', 
                    'oxygen saturation', 'pulse', 'respiratory rate',
                    'weight', 'bmi', 'glucose level'
                ]
            }
            
            text_lower = transcript.full_transcript.lower()
            
            # Clear existing keywords
            MeetingKeyword.objects.filter(transcript=transcript).delete()
            
            for category, keywords in medical_terms.items():
                for keyword in keywords:
                    count = text_lower.count(keyword)
                    if count > 0:
                        # Find positions of keyword
                        positions = []
                        pos = 0
                        while pos < len(text_lower):
                            pos = text_lower.find(keyword, pos)
                            if pos == -1:
                                break
                            positions.append(pos)
                            pos += len(keyword)
                        
                        MeetingKeyword.objects.create(
                            transcript=transcript,
                            keyword=keyword,
                            category=category,
                            frequency=count,
                            confidence=0.9,
                            timestamps=positions[:10]  # Store first 10 positions
                        )
            
            logger.info(f"Extracted keywords for transcript {transcript_id}")
            
        except Exception as e:
            logger.error(f"Failed to extract keywords: {str(e)}", exc_info=True)
    
    def analyze_transcript(self, transcript_id):
        """Generate AI analysis of transcript"""
        try:
            from .models import MeetingTranscript, TranscriptAnalysis, MeetingKeyword
            
            transcript = MeetingTranscript.objects.get(id=transcript_id)
            keywords = MeetingKeyword.objects.filter(transcript=transcript)
            
            # Extract mentioned items by category
            diagnoses = list(set([k.keyword for k in keywords if k.category == 'diagnosis']))
            symptoms = list(set([k.keyword for k in keywords if k.category == 'symptoms']))
            medications = list(set([k.keyword for k in keywords if k.category == 'medication']))
            procedures = list(set([k.keyword for k in keywords if k.category == 'procedures']))
            vitals = list(set([k.keyword for k in keywords if k.category == 'vitals']))
            
            # Generate summary
            duration = (transcript.completed_at - transcript.started_at).total_seconds() / 60
            summary = (
                f"Medical consultation transcript with {transcript.total_words} words "
                f"and {transcript.total_speakers} speakers. "
                f"Duration: {duration:.1f} minutes. "
            )
            
            if diagnoses:
                summary += f"Discussed conditions: {', '.join(diagnoses[:3])}. "
            if medications:
                summary += f"Medications mentioned: {', '.join(medications[:3])}. "
            
            # Generate key points
            key_points = [
                f"Consultation duration: {duration:.1f} minutes",
                f"Number of participants: {transcript.total_speakers}",
            ]
            
            if symptoms:
                key_points.append(f"Primary symptoms discussed: {', '.join(symptoms[:5])}")
            if diagnoses:
                key_points.append(f"Diagnoses mentioned: {', '.join(diagnoses[:5])}")
            if procedures:
                key_points.append(f"Procedures discussed: {', '.join(procedures[:3])}")
            
            # Determine action items and follow-up
            action_items = []
            follow_up_required = False
            
            if medications:
                action_items.append(f"Prescription required for: {', '.join(medications[:3])}")
                follow_up_required = True
            
            if procedures:
                action_items.append(f"Schedule procedures: {', '.join(procedures[:2])}")
                follow_up_required = True
            
            if 'blood test' in [k.keyword for k in keywords]:
                action_items.append("Order laboratory tests")
            
            # Simple sentiment analysis based on keywords
            positive_words = ['better', 'improved', 'good', 'stable', 'recovering']
            negative_words = ['worse', 'pain', 'severe', 'critical', 'emergency']
            
            text_lower = transcript.full_transcript.lower()
            positive_count = sum(text_lower.count(word) for word in positive_words)
            negative_count = sum(text_lower.count(word) for word in negative_words)
            
            if positive_count > negative_count:
                sentiment = 'positive'
            elif negative_count > positive_count:
                sentiment = 'concerning'
            else:
                sentiment = 'neutral'
            
            # Create or update analysis
            analysis, created = TranscriptAnalysis.objects.update_or_create(
                transcript=transcript,
                defaults={
                    'summary': summary,
                    'key_points': key_points,
                    'diagnoses_mentioned': diagnoses,
                    'symptoms_mentioned': symptoms,
                    'medications_mentioned': medications,
                    'procedures_discussed': procedures,
                    'action_items': action_items,
                    'follow_up_required': follow_up_required,
                    'overall_sentiment': sentiment
                }
            )
            
            logger.info(f"Generated analysis for transcript {transcript_id}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze transcript: {str(e)}", exc_info=True)
    
    def export_transcript_to_file(self, transcript_id, format_type='txt'):
        """Export transcript to file"""
        try:
            from .models import MeetingTranscript
            
            transcript = MeetingTranscript.objects.get(id=transcript_id)
            
            if format_type == 'txt':
                content = transcript.full_transcript
                filename = f"transcript_{transcript.meeting.meeting_id}_{transcript.id}.txt"
                content_type = 'text/plain'
            
            elif format_type == 'pdf':
                # Generate PDF (requires reportlab)
                from reportlab.lib.pagesizes import letter
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
                from reportlab.lib.styles import getSampleStyleSheet
                
                buffer = io.BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=letter)
                styles = getSampleStyleSheet()
                story = []
                
                # Add title
                story.append(Paragraph(f"Transcript - Meeting {transcript.meeting.meeting_id}", styles['Title']))
                story.append(Spacer(1, 12))
                
                # Add transcript content
                for line in transcript.full_transcript.split('\n'):
                    if line.strip():
                        story.append(Paragraph(line, styles['Normal']))
                        story.append(Spacer(1, 6))
                
                doc.build(story)
                content = buffer.getvalue()
                filename = f"transcript_{transcript.meeting.meeting_id}_{transcript.id}.pdf"
                content_type = 'application/pdf'
            
            elif format_type == 'docx':
                # Generate DOCX (requires python-docx)
                from docx import Document
                
                doc = Document()
                doc.add_heading(f"Transcript - Meeting {transcript.meeting.meeting_id}", 0)
                
                for line in transcript.full_transcript.split('\n'):
                    if line.strip():
                        doc.add_paragraph(line)
                
                buffer = io.BytesIO()
                doc.save(buffer)
                content = buffer.getvalue()
                filename = f"transcript_{transcript.meeting.meeting_id}_{transcript.id}.docx"
                content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            
            else:
                raise ValueError(f"Unsupported format: {format_type}")
            
            # Upload to S3
            s3_key = f"transcripts/{filename}"
            
            if isinstance(content, str):
                file_obj = io.BytesIO(content.encode('utf-8'))
            else:
                file_obj = io.BytesIO(content)
            
            self.s3_client.upload_fileobj(
                file_obj,
                settings.CHIME_RECORDINGS_BUCKET,
                s3_key,
                ExtraArgs={'ContentType': content_type}
            )
            
            # Generate presigned URL
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': settings.CHIME_RECORDINGS_BUCKET,
                    'Key': s3_key
                },
                ExpiresIn=3600  # 1 hour
            )
            
            # Update transcript record
            transcript.s3_bucket = settings.CHIME_RECORDINGS_BUCKET
            transcript.s3_key = s3_key
            transcript.file_url = url
            transcript.save()
            
            logger.info(f"Exported transcript {transcript_id} as {format_type}")
            
            return {
                'download_url': url,
                'filename': filename,
                'format': format_type,
                'size': len(content) if isinstance(content, bytes) else len(content.encode())
            }
            
        except Exception as e:
            logger.error(f"Failed to export transcript: {str(e)}", exc_info=True)
            raise
    
    def search_transcript(self, transcript_id, query):
        """Search for text in transcript"""
        try:
            from .models import TranscriptSegment, MeetingTranscript
            
            transcript = MeetingTranscript.objects.get(id=transcript_id)
            
            # Search in segments
            segments = TranscriptSegment.objects.filter(
                transcript=transcript,
                text__icontains=query
            ).order_by('start_time')
            
            results = []
            for segment in segments:
                # Highlight the query in text
                text = segment.text
                query_lower = query.lower()
                text_lower = text.lower()
                
                # Find all occurrences
                occurrences = []
                pos = 0
                while pos < len(text_lower):
                    pos = text_lower.find(query_lower, pos)
                    if pos == -1:
                        break
                    occurrences.append(pos)
                    pos += len(query_lower)
                
                results.append({
                    'segment_id': segment.id,
                    'text': text,
                    'speaker': segment.speaker_label,
                    'timestamp': self._format_timestamp(segment.start_time),
                    'start_time': segment.start_time,
                    'end_time': segment.end_time,
                    'confidence': segment.confidence,
                    'occurrences': len(occurrences)
                })
            
            return {
                'query': query,
                'total_results': len(results),
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Failed to search transcript: {str(e)}", exc_info=True)
            raise
    
    def _format_timestamp(self, seconds):
        """Format seconds to HH:MM:SS"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"