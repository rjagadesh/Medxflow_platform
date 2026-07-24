"""
Voice AI models.

A ``VoiceAgent`` is a configurable conversational agent that belongs to a
tenant. Users build and tune agents through the Voice AI studio: identity,
voice & language, and the prompt / behaviour that drives it. Choice sets are
defined here so the API and the UI share a single source of truth.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class VoiceAgent(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        PAUSED = "PAUSED", "Paused"

    # Friendly, provider-neutral voice options.
    class Voice(models.TextChoices):
        ARIA = "ARIA", "Aria — warm, friendly"
        JAMES = "JAMES", "James — calm, professional"
        SOFIA = "SOFIA", "Sofia — bright, energetic"
        LEO = "LEO", "Leo — deep, reassuring"
        NOVA = "NOVA", "Nova — neutral, clear"

    class Language(models.TextChoices):
        EN_US = "en-US", "English (US)"
        EN_GB = "en-GB", "English (UK)"
        ES_ES = "es-ES", "Spanish"
        FR_FR = "fr-FR", "French"
        DE_DE = "de-DE", "German"
        HI_IN = "hi-IN", "Hindi"

    # Model tiers the agent can run on (see the project's model guidance).
    class Model(models.TextChoices):
        HAIKU = "claude-haiku-4-5", "Haiku 4.5 — fastest"
        SONNET = "claude-sonnet-5", "Sonnet 5 — balanced"
        OPUS = "claude-opus-4-8", "Opus 4.8 — most capable"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="voice_agents"
    )
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)
    persona = models.CharField(
        max_length=120, blank=True, help_text="A short personality descriptor."
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)

    # Voice & language
    voice = models.CharField(max_length=20, choices=Voice.choices, default=Voice.ARIA)
    language = models.CharField(
        max_length=10, choices=Language.choices, default=Language.EN_US
    )
    greeting = models.TextField(
        blank=True, help_text="The first thing the agent says."
    )

    # Brain / prompt
    system_prompt = models.TextField(
        blank=True, help_text="Instructions that define how the agent behaves."
    )
    model = models.CharField(max_length=40, choices=Model.choices, default=Model.SONNET)
    temperature = models.FloatField(
        default=0.7, help_text="0 = focused/deterministic, 1 = creative."
    )

    # -- Extended agent configuration (Droidal-style config screen) ---------
    class VoiceType(models.TextChoices):
        REALTIME = "REALTIME", "Real Time"
        STT_TTS = "STT_TTS", "STT-TTS"

    class CallDirection(models.TextChoices):
        INBOUND = "INBOUND", "Inbound"
        OUTBOUND = "OUTBOUND", "Outbound"
        REMINDER = "REMINDER", "Remainder"
        OUTBOUND_PATIENT = "OUTBOUND_PATIENT", "Outbound Patient"

    agent_type = models.CharField(max_length=40, default="Conversation")
    voice_type = models.CharField(max_length=12, choices=VoiceType.choices, default=VoiceType.STT_TTS)
    voice_gender = models.CharField(max_length=10, default="Female")
    background_audio = models.CharField(max_length=60, blank=True)
    call_direction = models.CharField(max_length=20, choices=CallDirection.choices, default=CallDirection.INBOUND)
    system_integration = models.BooleanField(default=False)

    # Phone settings
    phone_numbers = models.JSONField(default=list, blank=True)
    max_concurrent_calls = models.PositiveIntegerField(default=5)
    call_recording = models.CharField(max_length=40, blank=True)

    # Call settings — forwarding & end messages
    end_call_messages = models.JSONField(default=list, blank=True)
    forward_messages = models.JSONField(default=list, blank=True)
    retry = models.PositiveIntegerField(default=0)
    delay_minutes = models.PositiveIntegerField(default=0)
    keys = models.JSONField(default=list, blank=True)
    continue_recording_after_forward = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_agents",
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.name} ({self.tenant.slug})"


class AgentVersion(models.Model):
    """A saved version snapshot of an agent (the Agent Versioning table)."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        PAUSED = "PAUSED", "Paused"

    agent = models.ForeignKey(
        VoiceAgent, on_delete=models.CASCADE, related_name="versions"
    )
    version = models.CharField(max_length=20)  # e.g. "v1.1"
    voice_type = models.CharField(max_length=20, default="STT-TTS")
    agent_type = models.CharField(max_length=40, default="Conversation")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.agent.name} {self.version}"


