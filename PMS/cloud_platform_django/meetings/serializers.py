from rest_framework import serializers
from .models import *

class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = ['meeting_id', 'external_meeting_id', 'media_region', 
                  'media_placement', 'created_at', 'is_active']

class AttendeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendee
        fields = ['attendee_id', 'external_user_id', 'attendee_name', 
                  'join_token', 'joined_at']

class CreateMeetingSerializer(serializers.Serializer):
    attendee_name = serializers.CharField(max_length=255)

class JoinMeetingSerializer(serializers.Serializer):
    meeting_id = serializers.CharField(max_length=255)
    attendee_name = serializers.CharField(max_length=255)

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
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
        model = AudioCallSession
        fields = ['id', 'attendee_id', 'attendee_name', 'status', 'started_at', 
                  'ended_at', 'duration_seconds', 'is_muted', 'audio_quality']
        

class ScreenShareSerializer(serializers.ModelSerializer):
    attendee_name = serializers.CharField(source='attendee.attendee_name', read_only=True)
    attendee_id = serializers.CharField(source='attendee.attendee_id', read_only=True)
    meeting_id = serializers.CharField(source='meeting.meeting_id', read_only=True)
    
    class Meta:
        model = ScreenShareSession
        fields = ['id', 'meeting_id', 'attendee_id', 'attendee_name', 'status',
                  'started_at', 'stopped_at', 'duration_seconds', 'content_type']

class RecordingSerializer(serializers.ModelSerializer):
    meeting_id = serializers.CharField(source='meeting.meeting_id', read_only=True)
    started_by_name = serializers.CharField(source='started_by.attendee_name', 
                                           read_only=True, allow_null=True)
    
    class Meta:
        model = MeetingRecording
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