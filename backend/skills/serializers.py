"""Serializers for skill runs."""
from rest_framework import serializers

from .models import SkillRun


class SkillRunSerializer(serializers.ModelSerializer):
    connector_name = serializers.CharField(
        source="connector.name", read_only=True, default=None
    )
    created_by_name = serializers.CharField(
        source="created_by.display_name", read_only=True, default=None
    )

    class Meta:
        model = SkillRun
        fields = [
            "id",
            "skill_slug",
            "skill_name",
            "input",
            "output",
            "status",
            "resolution",
            "resolved_at",
            "connector",
            "connector_name",
            "created_by_name",
            "created_at",
        ]
        read_only_fields = fields
