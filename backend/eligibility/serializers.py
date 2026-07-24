from rest_framework import serializers

from .models import EligibilityCheck


class EligibilityCheckListSerializer(serializers.ModelSerializer):
    class Meta:
        model = EligibilityCheck
        fields = ["id", "member_id", "first_name", "last_name", "payer",
                  "coverage_status", "plan_type", "created_at"]


class EligibilityCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = EligibilityCheck
        fields = [
            "id", "payer", "payer_id", "member_id", "first_name", "last_name",
            "dob", "npi", "cpt", "service_types",
            "coverage_status", "plan_type", "plan_name", "group_number",
            "subscriber", "effective_date", "termination_date",
            "benefits", "normalized", "vob_summary", "action_items", "ai_model",
            "status", "created_at",
        ]
        read_only_fields = [
            "id", "coverage_status", "plan_type", "plan_name", "group_number",
            "subscriber", "effective_date", "termination_date", "benefits",
            "normalized", "vob_summary", "action_items", "ai_model", "status", "created_at",
        ]
