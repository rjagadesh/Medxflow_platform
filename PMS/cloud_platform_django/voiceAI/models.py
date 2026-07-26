from django.db import models

# Create your models here.


class AgentLifeCycle(models.Model):

    SESSION_CHOICES = [
        ("Stateless", "Stateless"),
        ("Stateful", "Stateful"),
    ]

    TRIGGER_CHOICES = [
        ("Manual", "Manual"),
        ("Scheduled", "Scheduled"),
        ("Event-based", "Event-based"),
        ("Queue-based", "Queue-based"),
    ]

    FORWARD_TO_CHOICES = [
        ("Phone Number", "Phone Number"),
        ("SIP URI", "SIP URI"),
        ("Webhook", "Webhook"),
        ("Queue", "Queue"),
    ]

    retry_attempts = models.PositiveIntegerField(
        default=0,
    )

    retry_delay = models.PositiveIntegerField(
        default=0,
    )
    
    session_mode = models.CharField(
        max_length=50,
        choices=SESSION_CHOICES,
        default="Stateless"
    )

    session_timeout = models.PositiveIntegerField(
        default=0,
        help_text="Idle time in minutes (0 = never end)"
    )

    strategy = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    allowed_api_keys = models.JSONField(
        default=list,
        blank=True
    )

    # ✅ FIXED: Removed choices parameter from JSONField
    trigger_mode = models.JSONField(
        default=list,
    )

    forward_condition = models.JSONField(
        default=list
    )

    forward_keys = models.JSONField(
        default=dict,
        blank=True
    )

    forward_to = models.CharField(
        max_length=30,
        choices=FORWARD_TO_CHOICES,
        default="Phone Number"
    )

    forward_data = models.JSONField(
        default=list,
        blank=True
    )
    
    end_call_keys = models.JSONField(
        default=dict,
        blank=True
    )
    
    uni_directional_calls = models.JSONField(
        default=list,
        blank=True
    )
    
    bi_directional_calls = models.JSONField(
        default=list,
        blank=True
    )
    
    recording = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "agent_life_cycle"

    

