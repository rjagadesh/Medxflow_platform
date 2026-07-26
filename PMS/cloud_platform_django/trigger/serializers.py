from rest_framework import serializers
from .models import *
from modules.models import App, GeneratedAPI

class TriggerDetailsSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source="machine.machine_name", read_only=True)
    agentname = serializers.SerializerMethodField()

    class Meta:
        model = TriggerDetails
        fields = '__all__'  # includes all fields from TriggerDetails
        # extra_fields is optional, DRF ignores it
        extra_fields = ['machine_name', 'agentname']

    def get_agentname(self, obj):
        # Get the GeneratedAPI instance
        generated_api = GeneratedAPI.objects.filter(id=obj.agentid).first()
        if not generated_api or not generated_api.apps:
            return None

        # Get the related App name
        return generated_api.apps.app_name
    
class TriggerStatusSerializer(serializers.ModelSerializer):
    trigger_name = serializers.CharField(source="trigger.name", read_only=True)

    class Meta:
        model = TriggerStatus
        fields = ["id", "status", "start_date", "end_date", "exception", "created_at", "trigger_name"]