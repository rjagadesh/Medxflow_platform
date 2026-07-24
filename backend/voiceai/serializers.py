"""Serializers for Voice AI agents plus the choice catalogue for the builder."""
from rest_framework import serializers

from .models import AgentVersion, CallRecord, Campaign, VoiceAgent


class AgentVersionSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.display_name", read_only=True, default=None
    )

    class Meta:
        model = AgentVersion
        fields = ["id", "version", "voice_type", "agent_type", "status", "status_label",
                  "created_by_name", "created_at", "updated_at"]
        read_only_fields = ["id", "status_label", "created_by_name", "created_at", "updated_at"]
        extra_kwargs = {
            "version": {"required": False},
            "voice_type": {"required": False},
            "agent_type": {"required": False},
        }


class VoiceAgentSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    voice_label = serializers.CharField(source="get_voice_display", read_only=True)
    language_label = serializers.CharField(source="get_language_display", read_only=True)
    model_label = serializers.CharField(source="get_model_display", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.display_name", read_only=True, default=None
    )

    class Meta:
        model = VoiceAgent
        fields = [
            "id",
            "name",
            "description",
            "persona",
            "status",
            "status_label",
            "voice",
            "voice_label",
            "language",
            "language_label",
            "greeting",
            "system_prompt",
            "model",
            "model_label",
            "temperature",
            # Extended config
            "agent_type",
            "voice_type",
            "voice_gender",
            "background_audio",
            "call_direction",
            "system_integration",
            "phone_numbers",
            "max_concurrent_calls",
            "call_recording",
            "end_call_messages",
            "forward_messages",
            "retry",
            "delay_minutes",
            "keys",
            "continue_recording_after_forward",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by_name", "created_at", "updated_at"]

    def validate_temperature(self, value):
        if not 0 <= value <= 1:
            raise serializers.ValidationError("Temperature must be between 0 and 1.")
        return value


def _choices(enum):
    """Serialize a Django TextChoices into [{value, label}] for the UI."""
    return [{"value": value, "label": label} for value, label in enum.choices]


def agent_options():
    """The full option catalogue the builder UI needs, in one payload."""
    return {
        "statuses": _choices(VoiceAgent.Status),
        "voices": _choices(VoiceAgent.Voice),
        "languages": _choices(VoiceAgent.Language),
        "models": _choices(VoiceAgent.Model),
    }


class CampaignSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source="agent.name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    call_count = serializers.IntegerField(source="calls.count", read_only=True)

    class Meta:
        model = Campaign
        fields = [
            "id", "agent", "agent_name", "name", "goal", "recipients",
            "status", "status_label", "call_count", "created_at",
        ]
        read_only_fields = ["id", "agent_name", "status_label", "call_count", "created_at"]


class CallRecordSerializer(serializers.ModelSerializer):
    outcome_label = serializers.CharField(source="get_outcome_display", read_only=True)
    agent_name = serializers.CharField(source="agent.name", read_only=True)

    class Meta:
        model = CallRecord
        fields = [
            "id", "agent", "agent_name", "campaign", "recipient", "phone",
            "outcome", "outcome_label", "duration_seconds", "transcript", "created_at",
        ]
        read_only_fields = fields


# -- VOB module serializers -------------------------------------------------
from .models import AgentInstruction, IvrConfig, VobCall  # noqa: E402


class AgentInstructionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentInstruction
        fields = ["id", "name", "voice", "instructions", "created_at"]
        read_only_fields = ["id", "created_at"]


class IvrConfigSerializer(serializers.ModelSerializer):
    step_count = serializers.SerializerMethodField()

    class Meta:
        model = IvrConfig
        fields = ["id", "name", "payer_label", "steps", "step_count", "summary",
                  "source_transcript", "created_at"]
        read_only_fields = ["id", "step_count", "created_at"]

    def get_step_count(self, obj):
        return len(obj.steps or [])


class VobCallListSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = VobCall
        fields = ["id", "patient_name", "member_id", "payer", "status", "status_label",
                  "mode", "confidence", "decision", "created_at"]


class VobCallSerializer(serializers.ModelSerializer):
    """Full detail incl. transcript + extracted VOB. Also the create serializer."""

    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = VobCall
        fields = [
            "id", "patient_name", "member_id", "npi", "group_number", "dob",
            "payer", "insurance_phone", "cpt_codes", "voice", "dtmf_mode",
            "instruction", "ivr_config", "status", "status_label", "mode",
            "transcript", "vob_data", "confidence", "decision", "recording_url",
            "created_at", "completed_at",
        ]
        read_only_fields = [
            "id", "status", "status_label", "mode", "transcript", "vob_data",
            "confidence", "decision", "recording_url", "created_at", "completed_at",
        ]
