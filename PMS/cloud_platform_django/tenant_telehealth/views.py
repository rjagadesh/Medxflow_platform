from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import ChimeService
from .serializers import *
from .email_service import EmailService
from .tasks import send_meeting_summary_email
from django.utils import timezone
from accounts.models import TeleHealthGuestAccessToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import TokenAuthentication
import logging
from datetime import timedelta
from django.db import connection
from django_tenants.utils import schema_context
logger = logging.getLogger(__name__)
from .models import *
from .auth_utils import (
    GuestTokenAuthentication, 
    AllowGuestOrAuthenticated,
    get_user_and_permissions,
    RequirePermission
)

def get_tenant_schema(user_info):
    """Helper function to get the correct tenant schema"""
    if user_info['is_guest']:
        return user_info['tenant_schema']
    else:
        return connection.schema_name
    
class CreateMeetingView(APIView):
    """Create a new meeting and join as first attendee"""
    
    def post(self, request):
        serializer = CreateMeetingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        attendee_name = serializer.validated_data['attendee_name']
        chime_service = ChimeService()
        
        try:
            meeting_info = chime_service.create_meeting()
            logger.info(f"Meeting created: {meeting_info['meeting_id']}")

            # Persist the meeting row so create_attendee (which looks it up) succeeds.
            TelehealthMeeting.objects.get_or_create(
                meeting_id=meeting_info['meeting_id'],
                defaults={
                    'external_meeting_id': meeting_info['external_meeting_id'],
                    'media_region': meeting_info['media_region'],
                    'media_placement': meeting_info['media_placement'],
                    'status': 'started',
                    'created_by': request.user if request.user.is_authenticated else None,
                },
            )

            attendee_info = chime_service.create_attendee(
                meeting_info['meeting_id'],
                attendee_name
            )
            logger.info(f"Attendee created: {attendee_info['attendee_id']}")
            
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
    """
    Join an existing meeting
    Supports: JWT auth, DRF Token auth, and Guest Token auth
    """
    authentication_classes = [
        JWTAuthentication,
        TokenAuthentication,
        GuestTokenAuthentication
    ]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request):
        # Get user info (works for all auth types)
        user_info = get_user_and_permissions(request)
        
        logger.info(f"User '{user_info['user_name']}' ({user_info['user_type']}) attempting to join meeting")
        
        # Validate request data
        serializer = JoinMeetingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        meeting_id = serializer.validated_data['meeting_id']  # Chime meeting ID
        attendee_name = serializer.validated_data.get('attendee_name', user_info['user_name'])
        
        # Determine tenant schema
        if user_info['is_guest']:
            # Guest user - get schema from token
            tenant_schema = user_info['tenant_schema']
            logger.info(f"Guest user joining - using tenant schema: {tenant_schema}")
        else:
            # Authenticated user - get from current connection
            tenant_schema = connection.schema_name
            logger.info(f"Authenticated user joining - using tenant schema: {tenant_schema}")
        
        try:
            # Switch to the correct tenant schema
            with schema_context(tenant_schema):
                # Get meeting from database
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id, is_active=True)
                
                logger.info(f"Found meeting {meeting.id} in schema {tenant_schema}")
                
                # Check if meeting has been started
                if not meeting.meeting_id:
                    return Response(
                        {'error': 'Meeting has not been started yet. Please wait for the organizer to start the meeting.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check meeting status
                if meeting.status not in ['started', 'scheduled']:
                    return Response(
                        {'error': f'Meeting cannot be joined. Current status: {meeting.status}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                chime_service = ChimeService()
                
                # Try to get meeting from Chime to verify it exists
                try:
                    chime_meeting = chime_service.get_meeting(meeting_id)
                    logger.info(f"Chime meeting exists: {meeting_id}")
                except Exception as chime_error:
                    error_message = str(chime_error)
                    
                    # Check if meeting not found in Chime
                    if 'NotFoundException' in error_message or 'not found' in error_message.lower():
                        logger.warning(f"Meeting {meeting_id} not found in Chime, recreating...")
                        
                        # Meeting expired or was deleted from Chime
                        now = timezone.now()
                        
                        # Check if we can recreate (within 1 hour of scheduled time)
                        if meeting.scheduled_start_time:
                            time_diff = abs((now - meeting.scheduled_start_time).total_seconds() / 60)
                            if time_diff > 60:
                                # Too far from scheduled time, mark as ended
                                meeting.status = 'ended'
                                meeting.meeting_id = None
                                meeting.save()
                                return Response(
                                    {'error': 'Meeting has expired and cannot be rejoined. Please schedule a new meeting.'},
                                    status=status.HTTP_410_GONE
                                )
                        
                        # Recreate the meeting
                        try:
                            meeting_info = chime_service.create_meeting()
                            
                            # Update database with new meeting ID
                            meeting.meeting_id = meeting_info['meeting_id']
                            meeting.external_meeting_id = meeting_info['external_meeting_id']
                            meeting.media_region = meeting_info['media_region']
                            meeting.media_placement = meeting_info['media_placement']
                            meeting.status = 'started'
                            meeting.actual_start_time = now
                            meeting.save()
                            
                            logger.info(f"Meeting recreated with new ID: {meeting.meeting_id}")
                            
                            # Send notification to attendees about recreated meeting
                            try:
                                # Get guest token for this meeting (in PUBLIC schema)
                                with schema_context('public'):
                                    jointoken = TeleHealthGuestAccessToken.objects.filter(
                                        meeting_db_id=meeting.id,
                                        tenant_schema=tenant_schema
                                    ).first()
                                
                                # Get attendees (back in tenant schema)
                                attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
                                
                                if attendees.exists() and jointoken:
                                    from django.conf import settings
                                    base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
                                    attendee = attendees.first()
                                    
                                    meeting_link = (
                                        f"{base_url}/patient-telehealth"
                                        f"?token={jointoken.token}"
                                        f"&meetingid={meeting.meeting_id}"
                                        f"&name={attendee.name if attendee else ''}"
                                    )
                                    
                                    EmailService.send_meeting_started_email(meeting, attendees, meeting_link)
                                    logger.info("Sent meeting recreation notification emails")
                            except Exception as email_error:
                                logger.warning(f"Failed to send meeting recreation emails: {str(email_error)}")
                            
                        except Exception as recreate_error:
                            logger.error(f"Failed to recreate meeting: {str(recreate_error)}")
                            return Response(
                                {'error': 'Meeting has expired and could not be recreated. Please contact support.'},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR
                            )
                    else:
                        # Other Chime error
                        logger.error(f"Chime error: {error_message}")
                        return Response(
                            {'error': f'Failed to verify meeting: {error_message}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                
                # Create attendee with appropriate capabilities
                try:
                    # Get capabilities from user permissions
                    if user_info['is_guest']:
                        capabilities = {
                            'Audio': 'SendReceive' if user_info['permissions'].get('can_use_audio') else 'None',
                            'Video': 'SendReceive' if user_info['permissions'].get('can_use_video') else 'None',
                            'Content': 'SendReceive' if user_info['permissions'].get('can_share_screen') else 'None'
                        }
                    else:
                        # Full capabilities for authenticated users
                        capabilities = {
                            'Audio': 'SendReceive',
                            'Video': 'SendReceive',
                            'Content': 'SendReceive'
                        }
                    
                    attendee_info = chime_service.create_attendee(
                        meeting_id, 
                        attendee_name,
                        capabilities=capabilities
                    )
                    
                    logger.info(f"Attendee created: {attendee_info['attendee_id']}")
                    
                    # Save attendee to database
                    external_user_id = f"guest_{user_info['user'].guest_token.id}" if user_info['is_guest'] else f"user_{user_info['user'].id}"
                    
                    attendee, created = TelehealthAttendee.objects.update_or_create(
                        meeting=meeting,
                        external_user_id=external_user_id,
                        defaults={
                            'attendee_id': attendee_info['attendee_id'],
                            'attendee_name': attendee_name,
                            'join_token': attendee_info['join_token'],
                            'joined_at': timezone.now(),
                            'is_video_enabled': user_info['permissions'].get('can_use_video', True),
                        }
                    )
                    
                except Exception as attendee_error:
                    logger.error(f"Failed to create attendee: {str(attendee_error)}")
                    return Response(
                        {'error': f'Failed to join meeting: {str(attendee_error)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                # Create system message for join
                try:
                    user_type_label = f" ({user_info['user_type']})" if user_info['is_guest'] else ""
                    TelehealthChatMessage.objects.create(
                        meeting=meeting,
                        sender_name="System",
                        message_type='system',
                        content=f"{attendee_name}{user_type_label} joined the meeting"
                    )
                except Exception as chat_error:
                    logger.warning(f"Failed to create chat message: {str(chat_error)}")
                
                # Get updated meeting info
                meeting_serializer = MeetingSerializer(meeting)
                
                logger.info(f"{user_info['user_type']} '{attendee_name}' successfully joined meeting {meeting_id}")
                
                return Response({
                    'message': 'Successfully joined meeting',
                    'meeting': meeting_serializer.data,
                    'attendee': attendee_info,
                    'user_info': {
                        'name': attendee_name,
                        'type': user_info['user_type'],
                        'is_guest': user_info['is_guest']
                    },
                    'permissions': user_info['permissions']
                }, status=status.HTTP_200_OK)
            
        except TelehealthMeeting.DoesNotExist:
            logger.error(f"Meeting {meeting_id} not found in schema {tenant_schema}")
            return Response(
                {'error': 'Meeting not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error joining meeting: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RejoinMeetingView(APIView):
    """Rejoin a meeting (for when connection is lost)"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        meeting_id = request.data.get('meeting_id')
        attendee_name = request.data.get('attendee_name', user_info['user_name'])
        
        if not meeting_id:
            return Response({'error': 'meeting_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id, is_active=True)
                chime_service = ChimeService()
                
                # Check if meeting still exists in Chime
                try:
                    chime_service.get_meeting(meeting_id)
                except Exception as e:
                    if 'NotFoundException' in str(e):
                        return Response(
                            {'error': 'Meeting has ended or expired. Please start a new meeting.'},
                            status=status.HTTP_410_GONE
                        )
                    raise e
                
                # Create new attendee credentials with permissions
                capabilities = {
                    'Audio': 'SendReceive' if user_info['permissions'].get('can_use_audio') else 'None',
                    'Video': 'SendReceive' if user_info['permissions'].get('can_use_video') else 'None',
                    'Content': 'SendReceive' if user_info['permissions'].get('can_share_screen') else 'None'
                }
                
                attendee_info = chime_service.create_attendee(meeting_id, attendee_name, capabilities=capabilities)
                meeting_serializer = MeetingSerializer(meeting)
                
                return Response({
                    'meeting': meeting_serializer.data,
                    'attendee': attendee_info,
                    'rejoined': True
                }, status=status.HTTP_200_OK)
                
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error rejoining meeting: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckMeetingStatusView(APIView):
    """Check if a meeting is still active in Chime"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def get(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id, is_active=True)
                chime_service = ChimeService()
                
                try:
                    chime_meeting = chime_service.get_meeting(meeting_id)
                    
                    return Response({
                        'meeting_id': meeting_id,
                        'status': 'active',
                        'database_status': meeting.status,
                        'exists_in_chime': True,
                        'meeting_info': {
                            'meeting_id': meeting.meeting_id,
                            'media_region': meeting.media_region
                        }
                    }, status=status.HTTP_200_OK)
                    
                except Exception as e:
                    if 'NotFoundException' in str(e):
                        return Response({
                            'meeting_id': meeting_id,
                            'status': 'expired',
                            'database_status': meeting.status,
                            'exists_in_chime': False,
                            'error': 'Meeting has expired or been deleted from AWS Chime'
                        }, status=status.HTTP_200_OK)
                    
                    return Response({
                        'error': f'Failed to check meeting status: {str(e)}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found in database'}, status=status.HTTP_404_NOT_FOUND)


class EndMeetingView(APIView):
    """End a meeting"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        
        # Check permission to end meeting
        if not user_info['permissions'].get('can_end_meeting', False):
            return Response(
                {'error': 'You do not have permission to end meetings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tenant_schema = get_tenant_schema(user_info)
        chime_service = ChimeService()
        
        try:
            with schema_context(tenant_schema):
                chime_service.delete_meeting(meeting_id)
                logger.info(f"Meeting ended: {meeting_id}")
                return Response({'message': 'Meeting ended successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error ending meeting: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class ListMeetingsView(APIView):
    """List all active meetings"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def get(self, request):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                meetings = TelehealthMeeting.objects.filter(is_active=True)
                serializer = MeetingSerializer(meetings, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error listing meetings: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MeetingDetailView(APIView):
    """Get meeting details including attendees"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def get(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id, is_active=True)
                attendees = meeting.attendees.all()
                
                meeting_serializer = MeetingSerializer(meeting)
                attendees_serializer = AttendeeSerializer(attendees, many=True)
                
                return Response({
                    'meeting': meeting_serializer.data,
                    'attendees': attendees_serializer.data
                }, status=status.HTTP_200_OK)
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)


class SendMessageView(APIView):
    """Send a chat message in a meeting"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request):
        user_info = get_user_and_permissions(request)
        
        if not user_info['permissions'].get('can_chat', False):
            return Response({'error': 'You do not have permission to send messages'}, status=status.HTTP_403_FORBIDDEN)
        
        tenant_schema = get_tenant_schema(user_info)
        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(
                    meeting_id=serializer.validated_data['meeting_id'],
                    is_active=True
                )
                attendee = TelehealthAttendee.objects.filter(
                    attendee_id=serializer.validated_data['attendee_id'],
                    meeting=meeting
                ).first()

                if not attendee:
                    return Response({'error': 'Attendee not found'}, status=404)
                
                message = TelehealthChatMessage.objects.create(
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
                
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found or inactive'}, status=status.HTTP_404_NOT_FOUND)
        except TelehealthAttendee.DoesNotExist:
            return Response({'error': 'Attendee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            linenum = traceback.format_exc()
            logger.error(f"Error sending message: {str(e)}")
            return Response({'error': str(linenum)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class GetMessagesView(APIView):
    """Get all chat messages for a meeting"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def get(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        
        if not user_info['permissions'].get('can_chat', False):
            return Response({'error': 'You do not have permission to view messages'}, status=status.HTTP_403_FORBIDDEN)
        
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id, is_active=True)
                messages = TelehealthChatMessage.objects.filter(
                    meeting=meeting,
                    is_deleted=False
                ).order_by('timestamp')
                
                serializer = ChatMessageSerializer(messages, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
                
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)


class DeleteMessageView(APIView):
    """Delete a chat message (soft delete)"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def delete(self, request, message_id):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                message = TelehealthChatMessage.objects.get(id=message_id)
                message.is_deleted = True
                message.save()
                
                return Response({'message': 'Message deleted successfully'}, status=status.HTTP_200_OK)
        except TelehealthChatMessage.DoesNotExist:
            return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

       


class StartAudioCallView(APIView):
    """Start an audio call (create meeting with audio enabled)"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        serializer = CreateMeetingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        attendee_name = serializer.validated_data['attendee_name']
        chime_service = ChimeService()
        
        try:
            with schema_context(tenant_schema):
                meeting_info = chime_service.create_meeting(with_audio=True)
                logger.info(f"Audio call meeting created: {meeting_info['meeting_id']}")
                
                attendee_info = chime_service.create_attendee(
                    meeting_info['meeting_id'],
                    attendee_name,
                    capabilities={
                        'Audio': 'SendReceive',
                        'Video': 'None',
                        'Content': 'None'
                    }
                )
                
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_info['meeting_id'])
                attendee = TelehealthAttendee.objects.get(attendee_id=attendee_info['attendee_id'])
                
                audio_session = TelehealthAudioCallSession.objects.create(
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
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class JoinAudioCallView(APIView):
    """Join an existing audio call"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        serializer = JoinMeetingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        meeting_id = serializer.validated_data['meeting_id']
        attendee_name = serializer.validated_data.get('attendee_name', user_info['user_name'])
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id, is_active=True)
                
                # Create attendee with audio capabilities based on permissions
                chime_service = ChimeService()
                
                capabilities = {
                    'Audio': 'SendReceive' if user_info['permissions'].get('can_use_audio') else 'None',
                    'Video': 'None',  # Audio only
                    'Content': 'None'
                }
                
                attendee_info = chime_service.create_attendee(
                    meeting_id, 
                    attendee_name,
                    capabilities=capabilities
                )
                
                # Save attendee to database
                external_user_id = f"guest_{user_info['user'].guest_token.id}" if user_info['is_guest'] else f"user_{user_info['user'].id}"
                
                attendee = TelehealthAttendee.objects.create(
                    meeting=meeting,
                    attendee_id=attendee_info['attendee_id'],
                    external_user_id=external_user_id,
                    attendee_name=attendee_name,
                    join_token=attendee_info['join_token']
                )
                
                # Create audio session
                audio_session = TelehealthAudioCallSession.objects.create(
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
                
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found or inactive'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error joining audio call: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MuteUnmuteAudioView(APIView):
    """Mute or unmute audio for an attendee"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        serializer = UpdateAudioStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        meeting_id = serializer.validated_data['meeting_id']
        attendee_id = serializer.validated_data['attendee_id']
        is_muted = serializer.validated_data['is_muted']
        
        try:
            with schema_context(tenant_schema):
                attendee = TelehealthAttendee.objects.get(
                    attendee_id=attendee_id,
                    meeting__meeting_id=meeting_id
                )
                
                # Check if muting someone else
                if attendee.attendee_name != user_info['user_name']:
                    if not user_info['permissions'].get('can_mute_others', False):
                        return Response(
                            {'error': 'You do not have permission to mute others'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                
                attendee.is_muted = is_muted
                attendee.save()
                
                # Update audio session
                audio_session = TelehealthAudioCallSession.objects.filter(
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
                        'Video': 'SendReceive' if attendee.is_video_enabled else 'None',
                        'Content': 'SendReceive' if attendee.is_screen_sharing else 'None'
                    }
                )
                
                return Response({
                    'attendee_id': attendee_id,
                    'is_muted': is_muted,
                    'status': 'success'
                }, status=status.HTTP_200_OK)
                
        except TelehealthAttendee.DoesNotExist:
            return Response({'error': 'Attendee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error updating mute status: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EndAudioCallView(APIView):
    """End audio call for an attendee or entire meeting"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        meeting_id = request.data.get('meeting_id')
        attendee_id = request.data.get('attendee_id')
        end_for_all = request.data.get('end_for_all', False)
        
        # Check permission for ending for all
        if end_for_all and not user_info['permissions'].get('can_end_meeting', False):
            return Response(
                {'error': 'You do not have permission to end meeting for all'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            with schema_context(tenant_schema):
                if end_for_all:
                    # End meeting for everyone
                    chime_service = ChimeService()
                    chime_service.delete_meeting(meeting_id)
                    
                    # Update all audio sessions
                    TelehealthAudioCallSession.objects.filter(
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
                    attendee = TelehealthAttendee.objects.get(
                        attendee_id=attendee_id,
                        meeting__meeting_id=meeting_id
                    )
                    
                    audio_session = TelehealthAudioCallSession.objects.filter(
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
                    
        except TelehealthAttendee.DoesNotExist:
            return Response({'error': 'Attendee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error ending audio call: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetAudioCallStatusView(APIView):
    """Get current audio call status"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def get(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id, is_active=True)
                
                active_sessions = TelehealthAudioCallSession.objects.filter(
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
                
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)


class GetAudioCallHistoryView(APIView):
    """Get audio call history for a meeting"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def get(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id)
                
                sessions = TelehealthAudioCallSession.objects.filter(meeting=meeting)
                serializer = AudioCallSessionSerializer(sessions, many=True)
                
                return Response({
                    'meeting_id': meeting_id,
                    'total_sessions': sessions.count(),
                    'sessions': serializer.data
                }, status=status.HTTP_200_OK)
                
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)  

class StartScreenShareView(APIView):
    """Start screen sharing"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request):
        user_info = get_user_and_permissions(request)
        
        if not user_info['permissions'].get('can_share_screen', False):
            return Response(
                {'error': 'You do not have permission to share screen'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tenant_schema = get_tenant_schema(user_info)
        meeting_id = request.data.get('meeting_id')
        attendee_id = request.data.get('attendee_id')
        
        if not meeting_id or not attendee_id:
            return Response(
                {'error': 'meeting_id and attendee_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with schema_context(tenant_schema):
                chime_service = ChimeService()
                result = chime_service.start_screen_share(meeting_id, attendee_id)
                
                logger.info(f"Screen share started by {attendee_id} in meeting {meeting_id}")
                return Response(result, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error starting screen share: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StopScreenShareView(APIView):
    """Stop screen sharing"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        meeting_id = request.data.get('meeting_id')
        attendee_id = request.data.get('attendee_id')
        
        if not meeting_id or not attendee_id:
            return Response(
                {'error': 'meeting_id and attendee_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with schema_context(tenant_schema):
                chime_service = ChimeService()
                result = chime_service.stop_screen_share(meeting_id, attendee_id)
                
                logger.info(f"Screen share stopped by {attendee_id} in meeting {meeting_id}")
                return Response(result, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error stopping screen share: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetScreenShareStatusView(APIView):
    """Get screen sharing status for a meeting"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def get(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id, is_active=True)
                
                active_shares = TelehealthScreenShareSession.objects.filter(
                    meeting=meeting,
                    status='active'
                )
                
                serializer = ScreenShareSerializer(active_shares, many=True)
                
                return Response({
                    'meeting_id': meeting_id,
                    'active_screen_shares': active_shares.count(),
                    'screen_shares': serializer.data
                }, status=status.HTTP_200_OK)
                
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)


class GetScreenShareHistoryView(APIView):
    """Get screen sharing history for a meeting"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def get(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id)
                shares = TelehealthScreenShareSession.objects.filter(meeting=meeting)
                serializer = ScreenShareSerializer(shares, many=True)
                
                return Response({
                    'meeting_id': meeting_id,
                    'total_screen_shares': shares.count(),
                    'screen_shares': serializer.data
                }, status=status.HTTP_200_OK)
                
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)

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
            recording = TelehealthMeetingRecording.objects.get(recording_id=recording_id)
            recording.status = 'paused'
            recording.save()
            
            return Response({
                'recording_id': recording_id,
                'status': 'paused'
            }, status=status.HTTP_200_OK)
            
        except TelehealthMeetingRecording.DoesNotExist:
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
            recording = TelehealthMeetingRecording.objects.get(recording_id=recording_id)
            
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
            
        except TelehealthMeetingRecording.DoesNotExist:
            return Response(
                {'error': 'Recording not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class GetRecordingStatusView(APIView):
    """Get recording status"""
    
    def get(self, request, recording_id):
        try:
            recording = TelehealthMeetingRecording.objects.get(recording_id=recording_id)
            serializer = RecordingSerializer(recording)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except TelehealthMeetingRecording.DoesNotExist:
            return Response(
                {'error': 'Recording not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class ListMeetingRecordingsView(APIView):
    """List all recordings for a meeting"""
    
    def get(self, request, meeting_id):
        try:
            meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id)
            recordings = TelehealthMeetingRecording.objects.filter(meeting=meeting)
            serializer = RecordingSerializer(recordings, many=True)
            
            return Response({
                'meeting_id': meeting_id,
                'total_recordings': recordings.count(),
                'recordings': serializer.data
            }, status=status.HTTP_200_OK)
            
        except TelehealthMeeting.DoesNotExist:
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
            recording = TelehealthMeetingRecording.objects.get(recording_id=recording_id)
            
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
            
        except TelehealthMeetingRecording.DoesNotExist:
            return Response(
                {'error': 'Recording not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        

class ScheduleMeetingView(APIView):
    """Schedule a new meeting with attendees"""
    
    def post(self, request):
        serializer = ScheduleMeetingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create the scheduled meeting
            meeting = TelehealthMeeting.objects.create(
                meeting_title=serializer.validated_data['meeting_title'],
                meeting_description=serializer.validated_data.get('meeting_description', ''),
                scheduled_start_time=serializer.validated_data['scheduled_start_time'],
                scheduled_end_time=serializer.validated_data['scheduled_end_time'],
                created_by=request.user if request.user.is_authenticated else None,
                status='scheduled',
                is_active=True
            )
            
            # Add attendees
            attendees_data = serializer.validated_data.get('attendees', [])
            created_attendees = []
            
            for attendee_data in attendees_data:
                attendee = ScheduledMeetingAttendee.objects.create(
                    meeting=meeting,
                    email=attendee_data['email'],
                    name=attendee_data['name'],
                    is_organizer=attendee_data.get('is_organizer', False),
                    user=request.user if attendee_data.get('is_organizer') and request.user.is_authenticated else None
                )
                created_attendees.append(attendee)

            # Create a guest access token so the meeting can be started/joined later.
            # StartScheduledMeetingView looks this up by meeting_db_id.
            guest = next((a for a in created_attendees if not a.is_organizer),
                         created_attendees[0] if created_attendees else None)
            _token = TeleHealthGuestAccessToken.generate_token()
            TeleHealthGuestAccessToken.objects.create(
                token=_token,
                token_hash=TeleHealthGuestAccessToken.hash_token(_token),
                meeting_db_id=meeting.id,
                user_type='patient',
                user_name=(guest.name if guest else 'Guest'),
                user_email=(guest.email if guest else None),
                tenant_schema=connection.schema_name,
                expires_at=(meeting.scheduled_end_time + timedelta(hours=4))
                if meeting.scheduled_end_time else timezone.now() + timedelta(days=1),
            )

            # Send creation emails to all attendees
            if EmailService.send_meeting_created_email(meeting, created_attendees):
                meeting.creation_email_sent = True
                meeting.save()
            
            # Serialize response
            response_serializer = ScheduledMeetingSerializer(meeting)
            
            logger.info(f"Meeting {meeting.id} scheduled for {meeting.scheduled_start_time}")
            
            return Response({
                'message': 'Meeting scheduled successfully',
                'meeting': response_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error scheduling meeting: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ListScheduledMeetingsView(APIView):
    """List all scheduled meetings"""
    
    def get(self, request):
        # Get query parameters
        status_filter = request.query_params.get('status', None)
        upcoming_only = request.query_params.get('upcoming', 'false').lower() == 'true'
        
        # Base queryset
        meetings = TelehealthMeeting.objects.filter(
            is_active=True,
            appoinment__isnull=False
        ).select_related('appoinment', 'created_by')
        
        # Apply filters
        if status_filter:
            meetings = meetings.filter(status=status_filter)
        
        if upcoming_only:
            meetings = meetings.filter(
                scheduled_start_time__gte=timezone.now(),
                status='scheduled'
            )
        
        # Order by scheduled start time
        meetings = meetings.order_by('scheduled_start_time')
        
        serializer = ScheduledMeetingSerializer(meetings, many=True)
        return Response({
            'count': meetings.count(),
            'meetings': serializer.data
        }, status=status.HTTP_200_OK)


class ScheduledMeetingDetailView(APIView):
    """Get details of a scheduled meeting"""
    
    def get(self, request, meeting_id):
        try:
            meeting = TelehealthMeeting.objects.get(id=meeting_id, is_active=True)
            serializer = ScheduledMeetingSerializer(meeting)
            
            # Get attendees
            attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
            attendees_data = [{
                'id': a.id,
                'name': a.name,
                'email': a.email,
                'is_organizer': a.is_organizer
            } for a in attendees]
            
            return Response({
                'meeting': serializer.data,
                'attendees': attendees_data
            }, status=status.HTTP_200_OK)
            
        except TelehealthMeeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class UpdateScheduledMeetingView(APIView):
    """Update a scheduled meeting"""
    
    def put(self, request, meeting_id):
        try:
            meeting = TelehealthMeeting.objects.get(id=meeting_id, is_active=True, status='scheduled')
            
            serializer = UpdateScheduledMeetingSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Update meeting details
            if 'meeting_title' in serializer.validated_data:
                meeting.meeting_title = serializer.validated_data['meeting_title']
            
            if 'meeting_description' in serializer.validated_data:
                meeting.meeting_description = serializer.validated_data['meeting_description']
            
            if 'scheduled_start_time' in serializer.validated_data:
                meeting.scheduled_start_time = serializer.validated_data['scheduled_start_time']
                # Reset reminder email flag if time changed
                meeting.reminder_email_sent = False
            
            if 'scheduled_end_time' in serializer.validated_data:
                meeting.scheduled_end_time = serializer.validated_data['scheduled_end_time']
            
            meeting.save()
            
            # Update attendees if provided
            if 'attendees' in serializer.validated_data:
                # Remove existing attendees
                ScheduledMeetingAttendee.objects.filter(meeting=meeting).delete()
                
                # Add new attendees
                for attendee_data in serializer.validated_data['attendees']:
                    ScheduledMeetingAttendee.objects.create(
                        meeting=meeting,
                        email=attendee_data['email'],
                        name=attendee_data['name'],
                        is_organizer=attendee_data.get('is_organizer', False)
                    )
            
            response_serializer = ScheduledMeetingSerializer(meeting)
            
            return Response({
                'message': 'Meeting updated successfully',
                'meeting': response_serializer.data
            }, status=status.HTTP_200_OK)
            
        except TelehealthMeeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found or cannot be updated'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating meeting: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CancelScheduledMeetingView(APIView):
    """Cancel a scheduled meeting"""
    
    def post(self, request, meeting_id):
        try:
            meeting = TelehealthMeeting.objects.get(id=meeting_id, is_active=True)
            
            if meeting.status not in ['scheduled', 'started']:
                return Response(
                    {'error': 'Meeting cannot be cancelled'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update meeting status
            meeting.status = 'cancelled'
            meeting.is_active = False
            meeting.save()
            
            # Send cancellation emails
            attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
            EmailService.send_meeting_cancelled_email(meeting, attendees)
            
            logger.info(f"Meeting {meeting.id} cancelled")
            
            return Response({
                'message': 'Meeting cancelled successfully',
                'meeting_id': meeting.id
            }, status=status.HTTP_200_OK)
            
        except TelehealthMeeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error cancelling meeting: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import TokenAuthentication

class StartScheduledMeetingView(APIView):
    """Manually start a scheduled meeting (creates Chime meeting)"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        
        # Check if user can start meetings (only providers)
        if user_info['is_guest'] and user_info['user_type'] == 'patient':
            return Response(
                {'error': 'Patients cannot start meetings. Please wait for the provider.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                # Get the meeting from database
                meeting = TelehealthMeeting.objects.get(id=meeting_id, is_active=True)
                
                # Check if meeting is already started
                if meeting.status == 'started' and meeting.meeting_id:
                    from django.conf import settings
                    base_url = getattr(settings, 'FRONTEND_URL', 'https://dev-cloud.droidal.com')
                    jointoken = TeleHealthGuestAccessToken.objects.get(meeting_db_id=meeting.id)
                    attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
                    attendee = attendees.first()
                    meeting_link = (
                        f"{base_url}/patient-telehealth"
                        f"?token={jointoken.token}"
                        f"&meetingid={meeting.meeting_id}"
                        f"&name={attendee.name if attendee else ''}"
                    )

                    return Response({
                        'message': 'Meeting already started',
                        'meeting_id': meeting.meeting_id,
                        'meeting_link': meeting_link,
                        'meeting_info': {
                            'meeting_id': meeting.meeting_id,
                            'external_meeting_id': meeting.external_meeting_id,
                            'media_region': meeting.media_region,
                            'media_placement': meeting.media_placement
                        }
                    }, status=status.HTTP_200_OK)
                
                # Check if meeting is scheduled
                if meeting.status != 'scheduled':
                    return Response(
                        {'error': f'Meeting cannot be started. Current status: {meeting.status}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create Chime meeting (only if not already created)
                if not meeting.meeting_id:
                    chime_service = ChimeService()
                    meeting_info = chime_service.create_meeting()
                    
                    # Update meeting with Chime details
                    meeting.meeting_id = meeting_info['meeting_id']
                    meeting.external_meeting_id = meeting_info['external_meeting_id']
                    meeting.media_region = meeting_info['media_region']
                    meeting.media_placement = meeting_info['media_placement']
                else:
                    meeting_info = {
                        'meeting_id': meeting.meeting_id,
                        'external_meeting_id': meeting.external_meeting_id,
                        'media_region': meeting.media_region,
                        'media_placement': meeting.media_placement
                    }
                
                # Update meeting status
                now = timezone.now()
                meeting.actual_start_time = now
                meeting.status = 'started'
                meeting.save()
                
                # Update linked appointment status if exists
                if meeting.appoinment:
                    meeting.appoinment.confirmationstatus = 'in_progress'
                    meeting.appoinment.save()
                
                # Generate meeting link
                from django.conf import settings
                base_url = getattr(settings, 'FRONTEND_URL', 'https://dev-cloud.droidal.com')
                jointoken = TeleHealthGuestAccessToken.objects.get(meeting_db_id=meeting.id)
                attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
                attendee = attendees.first()

                meeting_link = (
                    f"{base_url}/patient-telehealth"
                    f"?token={jointoken.token}"
                    f"&meetingid={meeting.meeting_id}"
                    f"&name={attendee.name if attendee else ''}"
                )
                
                # Send start emails if not already sent
                if not meeting.start_email_sent:
                    attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
                    if attendees.exists():
                        try:
                            if EmailService.send_meeting_started_email(meeting, attendees, meeting_link):
                                meeting.start_email_sent = True
                                meeting.save()
                        except Exception as email_error:
                            logger.warning(f"Failed to send start emails: {str(email_error)}")
                
                logger.info(f"Meeting {meeting_id} started successfully by {user_info['user_name']}")
                
                return Response({
                    'message': 'Meeting started successfully',
                    'meeting_id': meeting.meeting_id,
                    'meeting_link': meeting_link,
                    'meeting_info': meeting_info,
                    'started_by': {
                        'name': user_info['user_name'],
                        'type': user_info['user_type']
                    }
                }, status=status.HTTP_200_OK)
                
        except TelehealthMeeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error starting meeting {meeting_id}: {str(e)}", exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetMeetingJoinInfoView(APIView):
    """Get meeting join information without starting it"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def get(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(id=meeting_id, is_active=True)
                
                if meeting.status != 'started' or not meeting.meeting_id:
                    return Response(
                        {'error': 'Meeting has not been started yet'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                from django.conf import settings
                base_url = getattr(settings, 'FRONTEND_URL', 'https://dev-cloud.droidal.com')
                jointoken = TeleHealthGuestAccessToken.objects.get(meeting_db_id=meeting.id)
                attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
                attendee = attendees.first()

                meeting_link = (
                    f"{base_url}/patient-telehealth"
                    f"?token={jointoken.token}"
                    f"&meetingid={meeting.meeting_id}"
                    f"&name={attendee.name if attendee else ''}"
                )
                
                return Response({
                    'meeting_id': meeting.meeting_id,
                    'meeting_link': meeting_link,
                    'meeting_title': meeting.meeting_title,
                    'status': meeting.status,
                    'started_at': meeting.actual_start_time,
                    'meeting_info': {
                        'meeting_id': meeting.meeting_id,
                        'external_meeting_id': meeting.external_meeting_id,
                        'media_region': meeting.media_region,
                        'media_placement': meeting.media_placement
                    }
                }, status=status.HTTP_200_OK)
                
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)



class EndScheduledMeetingView(APIView):
    """End a meeting and send summary"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        
        # Check permission to end meeting
        if not user_info['permissions'].get('can_end_meeting', False):
            return Response(
                {'error': 'You do not have permission to end meetings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(id=meeting_id, status='started', is_active=True)
                
                # End the Chime meeting
                if meeting.meeting_id:
                    chime_service = ChimeService()
                    try:
                        chime_service.delete_meeting(meeting.meeting_id)
                    except Exception as e:
                        logger.warning(f"Error deleting Chime meeting: {str(e)}")
                
                # Update meeting status
                meeting.status = 'ended'
                meeting.actual_end_time = timezone.now()
                meeting.save()
                
                # Send summary email asynchronously
                try:
                    send_meeting_summary_email.delay(meeting.id)
                except Exception as task_error:
                    logger.warning(f"Failed to queue summary email: {str(task_error)}")
                
                logger.info(f"Meeting {meeting.id} ended by {user_info['user_name']}")
                
                return Response({
                    'message': 'Meeting ended successfully',
                    'meeting_id': meeting.id
                }, status=status.HTTP_200_OK)
                
        except TelehealthMeeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found or not started'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error ending meeting: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
     

class PutCallOnHoldView(APIView):
    """Put the call on hold (disable audio/video temporarily)"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def post(self, request):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        meeting_id = request.data.get('meeting_id')  # Chime meeting ID
        on_hold = request.data.get('on_hold', True)
        attendee_id = request.data.get('attendee_id')  # Chime meeting ID
        
        if not meeting_id:
            return Response(
                {'error': 'meeting_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with schema_context(tenant_schema):
                # Find current user's attendee record
                attendee = TelehealthAttendee.objects.filter(
                    attendee_id=attendee_id
                ).first()
                
                if not attendee:
                    return Response(
                        {'error': 'Attendee not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                chime_service = ChimeService()
                
                if on_hold:
                    # Put on hold
                    attendee.is_muted = True
                    attendee.is_video_enabled = False
                    attendee.save()
                    
                    # Send system message
                    TelehealthChatMessage.objects.create(
                        meeting=attendee.meeting,
                        sender_name="System",
                        message_type='system',
                        content=f"{user_info['user_name']} put the call on hold"
                    )
                    
                    # Update Chime capabilities
                    chime_service.update_attendee_capabilities(
                        meeting_id,
                        attendee.attendee_id,
                        capabilities={'Audio': 'None', 'Video': 'None', 'Content': 'None'}
                    )
                    
                    message = 'Call is now on hold'
                else:
                    # Resume from hold
                    attendee.is_muted = False
                    attendee.is_video_enabled = True
                    attendee.save()
                    
                    # Send system message
                    TelehealthChatMessage.objects.create(
                        meeting=attendee.meeting,
                        sender_name="System",
                        message_type='system',
                        content=f"{user_info['user_name']} resumed the call"
                    )
                    
                    # Re-enable Chime capabilities based on permissions
                    capabilities = {
                        'Audio': 'SendReceive' if user_info['permissions'].get('can_use_audio') else 'None',
                        'Video': 'SendReceive' if user_info['permissions'].get('can_use_video') else 'None',
                        'Content': 'SendReceive' if user_info['permissions'].get('can_share_screen') else 'None'
                    }
                    chime_service.update_attendee_capabilities(
                        meeting_id,
                        attendee.attendee_id,
                        capabilities=capabilities
                    )
                    
                    message = 'Call resumed'
                
                logger.info(f"Hold toggled by {user_info['user_name']}: {on_hold}")
                
                return Response({
                    'attendee_id': attendee.attendee_id,
                    'on_hold': on_hold,
                    'message': message,
                    'timestamp': timezone.now().isoformat()
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error toggling hold: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetCallStatusView(APIView):
    """Get current status of a call"""
    authentication_classes = [JWTAuthentication, TokenAuthentication, GuestTokenAuthentication]
    permission_classes = [AllowGuestOrAuthenticated]
    
    def get(self, request, meeting_id):
        user_info = get_user_and_permissions(request)
        tenant_schema = get_tenant_schema(user_info)
        
        try:
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(meeting_id=meeting_id, is_active=True)
                attendees = TelehealthAttendee.objects.filter(meeting=meeting)
                
                participants = []
                for attendee in attendees:
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
                
        except TelehealthMeeting.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)
        

class GenerateGuestAccessView(APIView):
    """Generate guest access token for patient (Provider only)"""
    
    def post(self, request):
        # Must be authenticated provider
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        meeting_id = request.data.get('meeting_id')  # Database meeting ID
        patient_name = request.data.get('patient_name')
        patient_email = request.data.get('patient_email')
        patient_phone = request.data.get('patient_phone')
        expiry_hours = request.data.get('expiry_hours', 24)
        
        if not all([meeting_id, patient_name, patient_email]):
            return Response(
                {'error': 'meeting_id, patient_name, and patient_email are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            
            # Get meeting
            meeting = TelehealthMeeting.objects.get(id=meeting_id)
            
            # Get current tenant schema
            tenant_schema = connection.schema_name
            
            # Generate token
            token = TeleHealthGuestAccessToken.generate_token()
            token_hash = TeleHealthGuestAccessToken.hash_token(token)
            
            # Calculate expiry
            expires_at = timezone.now() + timedelta(hours=expiry_hours)
            
            # Store in PUBLIC schema (so it's accessible across tenants)
            with schema_context('public'):
                guest_token = TeleHealthGuestAccessToken.objects.create(
                    token=token,
                    token_hash=token_hash,
                    meeting_db_id=meeting.id,
                    user_type='patient',
                    user_name=patient_name,
                    user_email=patient_email,
                    user_phone=patient_phone or '',
                    tenant_schema=tenant_schema,
                    expires_at=expires_at
                )
            
            # Generate guest URL
            from django.conf import settings
            base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            guest_url = f"{base_url}/guest/join?token={token}"
            
            # Send email to patient
            from tenant_telehealth.email_service import EmailService
            self._send_guest_email(
                patient_email,
                patient_name,
                guest_url,
                meeting,
                expires_at
            )
            
            logger.info(f"Guest access token generated for {patient_email}")
            
            return Response({
                'message': 'Guest access token generated',
                'token': token,
                'guest_url': guest_url,
                'expires_at': expires_at.isoformat(),
                'patient_name': patient_name,
                'patient_email': patient_email
            }, status=status.HTTP_201_CREATED)
            
        except TelehealthMeeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Failed to generate guest token: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _send_guest_email(self, email, name, guest_url, meeting, expires_at):
        """Send guest access email to patient"""
        try:
            from tenant_telehealth.email_service import EmailService
            
            # Custom email for guest access
            # You can implement this in your EmailService
            pass
        except Exception as e:
            logger.error(f"Failed to send guest email: {str(e)}")


class ValidateGuestTokenView(APIView):
    """Validate guest token (No authentication required)"""
    
    def get(self, request):
        token = request.GET.get('token')
        
        if not token:
            return Response(
                {'error': 'Token parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            
            token_hash = TeleHealthGuestAccessToken.hash_token(token)
            
            # Look up in public schema
            with schema_context('public'):
                try:
                    guest_token = TeleHealthGuestAccessToken.objects.get(token_hash=token_hash)
                except TeleHealthGuestAccessToken.DoesNotExist:
                    return Response(
                        {'error': 'Invalid token', 'valid': False},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                is_valid = guest_token.is_valid()
                
                if not is_valid:
                    reason = 'expired' if guest_token.is_expired() else 'max_uses_exceeded'
                    return Response({
                        'valid': False,
                        'reason': reason,
                        'expires_at': guest_token.expires_at.isoformat()
                    }, status=status.HTTP_200_OK)
                
                # Resolve meeting details from the token's tenant schema
                meeting_title, scheduled_time = None, None
                try:
                    with schema_context(guest_token.tenant_schema):
                        m = TelehealthMeeting.objects.get(id=guest_token.meeting_db_id)
                        meeting_title = m.meeting_title
                        scheduled_time = (m.scheduled_start_time.isoformat()
                                          if m.scheduled_start_time else None)
                except TelehealthMeeting.DoesNotExist:
                    pass

                return Response({
                    'valid': True,
                    'patient_name': guest_token.user_name,
                    'meeting_title': meeting_title,
                    'scheduled_time': scheduled_time,
                    'expires_at': guest_token.expires_at.isoformat(),
                    'access_count': guest_token.access_count,
                    'max_access_count': guest_token.max_access_count
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error validating token: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GuestJoinMeetingView(APIView):
    """Join meeting as guest (No authentication required)"""
    authentication_classes = []
    permission_classes = []
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Token required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            token_hash = TeleHealthGuestAccessToken.hash_token(token)
            
            # Validate token in public schema
            with schema_context('public'):
                try:
                    guest_token = TeleHealthGuestAccessToken.objects.get(token_hash=token_hash)
                except TeleHealthGuestAccessToken.DoesNotExist:
                    return Response(
                        {'error': 'Invalid guest token'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                if not guest_token.is_valid():
                    return Response(
                        {'error': 'Token has expired or exceeded maximum uses'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                tenant_schema = guest_token.tenant_schema
                meeting_id = guest_token.meeting_db_id
                patient_name = guest_token.user_name
            
            # Switch to tenant schema and join meeting
            with schema_context(tenant_schema):
                meeting = TelehealthMeeting.objects.get(id=meeting_id)
                
                if meeting.status != 'started':
                    return Response(
                        {'error': 'Meeting has not started yet. Please wait for the provider.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create attendee with Chime
                chime_service = ChimeService()
                attendee_info = chime_service.create_attendee(
                    meeting_id=meeting.meeting_id,
                    attendee_name=f"{patient_name} (Guest)",
                )
                
                # Mark token as used
                with schema_context('public'):
                    ip_address = request.META.get('REMOTE_ADDR')
                    user_agent = request.META.get('HTTP_USER_AGENT', '')
                    guest_token.mark_used(ip_address, user_agent)
                
                logger.info(f"Guest {patient_name} joined meeting {meeting.meeting_id}")
                
                return Response({
                    'message': 'Successfully joined meeting as guest',
                    'meeting': {
                        'meeting_id': meeting.meeting_id,
                        'external_meeting_id': meeting.external_meeting_id,
                        'media_region': meeting.media_region,
                        'media_placement': meeting.media_placement
                    },
                    'attendee': attendee_info,
                    'patient_name': patient_name,
                    'is_guest': True
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Guest join failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )