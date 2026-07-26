from rest_framework import serializers
from .models import (
    Allergy, PatientAllergyProfile, PatientProblem, Medications, PatientVitals,
    ClinicalNote, LabOrder, LabOrderDiagnosis, LabOrderItem, PatientHistory,
)


class ClinicalNoteSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField(read_only=True)
    assigned_to_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ClinicalNote
        fields = [
            "id",
            "notes_type",
            "patient",
            "patient_name",
            "appointment",
            "assigned_to",
            "assigned_to_name",
            "active_sections",
            "sections_notes",
            "saved_at",
            "saved_by",
            "sign_off_by",
            "sign_off_at",
            "is_signed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "saved_at",
            "saved_by",
            "sign_off_by",
            "sign_off_at",
        ]

    def get_patient_name(self, obj):
        patient = getattr(obj, "patient", None)
        if not patient:
            return None
        full = getattr(patient, "full_name", None)
        if full:
            return full
        name = f"{getattr(patient, 'first_name', '') or ''} {getattr(patient, 'last_name', '') or ''}".strip()
        return name or None

    def get_assigned_to_name(self, obj):
        user = getattr(obj, "assigned_to", None)
        if not user:
            return None
        name = f"{getattr(user, 'first_name', '') or ''} {getattr(user, 'last_name', '') or ''}".strip()
        return name or getattr(user, "username", None) or getattr(user, "email", None)


class PatientVitalsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientVitals
        fields = [
            "id",
            "patient",
            "recorded_at",
            "systolic_bp",
            "diastolic_bp",
            "height_in",
            "head_circumference_in",
            "weight_lbs",
            "weight_oz",
            "temperature_f",
            "heart_rate",
            "respiratory_rate",
            "spo2",
            "inhaled_o2",
            "bmi",
            "comments",
            "created_by",
            "created_at",
            "updated_at",
            "is_locked",
        ]
        read_only_fields = [
            "created_by",
            "created_at",
            "updated_at",
        ]


class MedicationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medications
        fields = [
            "id",
            "patient",
            "drug_name",
            "reason_for_rx_icd10_code",
            "reason_for_rx_icd10_name",
            "status",
            "patient_instructions",
            "quantity",
            "refills",
            "allow_substitution",
            "days_supply",
            "prescriber",
            "started_on",
            "administered_during_visit",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
        ]


class PatientProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProblem
        fields = [
            "id",
            "patient",
            "icd_name",
            "snomed_name",
            "icd10_code",
            "snomed_code",
            "status",
            "problem_type",
            "start_date",
            "end_date",
            "comments",
            "reconciliation_performed",
            "reconciled_by",
            "reconciled_at",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "reconciled_at",
            "created_at",
            "updated_at",
            "created_by",
        ]


class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = [
            "id",
            "patient",
            "allergen",
            "severity",
            "reactions",
            "date_of_onset",
            "comments",
            "status",
            "reconciled",
            "reconciled_at",
            "reconciled_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "reconciled_at",
            "created_at",
            "updated_at",
        ]


class PatientAllergyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientAllergyProfile
        fields = [
            "id",
            "patient",
            "no_known_allergies",
            "no_known_medication_allergies",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class LabOrderDiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabOrderDiagnosis
        fields = ["id", "icd_code", "description"]


class LabOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabOrderItem
        fields = ["id", "code", "name"]


class LabOrderSerializer(serializers.ModelSerializer):
    diagnoses = LabOrderDiagnosisSerializer(many=True, required=False)
    items = LabOrderItemSerializer(many=True, required=False)
    ordering_provider_name = serializers.SerializerMethodField(read_only=True)
    processing_provider_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LabOrder
        fields = [
            "id",
            "patient",
            "order_type",
            "is_elab",
            "ordering_provider",
            "ordering_provider_name",
            "processing_provider",
            "processing_provider_name",
            "notes",
            "stat",
            "status",
            "diagnoses",
            "items",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def _provider_name(self, provider):
        if not provider:
            return None
        name = f"{getattr(provider, 'first_name', '') or ''} {getattr(provider, 'last_name', '') or ''}".strip()
        return name or f"Provider {provider.id}"

    def get_ordering_provider_name(self, obj):
        return self._provider_name(obj.ordering_provider)

    def get_processing_provider_name(self, obj):
        return self._provider_name(obj.processing_provider)

    def create(self, validated_data):
        diagnoses = validated_data.pop("diagnoses", [])
        items = validated_data.pop("items", [])
        order = LabOrder.objects.create(**validated_data)
        for diag in diagnoses:
            LabOrderDiagnosis.objects.create(order=order, **diag)
        for item in items:
            LabOrderItem.objects.create(order=order, **item)
        return order

    def update(self, instance, validated_data):
        diagnoses = validated_data.pop("diagnoses", None)
        items = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        # Replace nested collections when provided
        if diagnoses is not None:
            instance.diagnoses.all().delete()
            for diag in diagnoses:
                LabOrderDiagnosis.objects.create(order=instance, **diag)
        if items is not None:
            instance.items.all().delete()
            for item in items:
                LabOrderItem.objects.create(order=instance, **item)
        return instance


class PatientHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientHistory
        fields = [
            "id",
            "patient",
            "history_type",
            "name",
            "note",
            "onset_date",
            "status",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]