class MobileNumber(models.Model):
    mobile_number = models.CharField(max_length=20, unique=True, db_index=True)
    twilio_sid = models.CharField(max_length=100, null=True)
    bin_url = models.CharField(max_length=250, null=True)
    twiml_bin_sid  = models.CharField(max_length=64, blank=True, null=True)  # ← new
    twiml_bin_url  = models.URLField(blank=True, null=True) # ← new
    client = models.ForeignKey(
        "accounts.Client",
        related_name="mobile_numbers",
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    # ✅ This IS the agent link — TelephonySettings belongs to one agent setup
    telephony_settings = models.ForeignKey(
        "TelephonySettings",
        related_name="mobile_numbers",
        on_delete=models.PROTECT,
        null=True,
        blank=True  # null = number is available, not null = number is in use
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "mobile_numbers"

    @property
    def is_assigned(self):
        return self.telephony_settings is not None

    @property
    def client_name(self):
        return self.telephony_settings.client if self.telephony_settings else None


class TelephonySettings(models.Model):
    client = models.ForeignKey(
        "accounts.Client",
        related_name="agents",
        on_delete=models.CASCADE
    )

    TRANSPORT_CHOICES = [
        ("PSTN", "PSTN"),
        ("WebRTC", "WebRTC"),
    ]

    inbound_enabled = models.BooleanField(default=True)
    outbound_enabled = models.BooleanField(default=False)

    transport_type = models.CharField(
        max_length=10,
        choices=TRANSPORT_CHOICES,
        default="PSTN"
    )

    call_timeout = models.PositiveIntegerField(default=30)
    call_recording = models.BooleanField(default=True)
    max_concurrent_calls = models.PositiveIntegerField(default=50)
    max_inbound_ring_duration = models.PositiveIntegerField(default=30)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "telephony_settings"

    def __str__(self):
        return f"Agent {self.id} - {self.client}"


class AgentVersion(models.Model):
    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("Active", "Active"),
        ("Paused", "Paused"),
        ("Testing", "Testing"),
    ]
    AGENT_TYPE_CHOICES = [
        ("Conversation", "Conversation"),
        ("Action", "Action"),
    ]
    VOICE_TYPE_CHOICES = [
        ("Real Time", "Real Time"),
        ("STT-TTS", "STT-TTS"),
    ]
    BACKGROUND_AUDIO_CHOICES = [
        ("none", "None"),
        ("office_ambience", "Office ambience"),
    ]
    active_days = models.JSONField(default=list, blank=True)
    client_id = models.ForeignKey("accounts.Client", on_delete=models.CASCADE, null=True, blank=True, related_name="agent_versions")
    life_cycle_id = models.ForeignKey(AgentLifeCycle, related_name="agent_life_cycle", on_delete=models.CASCADE, null=True, blank=True)
    Telephony_Settings_id = models.ForeignKey(TelephonySettings, related_name="Telephony_Settings", on_delete=models.CASCADE, null=True, blank=True)
    weekend_support = models.BooleanField(default=False)
    agent_name = models.CharField(max_length=255, blank=True, null=True)
    version_number = models.CharField(max_length=20) # e.g. "v1.0"
    voice = models.CharField(max_length=100, blank=True, null=True) 
    language = models.CharField(max_length=100, blank=True, null=True)
    agent_type = models.CharField(max_length=50, choices=AGENT_TYPE_CHOICES, default="Conversation")
    voice_type = models.CharField(max_length=50, choices=VOICE_TYPE_CHOICES, default="Real Time")
    background_audio = models.CharField(max_length=32, choices=BACKGROUND_AUDIO_CHOICES, default="none")

    app = models.ForeignKey("modules.App", on_delete=models.SET_NULL, null=True, blank=True)
    gemini_model = models.CharField(max_length=100, blank=True, null=True)

    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Draft")
    
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_agent_versions")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    timezone = models.CharField(max_length=100, blank=True, null=True)
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    class Meta:
        db_table = "agent_version"
        # unique_together = ('app', 'version_number')
        unique_together = ('client_id','app', 'version_number')


# class AgentPrompt(models.Model):
#     agent = models.OneToOneField(AgentVersion, on_delete=models.CASCADE, related_name='prompt',null=True,blank=True)
#     role = models.TextField(blank=True, null=True)
#     task = models.TextField(blank=True, null=True)
#     context = models.TextField(blank=True, null=True)
#     few_shot = models.TextField(blank=True, null=True)
#     rules = models.TextField(blank=True, null=True)
    
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = "agent_prompt"
class AgentScript(models.Model):
    agent = models.OneToOneField(AgentVersion, on_delete=models.CASCADE, related_name='script', null=True, blank=True)
    script = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "agent_script"

class ConfigJSON(models.Model):
    app = models.ForeignKey("modules.App", on_delete=models.CASCADE, related_name="config_json")
    config_data = models.JSONField(default=dict, blank=True)
    client = models.ForeignKey(
        "accounts.Client",
        on_delete=models.CASCADE,
        related_name="config_json",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "config_json"
        unique_together = ('app', 'client')

class ConversationProcess(models.Model):
    app_default = models.ForeignKey("modules.App", on_delete=models.CASCADE, related_name="conversation_processes_app",null=True,blank=True)
    config = models.ForeignKey(ConfigJSON, on_delete=models.CASCADE, related_name="conversation_process",null=True,blank=True)
    app_num = models.ForeignKey(AgentVersion,related_name='conversation',on_delete=models.CASCADE,null=True,blank=True)
    conversation_data = models.TextField(null=True,blank=True)
    input_json = models.JSONField(default=list,blank=True)
    output_json = models.JSONField(default=list,blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = "conversation_process"


class CallLog(models.Model):
    CALL_STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("transferred", "Transferred"),
    ]
    
    CONFIG_SOURCE_CHOICES = [
        ("API", "API"),
        ("Default", "Default"),
    ]
    
    # Identifiers
    call_id = models.CharField(max_length=255, unique=True, db_index=True)
    agent_task = models.ForeignKey(
        "agentsapp.AgentTask",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="call_logs",
        db_index=True
    )
    
    agent_version = models.ForeignKey(
        AgentVersion, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="call_logs"
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="call_logs"
    )
    app = models.ForeignKey(
        "modules.App",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="call_logs"
    )
    
    # Phone Numbers
    from_number = models.CharField(max_length=20, null=True, blank=True)
    to_number = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    
    # Call Timing
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    
    # AI Configuration
    voice = models.CharField(max_length=100, null=True, blank=True)
    model = models.CharField(max_length=255, null=True, blank=True)
    config_source = models.CharField(
        max_length=20, 
        choices=CONFIG_SOURCE_CHOICES,
        default="Default"
    )
    
    # File Paths (Local)
    recording_path = models.TextField(null=True, blank=True)
    transcript_path = models.TextField(null=True, blank=True)
    
    # S3 URLs
    recording_s3_url = models.URLField(max_length=500, null=True, blank=True)
    transcript_s3_url = models.URLField(max_length=500, null=True, blank=True)
    call_log_s3_url = models.URLField(max_length=500, null=True, blank=True)
    extracted_s3_url = models.URLField(max_length=500, null=True, blank=True)
    # Status
    status = models.CharField(
        max_length=20,
        choices=CALL_STATUS_CHOICES,
        default="in_progress",
        db_index=True
    )
    
    # Metadata
    call_metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "call_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at", "status"]),
            models.Index(fields=["to_number", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["app", "-created_at"]),
        ]
    
    def __str__(self):
        return f"Call {self.call_id} - {self.status}"
    
    @property
    def duration_formatted(self):
        """Return duration in MM:SS format"""
        if self.duration_seconds:
            minutes = int(self.duration_seconds // 60)
            seconds = int(self.duration_seconds % 60)
            return f"{minutes:02d}:{seconds:02d}"
        return "00:00"

