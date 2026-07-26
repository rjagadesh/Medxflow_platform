from rest_framework import serializers
from .models import Claim, SFTPConfiguration
from tenant_app.models import Patient
from tenant_encounter.models import Encounter,EncounterServiceLine
# claims/serializers.py
from .constants import CLAIM_STATUS_TRANSITIONS

# class ClaimServiceLineSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ClaimServiceLine
#         fields = "__all__"
#         read_only_fields = ("id",)

# class ClaimServiceLineSerializer(serializers.ModelSerializer):
#     patient_id = serializers.IntegerField(
#         source="claim.encounter.patient.id", read_only=True
#     )
#     patient_first_name = serializers.CharField(
#         source="claim.encounter.patient.first_name", read_only=True
#     )
#     patient_last_name = serializers.CharField(
#         source="claim.encounter.patient.last_name", read_only=True
#     )

    
#     class Meta:
#         model = ClaimServiceLine
#         fields = "__all__"



class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = (
            "id",
            "first_name",
            "last_name",
            "mobile_phone",
            "insurance_name",
        )

class EncounterSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    class Meta:
        model = Encounter
        fields = "__all__"
        # fields = (
        #     "id",
        #     "encounter_number",
        #     "patient",
        # )

class EncounterServiceLineSerializer_claim(serializers.ModelSerializer):
    encounter = EncounterSerializer(read_only=True)
    claim_status = serializers.SerializerMethodField()

    class Meta:
        model = EncounterServiceLine
        fields = "__all__"

    def get_claim_status(self, obj):
        if obj.encounter and hasattr(obj.encounter, "submitted_claim"):
            return obj.encounter.submitted_claim.status
        return None

class ClaimSerializer(serializers.ModelSerializer):
    # lines = ClaimServiceLineSerializer(many=True)
    encounter_number = serializers.SerializerMethodField(read_only=True)
    # patient_name = serializers.SerializerMethodField(read_only=True)
    patient_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Claim
        fields = "__all__"
        read_only_fields = (
            "id",
            "status",
            "submitted_at",
            "payer_claim_id",
            "created_at",
        )

    def get_encounter_number(self, obj):
        """
        Read encounter_number from related Encounter
        """
        if obj.encounter:
            return obj.encounter.encounter_number
        return None
    
    # def get_patient_name(self, obj):
    #     """
    #     Read encounter_number from related Encounter
    #     """
    #     if obj.encounter:
    #         return f"{obj.encounter.patient.first_name} {obj.encounter.patient.first_name}"
    #     return None

    def get_patient_details(self, obj):
        """
        Return patient info from Encounter → Patient
        """
        if obj.encounter and obj.encounter.patient:
            return PatientSerializer(obj.encounter.patient).data
        return None
    
    def create(self, validated_data):
        # lines_data = validated_data.pop("lines", [])
        claim = Claim.objects.create(**validated_data)

        # for line in lines_data:
        #     ClaimServiceLine.objects.create(claim=claim, **line)

        return claim

    def update(self, instance, validated_data):
        # lines_data = validated_data.pop("lines", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # if lines_data is not None:
        #     instance.lines.all().delete()
        #     for line in lines_data:
        #         ClaimServiceLine.objects.create(claim=instance, **line)

        return instance


class ClaimStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Claim
        fields = ["status"]

    def validate_status(self, new_status):
        claim = self.instance
        allowed = CLAIM_STATUS_TRANSITIONS.get(claim.status, [])

        if new_status not in allowed:
            raise serializers.ValidationError(
                f"Cannot change status from '{claim.status}' to '{new_status}'"
            )

        return new_status


class SFTPConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SFTPConfiguration
        fields = "__all__"
        extra_kwargs = {
            "password": {"write_only": True},
            "ssh_key": {"write_only": True},
        }

    def validate(self, data):
        auth_type = data.get("auth_type")

        if auth_type == "password" and not data.get("password"):
            raise serializers.ValidationError("Password is required for password auth.")

        if auth_type == "ssh" and not data.get("ssh_key"):
            raise serializers.ValidationError("SSH key is required for SSH auth.")

        return data
