from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import ChimeService
from .serializers import *
from .services import TranscriptionService
from django.utils import timezone
import logging
from .emailservices import EmailService 
logger = logging.getLogger(__name__)
from .models import *


class CreateMeetingView(APIView):
    """Create a new meeting and join as first attendee"""
    
    def post(self, request):
        serializer = CreateMeetingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        attendee_name = serializer.validated_data['attendee_name']
        # attendee_email = serializer.validated_data["attendee_email"]
        attendee_email = request.data.get('attendee_email')  # Chime meeting ID
        chime_service = ChimeService()
        
        try:
            meeting_info = chime_service.create_meeting()
            logger.info(f"Meeting created: {meeting_info['meeting_id']}")
            
            attendee_info = chime_service.create_attendee(
                meeting_info['meeting_id'],
                attendee_name
            )
            logger.info(f"Attendee created: {attendee_info['attendee_id']}")
            if attendee_email:
                EmailService.send_meeting_id_email(
                    attendee_name=attendee_name,
                    attendee_email=attendee_email,
                    url="https://dev-cloud.droidal.com/meetings/video?patient=True",
                    meeting_id=meeting_info['meeting_id']
                )
            response_data = {
                'meeting': meeting_info,
                'attendee': attendee_info
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating meeting: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class JoinMeetingView(APIView):
    """Join an existing meeting"""
    
    def post(self, request):
        serializer = JoinMeetingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        meeting_id = serializer.validated_data['meeting_id']
        attendee_name = serializer.validated_data['attendee_name']
        
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id, is_active=True)
            meeting_serializer = MeetingSerializer(meeting)
            
            chime_service = ChimeService()
            attendee_info = chime_service.create_attendee(meeting_id, attendee_name)
            
            # Create system message for join
            ChatMessage.objects.create(
                meeting=meeting,
                sender_name="System",
                message_type='system',
                content=f"{attendee_name} joined the meeting"
            )
            
            logger.info(f"Attendee {attendee_name} joined meeting {meeting_id}")
            
            return Response({
                'meeting': meeting_serializer.data,
                'attendee': attendee_info
            }, status=status.HTTP_200_OK)
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error joining meeting: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EndMeetingView(APIView):
    """End a meeting"""
    
    def post(self, request, meeting_id):
        chime_service = ChimeService()
        
        try:
            chime_service.delete_meeting(meeting_id)
            logger.info(f"Meeting ended: {meeting_id}")
            return Response(
                {'message': 'Meeting ended successfully'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error ending meeting: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ListMeetingsView(APIView):
    """List all active meetings"""
    
    def get(self, request):
        meetings = Meeting.objects.filter(is_active=True)
        serializer = MeetingSerializer(meetings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class MeetingDetailView(APIView):
    """Get meeting details including attendees"""
    
    def get(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id, is_active=True)
            attendees = meeting.attendees.all()
            
            meeting_serializer = MeetingSerializer(meeting)
            attendees_serializer = AttendeeSerializer(attendees, many=True)
            
            return Response({
                'meeting': meeting_serializer.data,
                'attendees': attendees_serializer.data
            }, status=status.HTTP_200_OK)
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )

# Chat Views
class SendMessageView(APIView):
    """Send a chat message in a meeting"""
    
    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            meeting = Meeting.objects.get(
                meeting_id=serializer.validated_data['meeting_id'],
                is_active=True
            )
            attendee = Attendee.objects.get(
                attendee_id=serializer.validated_data['attendee_id'],
                meeting=meeting
            )
            
            message = ChatMessage.objects.create(
                meeting=meeting,
                attendee=attendee,
                sender_name=attendee.attendee_name,
                message_type=serializer.validated_data.get('message_type', 'text'),
                content=serializer.validated_data['content'],
                file_url=serializer.validated_data.get('file_url'),
                file_name=serializer.validated_data.get('file_name')
            )
            
            message_serializer = ChatMessageSerializer(message)
            return Response(message_serializer.data, status=status.HTTP_201_CREATED)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Attendee.DoesNotExist:
            return Response(
                {'error': 'Attendee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GetMessagesView(APIView):
    """Get all chat messages for a meeting"""
    
    def get(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id, is_active=True)
            messages = ChatMessage.objects.filter(
                meeting=meeting,
                is_deleted=False
            ).order_by('timestamp')
            
            serializer = ChatMessageSerializer(messages, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class DeleteMessageView(APIView):
    """Delete a chat message (soft delete)"""
    
    def delete(self, request, message_id):
        try:
            message = ChatMessage.objects.get(id=message_id)
            message.is_deleted = True
            message.save()
            
            return Response(
                {'message': 'Message deleted successfully'},
                status=status.HTTP_200_OK
            )
        except ChatMessage.DoesNotExist:
            return Response(
                {'error': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        

class StartAudioCallView(APIView):
    """Start an audio call (create meeting with audio enabled)"""
    
    def post(self, request):
        serializer = CreateMeetingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        attendee_name = serializer.validated_data['attendee_name']
        chime_service = ChimeService()
        
        try:
            # Create meeting with audio enabled
            meeting_info = chime_service.create_meeting(with_audio=True)
            logger.info(f"Audio call meeting created: {meeting_info['meeting_id']}")
            
            # Create attendee with audio capabilities
            attendee_info = chime_service.create_attendee(
                meeting_info['meeting_id'],
                attendee_name,
                capabilities={
                    'Audio': 'SendReceive',
                    'Video': 'None',  # Audio only
                    'Content': 'None'
                }
            )
            
            # Create audio session record
            meeting = Meeting.objects.get(meeting_id=meeting_info['meeting_id'])
            attendee = Attendee.objects.get(attendee_id=attendee_info['attendee_id'])
            
            audio_session = AudioCallSession.objects.create(
                meeting=meeting,
                attendee=attendee,
                status='connected'
            )
            
            response_data = {
                'meeting': meeting_info,
                'attendee': attendee_info,
                'audio_session_id': audio_session.id,
                'call_status': 'connected'
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error starting audio call: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class JoinAudioCallView(APIView):
    """Join an existing audio call"""
    
    def post(self, request):
        serializer = JoinMeetingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        meeting_id = serializer.validated_data['meeting_id']
        attendee_name = serializer.validated_data['attendee_name']
        
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id, is_active=True)
            
            # Create attendee with audio capabilities
            chime_service = ChimeService()
            attendee_info = chime_service.create_attendee(
                meeting_id, 
                attendee_name,
                capabilities={
                    'Audio': 'SendReceive',
                    'Video': 'None',
                    'Content': 'None'
                }
            )
            
            # Create audio session
            attendee = Attendee.objects.get(attendee_id=attendee_info['attendee_id'])
            audio_session = AudioCallSession.objects.create(
                meeting=meeting,
                attendee=attendee,
                status='connected'
            )
            
            meeting_serializer = MeetingSerializer(meeting)
            
            return Response({
                'meeting': meeting_serializer.data,
                'attendee': attendee_info,
                'audio_session_id': audio_session.id,
                'call_status': 'connected'
            }, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error joining audio call: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MuteUnmuteAudioView(APIView):
    """Mute or unmute audio for an attendee"""
    
    def post(self, request):
        serializer = UpdateAudioStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        meeting_id = serializer.validated_data['meeting_id']
        attendee_id = serializer.validated_data['attendee_id']
        is_muted = serializer.validated_data['is_muted']
        
        try:
            # Update in database
            attendee = Attendee.objects.get(
                attendee_id=attendee_id,
                meeting__meeting_id=meeting_id
            )
            attendee.is_muted = is_muted
            attendee.save()
            
            # Update audio session
            audio_session = AudioCallSession.objects.filter(
                attendee=attendee,
                status='connected'
            ).first()
            
            if audio_session:
                audio_session.is_muted = is_muted
                audio_session.save()
            
            # Update capabilities in Chime
            chime_service = ChimeService()
            chime_service.update_attendee_capabilities(
                meeting_id,
                attendee_id,
                capabilities={
                    'Audio': 'Receive' if is_muted else 'SendReceive',
                    'Video': 'None',
                    'Content': 'None'
                }
            )
            
            return Response({
                'attendee_id': attendee_id,
                'is_muted': is_muted,
                'status': 'success'
            }, status=status.HTTP_200_OK)
            
        except Attendee.DoesNotExist:
            return Response(
                {'error': 'Attendee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating mute status: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EndAudioCallView(APIView):
    """End audio call for an attendee or entire meeting"""
    
    def post(self, request):
        meeting_id = request.data.get('meeting_id')
        attendee_id = request.data.get('attendee_id')
        end_for_all = request.data.get('end_for_all', False)
        
        try:
            if end_for_all:
                # End meeting for everyone
                chime_service = ChimeService()
                chime_service.delete_meeting(meeting_id)
                
                # Update all audio sessions
                AudioCallSession.objects.filter(
                    meeting__meeting_id=meeting_id,
                    status='connected'
                ).update(
                    status='ended',
                    ended_at=timezone.now()
                )
                
                return Response({
                    'message': 'Audio call ended for all participants',
                    'meeting_id': meeting_id
                }, status=status.HTTP_200_OK)
            else:
                # End call for specific attendee
                attendee = Attendee.objects.get(
                    attendee_id=attendee_id,
                    meeting__meeting_id=meeting_id
                )
                
                audio_session = AudioCallSession.objects.filter(
                    attendee=attendee,
                    status='connected'
                ).first()
                
                if audio_session:
                    audio_session.status = 'ended'
                    audio_session.ended_at = timezone.now()
                    
                    # Calculate duration
                    duration = (audio_session.ended_at - audio_session.started_at).total_seconds()
                    audio_session.duration_seconds = int(duration)
                    audio_session.save()
                
                return Response({
                    'message': 'Audio call ended for attendee',
                    'attendee_id': attendee_id,
                    'duration_seconds': audio_session.duration_seconds if audio_session else 0
                }, status=status.HTTP_200_OK)
                
        except Attendee.DoesNotExist:
            return Response(
                {'error': 'Attendee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error ending audio call: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GetAudioCallStatusView(APIView):
    """Get current audio call status"""
    
    def get(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id, is_active=True)
            
            # Get all active audio sessions
            active_sessions = AudioCallSession.objects.filter(
                meeting=meeting,
                status='connected'
            )
            
            session_data = []
            for session in active_sessions:
                duration = (timezone.now() - session.started_at).total_seconds()
                session_data.append({
                    'attendee_id': session.attendee.attendee_id,
                    'attendee_name': session.attendee.attendee_name,
                    'is_muted': session.is_muted,
                    'duration_seconds': int(duration),
                    'status': session.status
                })
            
            return Response({
                'meeting_id': meeting_id,
                'active_participants': len(session_data),
                'participants': session_data
            }, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class GetAudioCallHistoryView(APIView):
    """Get audio call history for a meeting"""
    
    def get(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id)
            
            sessions = AudioCallSession.objects.filter(meeting=meeting)
            serializer = AudioCallSessionSerializer(sessions, many=True)
            
            return Response({
                'meeting_id': meeting_id,
                'total_sessions': sessions.count(),
                'sessions': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        

class StartScreenShareView(APIView):
    """Start screen sharing"""
    
    def post(self, request):
        meeting_id = request.data.get('meeting_id')
        attendee_id = request.data.get('attendee_id')
        
        if not meeting_id or not attendee_id:
            return Response(
                {'error': 'meeting_id and attendee_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            chime_service = ChimeService()
            result = chime_service.start_screen_share(meeting_id, attendee_id)
            
            logger.info(f"Screen share started by {attendee_id} in meeting {meeting_id}")
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error starting screen share: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StopScreenShareView(APIView):
    """Stop screen sharing"""
    
    def post(self, request):
        meeting_id = request.data.get('meeting_id')
        attendee_id = request.data.get('attendee_id')
        
        if not meeting_id or not attendee_id:
            return Response(
                {'error': 'meeting_id and attendee_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            chime_service = ChimeService()
            result = chime_service.stop_screen_share(meeting_id, attendee_id)
            
            logger.info(f"Screen share stopped by {attendee_id} in meeting {meeting_id}")
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error stopping screen share: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GetScreenShareStatusView(APIView):
    """Get screen sharing status for a meeting"""
    
    def get(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id, is_active=True)
            
            # Get active screen shares
            active_shares = ScreenShareSession.objects.filter(
                meeting=meeting,
                status='active'
            )
            
            serializer = ScreenShareSerializer(active_shares, many=True)
            
            return Response({
                'meeting_id': meeting_id,
                'active_screen_shares': active_shares.count(),
                'screen_shares': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class GetScreenShareHistoryView(APIView):
    """Get screen sharing history for a meeting"""
    
    def get(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id)
            shares = ScreenShareSession.objects.filter(meeting=meeting)
            serializer = ScreenShareSerializer(shares, many=True)
            
            return Response({
                'meeting_id': meeting_id,
                'total_screen_shares': shares.count(),
                'screen_shares': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )

# Recording Views
class StartRecordingView(APIView):
    """Start recording a meeting"""
    
    def post(self, request):
        serializer = StartRecordingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        meeting_id = serializer.validated_data['meeting_id']
        attendee_id = serializer.validated_data['attendee_id']
        recording_type = serializer.validated_data.get('recording_type', 'composite')
        
        try:
            chime_service = ChimeService()
            result = chime_service.start_recording(
                meeting_id,
                attendee_id,
                recording_type
            )
            
            logger.info(f"Recording started for meeting {meeting_id}")
            return Response(result, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error starting recording: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StopRecordingView(APIView):
    """Stop recording a meeting"""
    
    def post(self, request):
        meeting_id = request.data.get('meeting_id')
        recording_id = request.data.get('recording_id')
        
        if not meeting_id or not recording_id:
            return Response(
                {'error': 'meeting_id and recording_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            chime_service = ChimeService()
            result = chime_service.stop_recording(meeting_id, recording_id)
            
            logger.info(f"Recording {recording_id} stopped")
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error stopping recording: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PauseRecordingView(APIView):
    """Pause recording"""
    
    def post(self, request):
        recording_id = request.data.get('recording_id')
        
        if not recording_id:
            return Response(
                {'error': 'recording_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            recording = MeetingRecording.objects.get(recording_id=recording_id)
            recording.status = 'paused'
            recording.save()
            
            return Response({
                'recording_id': recording_id,
                'status': 'paused'
            }, status=status.HTTP_200_OK)
            
        except MeetingRecording.DoesNotExist:
            return Response(
                {'error': 'Recording not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class ResumeRecordingView(APIView):
    """Resume paused recording"""
    
    def post(self, request):
        recording_id = request.data.get('recording_id')
        
        if not recording_id:
            return Response(
                {'error': 'recording_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            recording = MeetingRecording.objects.get(recording_id=recording_id)
            
            if recording.status != 'paused':
                return Response(
                    {'error': 'Recording is not paused'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            recording.status = 'recording'
            recording.save()
            
            return Response({
                'recording_id': recording_id,
                'status': 'recording'
            }, status=status.HTTP_200_OK)
            
        except MeetingRecording.DoesNotExist:
            return Response(
                {'error': 'Recording not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class GetRecordingStatusView(APIView):
    """Get recording status"""
    
    def get(self, request, recording_id):
        try:
            recording = MeetingRecording.objects.get(recording_id=recording_id)
            serializer = RecordingSerializer(recording)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except MeetingRecording.DoesNotExist:
            return Response(
                {'error': 'Recording not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class ListMeetingRecordingsView(APIView):
    """List all recordings for a meeting"""
    
    def get(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id)
            recordings = MeetingRecording.objects.filter(meeting=meeting)
            serializer = RecordingSerializer(recordings, many=True)
            
            return Response({
                'meeting_id': meeting_id,
                'total_recordings': recordings.count(),
                'recordings': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class DownloadRecordingView(APIView):
    """Get download URL for a recording"""
    
    def get(self, request, recording_id):
        try:
            chime_service = ChimeService()
            result = chime_service.get_recording_url(recording_id)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting recording URL: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DeleteRecordingView(APIView):
    """Delete a recording"""
    
    def delete(self, request, recording_id):
        try:
            recording = MeetingRecording.objects.get(recording_id=recording_id)
            
            # Delete from S3
            chime_service = ChimeService()
            try:
                chime_service.s3_client.delete_object(
                    Bucket=recording.s3_bucket,
                    Key=recording.s3_key
                )
            except Exception as e:
                logger.warning(f"Failed to delete S3 object: {str(e)}")
            
            # Delete from database
            recording.delete()
            
            return Response(
                {'message': 'Recording deleted successfully'},
                status=status.HTTP_200_OK
            )
            
        except MeetingRecording.DoesNotExist:
            return Response(
                {'error': 'Recording not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
class PutCallOnHoldView(APIView):
    """Put the call on hold (disable audio/video temporarily)"""
    
    def post(self, request):
        meeting_id = request.data.get('meeting_id')  # Chime meeting ID
        attendee_id = request.data.get('attendee_id')
        on_hold = request.data.get('on_hold', True)  # True = put on hold, False = resume
        
        if not meeting_id or not attendee_id:
            return Response(
                {'error': 'meeting_id and attendee_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get attendee from database
            attendee = Attendee.objects.get(
                attendee_id=attendee_id,
                meeting__meeting_id=meeting_id
            )
            
            # Update hold status in database
            # We'll use is_muted field and add a custom field for hold status
            if not hasattr(attendee, 'is_on_hold'):
                # If field doesn't exist, we'll track it via mute + video off
                pass
            
            # When putting on hold:
            # - Mute audio
            # - Disable video
            # - Notify other participants
            
            if on_hold:
                # Put on hold
                attendee.is_muted = True
                attendee.is_video_enabled = False
                attendee.save()
                
                # Send system message
                ChatMessage.objects.create(
                    meeting=attendee.meeting,
                    sender_name="System",
                    message_type='system',
                    content=f"{attendee.attendee_name} put the call on hold"
                )
                
                # Update capabilities in Chime (disable audio and video)
                from .services import ChimeService
                chime_service = ChimeService()
                chime_service.update_attendee_capabilities(
                    meeting_id,
                    attendee_id,
                    capabilities={
                        'Audio': 'None',      # Disable audio
                        'Video': 'None',      # Disable video
                        'Content': 'None'     # Disable screen share
                    }
                )
                
                logger.info(f"Call put on hold by {attendee.attendee_name}")
                
                return Response({
                    'attendee_id': attendee_id,
                    'on_hold': True,
                    'message': 'Call is now on hold',
                    'timestamp': timezone.now().isoformat()
                }, status=status.HTTP_200_OK)
                
            else:
                # Resume from hold
                attendee.is_muted = False
                attendee.is_video_enabled = True
                attendee.save()
                
                # Send system message
                ChatMessage.objects.create(
                    meeting=attendee.meeting,
                    sender_name="System",
                    message_type='system',
                    content=f"{attendee.attendee_name} resumed the call"
                )
                
                # Re-enable capabilities in Chime
                from .services import ChimeService
                chime_service = ChimeService()
                chime_service.update_attendee_capabilities(
                    meeting_id,
                    attendee_id,
                    capabilities={
                        'Audio': 'SendReceive',
                        'Video': 'SendReceive',
                        'Content': 'SendReceive'
                    }
                )
                
                logger.info(f"Call resumed by {attendee.attendee_name}")
                
                return Response({
                    'attendee_id': attendee_id,
                    'on_hold': False,
                    'message': 'Call resumed',
                    'timestamp': timezone.now().isoformat()
                }, status=status.HTTP_200_OK)
            
        except Attendee.DoesNotExist:
            return Response(
                {'error': 'Attendee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error toggling hold status: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetCallStatusView(APIView):
    """Get current status of a call"""
    
    def get(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id, is_active=True)
            attendees = Attendee.objects.filter(meeting=meeting)
            
            participants = []
            for attendee in attendees:
                # Check if on hold (both muted and video disabled)
                is_on_hold = attendee.is_muted and not attendee.is_video_enabled
                
                participants.append({
                    'attendee_id': attendee.attendee_id,
                    'attendee_name': attendee.attendee_name,
                    'is_on_hold': is_on_hold,
                    'is_muted': attendee.is_muted,
                    'is_video_enabled': attendee.is_video_enabled,
                    'is_screen_sharing': attendee.is_screen_sharing,
                    'joined_at': attendee.joined_at
                })
            
            return Response({
                'meeting_id': meeting_id,
                'status': meeting.status,
                'participants': participants,
                'total_participants': len(participants),
                'participants_on_hold': sum(1 for p in participants if p['is_on_hold'])
            }, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        

class StartLiveTranscriptionView(APIView):
    """Start live transcription and captions"""
    
    def post(self, request):
        meeting_id = request.data.get('meeting_id')
        language_code = request.data.get('language', 'en-US')
        enable_medical = request.data.get('enable_medical', True)
        enable_speaker_id = request.data.get('enable_speaker_identification', True)
        
        if not meeting_id:
            return Response(
                {'error': 'meeting_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transcription_service = TranscriptionService()
            result = transcription_service.start_live_transcription(
                meeting_id=meeting_id,
                language_code=language_code,
                enable_medical=enable_medical,
                enable_speaker_diarization=enable_speaker_id
            )
            
            logger.info(f"Transcription started for meeting {meeting_id}")
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to start transcription: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StopLiveTranscriptionView(APIView):
    """Stop live transcription"""
    
    def post(self, request):
        meeting_id = request.data.get('meeting_id')
        
        if not meeting_id:
            return Response(
                {'error': 'meeting_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transcription_service = TranscriptionService()
            result = transcription_service.stop_live_transcription(meeting_id)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to stop transcription: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetLiveCaptionsView(APIView):
    """Get live captions for a meeting"""
    
    def get(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id)
            
            # Get recent captions (last 50)
            captions = LiveCaption.objects.filter(meeting=meeting).order_by('-sequence_number')[:50]
            captions = list(reversed(captions))  # Oldest first
            
            caption_data = []
            for caption in captions:
                caption_data.append({
                    'id': caption.id,
                    'text': caption.text,
                    'speaker': caption.speaker_label,
                    'is_final': caption.is_final,
                    'confidence': caption.confidence,
                    'timestamp': caption.timestamp.isoformat(),
                    'sequence': caption.sequence_number
                })
            
            return Response({
                'meeting_id': meeting_id,
                'captions': caption_data,
                'total': len(caption_data)
            }, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class GetMeetingTranscriptView(APIView):
    """Get complete meeting transcript"""
    
    def get(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id)
            
            try:
                transcript = MeetingTranscript.objects.get(meeting=meeting)
            except MeetingTranscript.DoesNotExist:
                return Response(
                    {'error': 'No transcript available for this meeting'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get segments
            segments = TranscriptSegment.objects.filter(transcript=transcript)
            
            segment_data = []
            for segment in segments:
                segment_data.append({
                    'id': segment.id,
                    'speaker': segment.speaker_label,
                    'speaker_name': segment.speaker_name,
                    'text': segment.text,
                    'start_time': segment.start_time,
                    'end_time': segment.end_time,
                    'confidence': segment.confidence
                })
            
            # Get keywords
            keywords = MeetingKeyword.objects.filter(transcript=transcript)
            keyword_data = {
                keyword.category: [] for keyword in keywords
            }
            for keyword in keywords:
                keyword_data[keyword.category].append({
                    'keyword': keyword.keyword,
                    'frequency': keyword.frequency
                })
            
            return Response({
                'meeting_id': meeting_id,
                'transcript': {
                    'id': transcript.id,
                    'status': transcript.status,
                    'full_transcript': transcript.full_transcript,
                    'total_words': transcript.total_words,
                    'total_speakers': transcript.total_speakers,
                    'language': transcript.language,
                    'started_at': transcript.started_at.isoformat(),
                    'completed_at': transcript.completed_at.isoformat() if transcript.completed_at else None
                },
                'segments': segment_data,
                'keywords': keyword_data,
                'download_url': transcript.file_url
            }, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class ExportTranscriptView(APIView):
    """Export transcript to file"""
    
    def post(self, request):
        transcript_id = request.data.get('transcript_id')
        format_type = request.data.get('format', 'txt')
        
        if not transcript_id:
            return Response(
                {'error': 'transcript_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if format_type not in ['txt', 'pdf', 'docx']:
            return Response(
                {'error': 'Invalid format. Must be txt, pdf, or docx'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transcription_service = TranscriptionService()
            result = transcription_service.export_transcript_to_file(
                transcript_id,
                format_type
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to export transcript: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SearchTranscriptView(APIView):
    """Search within transcript"""
    
    def get(self, request, transcript_id):
        query = request.query_params.get('q')
        
        if not query:
            return Response(
                {'error': 'Query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transcription_service = TranscriptionService()
            results = transcription_service.search_transcript(transcript_id, query)
            
            return Response(results, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to search transcript: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetTranscriptAnalysisView(APIView):
    """Get AI analysis of transcript"""
    
    def get(self, request, transcript_id):
        try:
            transcript = MeetingTranscript.objects.get(id=transcript_id)
            
            try:
                analysis = TranscriptAnalysis.objects.get(transcript=transcript)
            except TranscriptAnalysis.DoesNotExist:
                return Response(
                    {'error': 'No analysis available yet'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'transcript_id': transcript_id,
                'analysis': {
                    'summary': analysis.summary,
                    'key_points': analysis.key_points,
                    'diagnoses': analysis.diagnoses_mentioned,
                    'symptoms': analysis.symptoms_mentioned,
                    'medications': analysis.medications_mentioned,
                    'procedures': analysis.procedures_discussed,
                    'action_items': analysis.action_items,
                    'follow_up_required': analysis.follow_up_required,
                    'sentiment': analysis.overall_sentiment
                }
            }, status=status.HTTP_200_OK)
            
        except MeetingTranscript.DoesNotExist:
            return Response(
                {'error': 'Transcript not found'},
                status=status.HTTP_404_NOT_FOUND
            )