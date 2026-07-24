"""Serializers for scheduled runs and automations."""
from rest_framework import serializers

from .models import Automation, ScheduledRun


class ScheduledRunSerializer(serializers.ModelSerializer):
    cadence_label = serializers.CharField(source="get_cadence_display", read_only=True)

    class Meta:
        model = ScheduledRun
        fields = [
            "id", "skill_slug", "skill_name", "cadence", "cadence_label",
            "input", "active", "next_run", "created_at",
        ]
        read_only_fields = ["id", "skill_name", "cadence_label", "next_run", "created_at"]


class AutomationSerializer(serializers.ModelSerializer):
    trigger_status_label = serializers.CharField(
        source="get_trigger_status_display", read_only=True
    )

    class Meta:
        model = Automation
        fields = [
            "id", "name", "trigger_skill", "trigger_status", "trigger_status_label",
            "action_skill", "graph", "active", "created_at",
        ]
        read_only_fields = ["id", "trigger_status_label", "created_at"]
        extra_kwargs = {
            "trigger_skill": {"required": False},
            "action_skill": {"required": False},
        }
