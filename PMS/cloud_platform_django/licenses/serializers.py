from rest_framework import serializers
from .models import Machine, AppApiKey

class LicenseSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Machine
        fields = '__all__'
        read_only_fields = ("client",)

class AppApiKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = AppApiKey
        fields = '__all__'