class Campaign(models.Model):
    """An outbound calling campaign run by a voice agent (feature #11)."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        RUNNING = "RUNNING", "Running"
        PAUSED = "PAUSED", "Paused"
        COMPLETED = "COMPLETED", "Completed"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="campaigns"
    )
    agent = models.ForeignKey(
        VoiceAgent, on_delete=models.CASCADE, related_name="campaigns"
    )
    name = models.CharField(max_length=150)
    goal = models.CharField(
        max_length=200, blank=True, help_text="e.g. Appointment reminders"
    )
    recipients = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class CallRecord(models.Model):
    """A single call in a campaign, with its transcript (feature #11)."""

    class Outcome(models.TextChoices):
        COMPLETED = "COMPLETED", "Completed"
        NO_ANSWER = "NO_ANSWER", "No answer"
        VOICEMAIL = "VOICEMAIL", "Voicemail"
        FAILED = "FAILED", "Failed"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="call_records"
    )
    agent = models.ForeignKey(
        VoiceAgent, on_delete=models.CASCADE, related_name="call_records"
    )
    campaign = models.ForeignKey(
        Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name="calls"
    )
    recipient = models.CharField(max_length=150)
    phone = models.CharField(max_length=40, blank=True)
    outcome = models.CharField(max_length=12, choices=Outcome.choices)
    duration_seconds = models.PositiveIntegerField(default=0)
    transcript = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient} · {self.outcome}"


# ==========================================================================
# Verification-of-Benefits (VOB) voice-agent module
# Recreated from the "TUYW" insurance voice agent. The real telephony stack
# (LiveKit / Twilio / Deepgram) is simulated server-side (see vob_pipeline.py).
# ==========================================================================

class AgentInstruction(models.Model):
    """A named agent-instruction set (Agent Instruction Library)."""

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="agent_instructions"
    )
    name = models.CharField(max_length=150)
    voice = models.CharField(max_length=20, default="rachel")
    instructions = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class IvrConfig(models.Model):
    """A saved IVR phone-tree mapping: an ordered step table (trigger -> action)."""

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="ivr_configs"
    )
    name = models.CharField(max_length=150)
    payer_label = models.CharField(max_length=150, blank=True)
    # [{trigger, action_type: "dtmf"|"say", value, value_source}]
    steps = models.JSONField(default=list, blank=True)
    summary = models.TextField(blank=True)
    source_transcript = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class VobCall(models.Model):
    """An outbound VOB call session with its transcript and extracted benefits."""

    class Status(models.TextChoices):
        QUEUED = "QUEUED", "Queued"
        DIALING = "DIALING", "Dialing"
        IVR = "IVR", "Navigating IVR"
        CONNECTED = "CONNECTED", "Live with rep"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    class DtmfMode(models.TextChoices):
        AUTO = "AUTO", "Auto"
        MANUAL = "MANUAL", "Manual"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="vob_calls"
    )

    # Member / provider information
    patient_name = models.CharField(max_length=150, blank=True)
    member_id = models.CharField(max_length=60, blank=True)
    npi = models.CharField(max_length=20, blank=True)
    group_number = models.CharField(max_length=60, blank=True)
    dob = models.CharField(max_length=20, blank=True)
    payer = models.CharField(max_length=120, blank=True)
    insurance_phone = models.CharField(max_length=40, blank=True)
    cpt_codes = models.CharField(max_length=120, blank=True)

    # Call configuration
    voice = models.CharField(max_length=20, default="rachel")
    dtmf_mode = models.CharField(max_length=8, choices=DtmfMode.choices, default=DtmfMode.AUTO)
    instruction = models.ForeignKey(
        AgentInstruction, on_delete=models.SET_NULL, null=True, blank=True, related_name="calls"
    )
    ivr_config = models.ForeignKey(
        IvrConfig, on_delete=models.SET_NULL, null=True, blank=True, related_name="calls"
    )

    # Results
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.QUEUED)
    mode = models.CharField(max_length=10, default="ivr")  # ivr | human
    transcript = models.JSONField(default=list, blank=True)  # [{speaker, text, kind}]
    vob_data = models.JSONField(default=dict, blank=True)     # {field: {value, confidence}}
    confidence = models.FloatField(default=0.0)
    decision = models.CharField(max_length=40, blank=True)   # auto-pushed / flagged
    recording_url = models.CharField(max_length=255, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"VOB {self.patient_name or self.member_id} · {self.status}"
