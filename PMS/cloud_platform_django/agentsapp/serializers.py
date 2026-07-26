from rest_framework import serializers
import django_filters
from .models import AgentTask, Instructions

class AgentTaskFilter(django_filters.FilterSet):
    class Meta:
        model = AgentTask
        fields = {
            "status": ["exact"],
            "created_at": ["date", "date__gte", "date__lte"],
            "status_changed_at": ["date", "date__gte", "date__lte"],
        }

class AgentTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentTask
        fields = "__all__"
        read_only_fields = ("id", "created_at", "status_changed_at")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Inject the user's passed API key from context
        input_apikey = self.context.get("input_apikey")
        if input_apikey:
            data["apikey"] = input_apikey

        # Construct nested calllog object
        calllog_data = {}
        annotated_fields = [
            "latest_call_id",
            "latest_call_call_id",
            "latest_call_duration",
            "latest_call_status",
            "latest_call_start_time",
            "latest_call_end_time",
            "latest_call_to_number",
            "latest_call_from_number",
            "latest_call_voice",
            "latest_call_model",
            "latest_call_config_source",
            "latest_call_recording_s3_url",
            "latest_call_transcript_s3_url",
            "latest_call_call_log_s3_url",
            "latest_call_extracted_s3_url",
            "latest_call_created_at",
            "latest_call_updated_at",
        ]

        has_call_log = False
        if hasattr(instance, "latest_call_id") and instance.latest_call_id:
            has_call_log = True
            for field in annotated_fields:
                # Remove prefix 'latest_call_' for the nested object
                key = field.replace("latest_call_", "")
                # Handle special case if field name matches exactly 'latest_call_call_id' -> 'call_id'
                # The simple replace above works: 'latest_call_call_id' -> 'call_id'
                # 'latest_call_id' -> 'id'
                
                if hasattr(instance, field):
                    calllog_data[key] = getattr(instance, field)
        
        data["calllog"] = calllog_data if has_call_log else None

        return data


class InstructionSerializer(serializers.ModelSerializer):
    system_prompt = serializers.CharField(required=True)
    questions = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        required=True
    )

    class Meta:
        model = Instructions
        fields = "__all__"
        read_only_fields = ["client"]

    def validate_questions(self, value):
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError("Questions must be a non-empty list.")
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each question must be an object.")
            if 'question' not in item:
                raise serializers.ValidationError("Each item must contain a 'question' key.")
            if not isinstance(item['question'], str) or not item['question'].strip():
                raise serializers.ValidationError("Each 'question' value must be a non-empty string.")
        return value
