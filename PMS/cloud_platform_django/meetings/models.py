from django.db import models
from django.conf import settings

class Meeting(models.Model):
    meeting_id = models.CharField(max_length=255, unique=True)
    external_meeting_id = models.CharField(max_length=255, unique=True)
    media_region = models.CharField(max_length=50)
    media_placement = models.JSONField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_recording = models.BooleanField(default=False)
    recording_started_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Meeting {self.external_meeting_id}"
    
    class Meta:
        app_label = "meetings"

class Attendee(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='attendees')
    attendee_id = models.CharField(max_length=255)
    external_user_id = models.CharField(max_length=255)
    attendee_name = models.CharField(max_length=255)
    join_token = models.TextField()
    joined_at = models.DateTimeField(auto_now_add=True)
    is_muted = models.BooleanField(default=False)
    is_video_enabled = models.BooleanField(default=True)
    is_screen_sharing = models.BooleanField(default=False)

    class Meta:
        app_label = "meetings"
        unique_together = ('meeting', 'external_user_id')

    def __str__(self):
        return f"{self.attendee_name} in {self.meeting.external_meeting_id}"

class AudioCallSession(models.Model):
    CALL_STATUS = [
        ('initiating', 'Initiating'),
        ('ringing', 'Ringing'),
        ('connected', 'Connected'),
        ('on_hold', 'On Hold'),
        ('ended', 'Ended'),
        ('failed', 'Failed'),
    ]
    
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='audio_sessions')
    attendee = models.ForeignKey(Attendee, on_delete=models.CASCADE, related_name='audio_sessions')
    status = models.CharField(max_length=20, choices=CALL_STATUS, default='initiating')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    is_muted = models.BooleanField(default=False)
    audio_quality = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        app_label = "meetings"
    
    def __str__(self):
        return f"Audio session for {self.attendee.attendee_name} - {self.status}"

class ScreenShareSession(models.Model):
    SHARE_STATUS = [
        ('starting', 'Starting'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('stopped', 'Stopped'),
    ]
    
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='screen_shares')
    attendee = models.ForeignKey(Attendee, on_delete=models.CASCADE, related_name='screen_shares')
    status = models.CharField(max_length=20, choices=SHARE_STATUS, default='starting')
    started_at = models.DateTimeField(auto_now_add=True)
    stopped_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    content_type = models.CharField(max_length=50, default='screen')  # screen, window, tab
    
    class Meta:
        app_label = "meetings"
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Screen share by {self.attendee.attendee_name} - {self.status}"

class MeetingRecording(models.Model):
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
    
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='recordings')
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
    started_by = models.ForeignKey(Attendee, on_delete=models.SET_NULL, null=True, related_name='started_recordings')
    
    class Meta:
        app_label = "meetings"
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Recording {self.recording_id} - {self.status}"

