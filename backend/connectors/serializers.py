"""Serializers for connectors. The API key is write-only."""
from rest_framework import serializers

from .models import Connector


class ConnectorSerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    has_credentials = serializers.BooleanField(read_only=True)

    class Meta:
        model = Connector
        fields = [
            "id",
            "name",
            "kind",
            "kind_label",
            "base_url",
            "description",
            "api_key",
            "status",
            "status_label",
            "has_credentials",
            "last_checked_at",
            "created_at",
        ]
        read_only_fields = ["id", "status", "last_checked_at", "created_at"]
        extra_kwargs = {"api_key": {"write_only": True, "required": False}}
