from rest_framework import serializers

from .models import KioskScreen


class KioskScreenListSerializer(serializers.ModelSerializer):
    class Meta:
        model = KioskScreen
        fields = ["id", "name", "updated_at"]


class KioskScreenSerializer(serializers.ModelSerializer):
    class Meta:
        model = KioskScreen
        fields = ["id", "name", "html", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
