from rest_framework import serializers
from .models import VersionControl

class VersionControlSerializer(serializers.ModelSerializer):
    class Meta:
        model = VersionControl
        fields = "__all__"