class ChatMessage(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('system', 'System'),
        ('file', 'File'),
    ]
    
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='chat_messages')
    attendee = models.ForeignKey(Attendee, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    sender_name = models.CharField(max_length=255)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    content = models.TextField()
    file_url = models.URLField(blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    
    class Meta:
        app_label = "meetings"
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender_name}: {self.content[:50]} at {self.timestamp}"
    

from django.db import models
from django.conf import settings

# Add these new models to your existing models.py

class MeetingTranscript(models.Model):
    """Stores complete meeting transcripts"""
    
    TRANSCRIPT_STATUS = [
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    meeting = models.OneToOneField(
        'Meeting',
        on_delete=models.CASCADE,
        related_name='transcript'
    )
    
    # Transcript content
    full_transcript = models.TextField(blank=True)
    
    # Metadata
    status = models.CharField(max_length=20, choices=TRANSCRIPT_STATUS, default='processing')
    language = models.CharField(max_length=10, default='en-US')
    total_words = models.IntegerField(default=0)
    total_speakers = models.IntegerField(default=0)
    
    # Storage
    s3_bucket = models.CharField(max_length=255, null=True, blank=True)
    s3_key = models.CharField(max_length=500, null=True, blank=True)
    file_url = models.URLField(null=True, blank=True)
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Settings
    enable_speaker_identification = models.BooleanField(default=True)
    enable_medical_terminology = models.BooleanField(default=True)
    
    class Meta:
        app_label = "meetings"
        db_table = 'meeting_transcript'
    
    def __str__(self):
        return f"Transcript for {self.meeting.meeting_title or self.meeting.meeting_id}"


class TranscriptSegment(models.Model):
    """Individual transcript segments with speaker identification"""
    
    transcript = models.ForeignKey(
        MeetingTranscript,
        on_delete=models.CASCADE,
        related_name='segments'
    )
    
    # Content
    text = models.TextField()
    speaker_label = models.CharField(max_length=50)  # "Speaker 1", "Dr. Smith", etc.
    speaker_name = models.CharField(max_length=255, null=True, blank=True)
    
    # Timing
    start_time = models.FloatField()  # Seconds from meeting start
    end_time = models.FloatField()
    duration = models.FloatField()
    
    # Confidence
    confidence = models.FloatField(default=0.0)  # 0.0 to 1.0
    
    # Word-level data (JSON)
    words = models.JSONField(default=list, blank=True)
    # Format: [{"word": "hello", "start": 0.5, "end": 0.8, "confidence": 0.95}, ...]
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = "meetings"
        db_table = 'transcript_segment'
        ordering = ['start_time']
    
    def __str__(self):
        return f"{self.speaker_label}: {self.text[:50]}..."


class LiveCaption(models.Model):
    """Real-time captions during the meeting"""
    
    meeting = models.ForeignKey(
        'Meeting',
        on_delete=models.CASCADE,
        related_name='live_captions'
    )
    
    attendee = models.ForeignKey(
        'Attendee',
        on_delete=models.CASCADE,
        related_name='captions',
        null=True,
        blank=True
    )
    
    # Caption content
    text = models.TextField()
    is_final = models.BooleanField(default=False)  # False = partial, True = final
    
    # Speaker
    speaker_label = models.CharField(max_length=50, null=True, blank=True)
    
    # Timing
    timestamp = models.DateTimeField(auto_now_add=True)
    sequence_number = models.IntegerField(default=0)
    
    # Confidence
    confidence = models.FloatField(default=0.0)
    
    class Meta:
        app_label = "meetings"
        db_table = 'live_caption'
        ordering = ['sequence_number']
    
    def __str__(self):
        return f"{self.speaker_label}: {self.text[:50]}..."


class MeetingKeyword(models.Model):
    """Medical keywords and phrases extracted from transcript"""
    
    transcript = models.ForeignKey(
        MeetingTranscript,
        on_delete=models.CASCADE,
        related_name='keywords'
    )
    
    keyword = models.CharField(max_length=255)
    category = models.CharField(max_length=100)  # "symptom", "diagnosis", "medication", etc.
    frequency = models.IntegerField(default=1)
    confidence = models.FloatField(default=0.0)
    
    # Timestamps where keyword appears
    timestamps = models.JSONField(default=list)  # [12.5, 45.2, 78.9]
    
    class Meta:
        app_label = "meetings"
        db_table = 'meeting_keyword'
        unique_together = ('transcript', 'keyword')
    
    def __str__(self):
        return f"{self.keyword} ({self.frequency}x)"


class TranscriptAnalysis(models.Model):
    """AI analysis of meeting transcript"""
    
    transcript = models.OneToOneField(
        MeetingTranscript,
        on_delete=models.CASCADE,
        related_name='analysis'
    )
    
    # Summary
    summary = models.TextField(blank=True)
    key_points = models.JSONField(default=list)
    
    # Medical analysis
    diagnoses_mentioned = models.JSONField(default=list)
    symptoms_mentioned = models.JSONField(default=list)
    medications_mentioned = models.JSONField(default=list)
    procedures_discussed = models.JSONField(default=list)
    
    # Action items
    action_items = models.JSONField(default=list)
    follow_up_required = models.BooleanField(default=False)
    
    # Sentiment
    overall_sentiment = models.CharField(max_length=50, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = "meetings"
        db_table = 'transcript_analysis'
    
    def __str__(self):
        return f"Analysis for {self.transcript}"