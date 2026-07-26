from rest_framework import serializers
from .models import *
from django.utils import timezone
class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelehealthMeeting
        fields = ['meeting_id', 'external_meeting_id', 'media_region', 
                  'media_placement', 'created_at', 'is_active']

class AttendeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelehealthAttendee
        fields = ['attendee_id', 'external_user_id', 'attendee_name', 
                  'join_token', 'joined_at']

class CreateMeetingSerializer(serializers.Serializer):
    attendee_name = serializers.CharField(max_length=255)

class JoinMeetingSerializer(serializers.Serializer):
    meeting_id = serializers.CharField(max_length=255)
    attendee_name = serializers.CharField(max_length=255)

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelehealthChatMessage
        fields = ['id', 'meeting', 'attendee', 'sender_name', 'message_type', 
                  'content', 'file_url', 'file_name', 'timestamp', 'is_deleted']
        read_only_fields = ['id', 'timestamp']

class SendMessageSerializer(serializers.Serializer):
    meeting_id = serializers.CharField(max_length=255)
    attendee_id = serializers.CharField(max_length=255)
    content = serializers.CharField()
    message_type = serializers.ChoiceField(
        choices=['text', 'system', 'file'],
        default='text'
    )
    file_url = serializers.URLField(required=False, allow_blank=True)
    file_name = serializers.CharField(max_length=255, required=False, allow_blank=True)

class UpdateAudioStatusSerializer(serializers.Serializer):
    meeting_id = serializers.CharField(max_length=255)
    attendee_id = serializers.CharField(max_length=255)
    is_muted = serializers.BooleanField()

class AudioCallSessionSerializer(serializers.ModelSerializer):
    attendee_name = serializers.CharField(source='attendee.attendee_name', read_only=True)
    attendee_id = serializers.CharField(source='attendee.attendee_id', read_only=True)
    
    class Meta:
        model = TelehealthAudioCallSession
        fields = ['id', 'attendee_id', 'attendee_name', 'status', 'started_at', 
                  'ended_at', 'duration_seconds', 'is_muted', 'audio_quality']
        

class ScreenShareSerializer(serializers.ModelSerializer):
    attendee_name = serializers.CharField(source='attendee.attendee_name', read_only=True)
    attendee_id = serializers.CharField(source='attendee.attendee_id', read_only=True)
    meeting_id = serializers.CharField(source='meeting.meeting_id', read_only=True)
    
    class Meta:
        model = TelehealthScreenShareSession
        fields = ['id', 'meeting_id', 'attendee_id', 'attendee_name', 'status',
                  'started_at', 'stopped_at', 'duration_seconds', 'content_type']

class RecordingSerializer(serializers.ModelSerializer):
    meeting_id = serializers.CharField(source='meeting.meeting_id', read_only=True)
    started_by_name = serializers.CharField(source='started_by.attendee_name', 
                                           read_only=True, allow_null=True)
    
    class Meta:
        model = TelehealthMeetingRecording
        fields = ['id', 'recording_id', 'meeting_id', 'status', 'recording_type',
                  'started_at', 'stopped_at', 'duration_seconds', 'file_url',
                  'file_size_mb', 'started_by_name']

class StartRecordingSerializer(serializers.Serializer):
    meeting_id = serializers.CharField(max_length=255)
    attendee_id = serializers.CharField(max_length=255)
    recording_type = serializers.ChoiceField(
        choices=['audio', 'video', 'screen', 'composite'],
        default='composite'
    )

class AttendeeInputSerializer(serializers.Serializer):
    """Serializer for attendee input when scheduling"""
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    is_organizer = serializers.BooleanField(default=False)


class ScheduleMeetingSerializer(serializers.Serializer):
    """Serializer for scheduling a new meeting"""
    meeting_title = serializers.CharField(max_length=255)
    meeting_description = serializers.CharField(required=False, allow_blank=True)
    scheduled_start_time = serializers.DateTimeField()
    scheduled_end_time = serializers.DateTimeField()
    attendees = AttendeeInputSerializer(many=True)
    
    def validate_scheduled_start_time(self, value):
        """Ensure start time is in the future"""
        if value <= timezone.now():
            raise serializers.ValidationError("Start time must be in the future")
        return value
    
    def validate(self, data):
        """Validate that end time is after start time"""
        if data['scheduled_end_time'] <= data['scheduled_start_time']:
            raise serializers.ValidationError("End time must be after start time")
        
        # Validate at least one attendee
        if not data.get('attendees'):
            raise serializers.ValidationError("At least one attendee is required")
        
        # Validate at least one organizer
        organizers = [a for a in data['attendees'] if a.get('is_organizer')]
        if not organizers:
            raise serializers.ValidationError("At least one organizer is required")
        
        return data


class UpdateScheduledMeetingSerializer(serializers.Serializer):
    """Serializer for updating a scheduled meeting"""
    meeting_title = serializers.CharField(max_length=255, required=False)
    meeting_description = serializers.CharField(required=False, allow_blank=True)
    scheduled_start_time = serializers.DateTimeField(required=False)
    scheduled_end_time = serializers.DateTimeField(required=False)
    attendees = AttendeeInputSerializer(many=True, required=False)
    
    def validate_scheduled_start_time(self, value):
        """Ensure start time is in the future"""
        if value <= timezone.now():
            raise serializers.ValidationError("Start time must be in the future")
        return value


class ScheduledAttendeeSerializer(serializers.ModelSerializer):
    """Serializer for scheduled attendee details"""
    class Meta:
        model = ScheduledMeetingAttendee
        fields = ['id', 'email', 'name', 'is_organizer', 'created_at']


class ScheduledMeetingSerializer(serializers.ModelSerializer):
    """Serializer for scheduled meeting with attendees"""
    attendees = ScheduledAttendeeSerializer(source='scheduled_attendees', many=True, read_only=True)
    organizer_name = serializers.SerializerMethodField()
    time_until_start = serializers.SerializerMethodField()
    can_start = serializers.SerializerMethodField()
    
    class Meta:
        model = TelehealthMeeting
        fields = [
            'id',
            'meeting_id',
            'meeting_title',
            'meeting_description',
            'scheduled_start_time',
            'scheduled_end_time',
            'actual_start_time',
            'actual_end_time',
            'status',
            'created_at',
            'creation_email_sent',
            'reminder_email_sent',
            'start_email_sent',
            'organizer_name',
            'time_until_start',
            'can_start',
            'attendees'
        ]
    
    def get_organizer_name(self, obj):
        """Get the name of the organizer"""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return "System"
    
    def get_time_until_start(self, obj):
        """Calculate time until meeting starts (in minutes)"""
        if obj.scheduled_start_time and obj.status == 'scheduled':
            now = timezone.now()
            delta = obj.scheduled_start_time - now
            minutes = int(delta.total_seconds() / 60)
            return minutes if minutes > 0 else 0
        return None
    
    def get_can_start(self, obj):
        """Check if meeting can be started (within 15 minutes of scheduled time)"""
        if obj.status != 'scheduled':
            return False
        
        now = timezone.now()
        time_until = (obj.scheduled_start_time - now).total_seconds() / 60
        return -5 <= time_until <= 15  # Can start 15 mins before to 5 mins after


class MeetingLinkSerializer(serializers.Serializer):
    """Serializer for meeting join link"""
    meeting_id = serializers.CharField()
    meeting_link = serializers.URLField()
    meeting_title = serializers.CharField()
    scheduled_start_time = serializers.DateTimeField()