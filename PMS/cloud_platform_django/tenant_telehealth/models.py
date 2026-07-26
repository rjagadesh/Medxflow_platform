from django.db import models
from django.conf import settings
import secrets
import hashlib
from django.utils import timezone

class TelehealthMeeting(models.Model):
    appoinment = models.ForeignKey('tenant_app.Appointment', on_delete=models.CASCADE, related_name='appoinments', null=True, blank=True)
    meeting_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    external_meeting_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    media_region = models.CharField(max_length=50, null=True, blank=True)
    media_placement = models.JSONField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_recording = models.BooleanField(default=False)
    recording_started_at = models.DateTimeField(null=True, blank=True)
    
    # Scheduling fields
    scheduled_start_time = models.DateTimeField(null=True, blank=True)
    scheduled_end_time = models.DateTimeField(null=True, blank=True)
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    meeting_title = models.CharField(max_length=255, null=True, blank=True)
    meeting_description = models.TextField(null=True, blank=True)
    
    # Email notification tracking
    creation_email_sent = models.BooleanField(default=False)
    reminder_email_sent = models.BooleanField(default=False)
    start_email_sent = models.BooleanField(default=False)
    
    # Meeting status
    MEETING_STATUS = [
        ('scheduled', 'Scheduled'),
        ('started', 'Started'),
        ('ended', 'Ended'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=MEETING_STATUS, default='scheduled')

    def __str__(self):
        return f"Meeting {self.meeting_title or self.external_meeting_id}"
    
    class Meta:
        app_label = "tenant_telehealth"
        db_table = 'telehealth_meeting'


class ScheduledMeetingAttendee(models.Model):
    """Store attendees for scheduled meetings before meeting is actually created"""
    meeting = models.ForeignKey(TelehealthMeeting, on_delete=models.CASCADE, related_name='scheduled_attendees')
    email = models.EmailField()
    name = models.CharField(max_length=255)
    is_organizer = models.BooleanField(default=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = "tenant_telehealth"
        db_table = 'scheduled_meeting_attendee'
        unique_together = ('meeting', 'email')
    
    def __str__(self):
        return f"{self.name} - {self.email}"


class TelehealthAttendee(models.Model):
    meeting = models.ForeignKey(TelehealthMeeting, on_delete=models.CASCADE, related_name='attendees')
    attendee_id = models.CharField(max_length=255)
    external_user_id = models.CharField(max_length=255)
    attendee_name = models.CharField(max_length=255)
    join_token = models.TextField()
    joined_at = models.DateTimeField(auto_now_add=True)
    is_muted = models.BooleanField(default=False)
    is_video_enabled = models.BooleanField(default=True)
    is_screen_sharing = models.BooleanField(default=False)

    class Meta:
        app_label = "tenant_telehealth"
        unique_together = ('meeting', 'external_user_id')
        db_table = 'telehealth_attendee'

    def __str__(self):
        return f"{self.attendee_name} in {self.meeting.external_meeting_id}"


class TelehealthAudioCallSession(models.Model):
    CALL_STATUS = [
        ('initiating', 'Initiating'),
        ('ringing', 'Ringing'),
        ('connected', 'Connected'),
        ('on_hold', 'On Hold'),
        ('ended', 'Ended'),
        ('failed', 'Failed'),
    ]
    
    meeting = models.ForeignKey(TelehealthMeeting, on_delete=models.CASCADE, related_name='audio_sessions')
    attendee = models.ForeignKey(TelehealthAttendee, on_delete=models.CASCADE, related_name='audio_sessions')
    status = models.CharField(max_length=20, choices=CALL_STATUS, default='initiating')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    is_muted = models.BooleanField(default=False)
    audio_quality = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        app_label = "tenant_telehealth"
        db_table = 'telehealth_audiocall_session'
    
    def __str__(self):
        return f"Audio session for {self.attendee.attendee_name} - {self.status}"


class TelehealthScreenShareSession(models.Model):
    SHARE_STATUS = [
        ('starting', 'Starting'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('stopped', 'Stopped'),
    ]
    
    meeting = models.ForeignKey(TelehealthMeeting, on_delete=models.CASCADE, related_name='screen_shares')
    attendee = models.ForeignKey(TelehealthAttendee, on_delete=models.CASCADE, related_name='screen_shares')
    status = models.CharField(max_length=20, choices=SHARE_STATUS, default='starting')
    started_at = models.DateTimeField(auto_now_add=True)
    stopped_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    content_type = models.CharField(max_length=50, default='screen')
    
    class Meta:
        app_label = "tenant_telehealth"
        ordering = ['-started_at']
        db_table = 'telehealth_screenshare_session'
    
    def __str__(self):
        return f"Screen share by {self.attendee.attendee_name} - {self.status}"


class TelehealthMeetingRecording(models.Model):
    RECORDING_STATUS = [
        ('starting', 'Starting'),
        ('recording', 'Recording'),
        ('paused', 'Paused'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    RECORDING_TYPE = [
        ('audio', 'Audio Only'),
        ('video', 'Video'),
        ('screen', 'Screen Share'),
        ('composite', 'Composite'),
    ]
    
    meeting = models.ForeignKey(TelehealthMeeting, on_delete=models.CASCADE, related_name='recordings')
    recording_id = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=20, choices=RECORDING_STATUS, default='starting')
    recording_type = models.CharField(max_length=20, choices=RECORDING_TYPE, default='composite')
    started_at = models.DateTimeField(auto_now_add=True)
    stopped_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    file_url = models.URLField(null=True, blank=True)
    file_size_mb = models.FloatField(null=True, blank=True)
    s3_bucket = models.CharField(max_length=255, null=True, blank=True)
    s3_key = models.CharField(max_length=500, null=True, blank=True)
    started_by = models.ForeignKey(TelehealthAttendee, on_delete=models.SET_NULL, null=True, related_name='started_recordings')
    
    class Meta:
        app_label = "tenant_telehealth"
        ordering = ['-started_at']
        db_table = 'telehealth_meetingrecords'
    
    def __str__(self):
        return f"Recording {self.recording_id} - {self.status}"


class TelehealthChatMessage(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('system', 'System'),
        ('file', 'File'),
    ]
    
    meeting = models.ForeignKey(TelehealthMeeting, on_delete=models.CASCADE, related_name='chat_messages')
    attendee = models.ForeignKey(TelehealthAttendee, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    sender_name = models.CharField(max_length=255)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    content = models.TextField()
    file_url = models.URLField(blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    
    class Meta:
        app_label = "tenant_telehealth"
        db_table = 'telehealth_chatmessage'
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender_name}: {self.content[:50]} at {self.timestamp}"
