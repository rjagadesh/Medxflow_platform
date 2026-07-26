from rest_framework import serializers
from tenant_app.models import *
from tenant_app.serializers import *
from practicesettings.models import *
from .models import *
from tenant_encounter.services import create_claim_from_encounter
from clinical_notes.models import ClinicalNote

class PatientMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'dob', 'gender', 'mrn']


class PatientProviderMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProvider
        fields = ['id', 'first_name', 'last_name', 'NPI', 'taxonomy']

class PatientInsuranceSerializer(serializers.ModelSerializer):
    payer_name = serializers.CharField(source='payer.name', read_only=True)

    class Meta:
        model = PatientInsurance
        fields = [
            'id', 'payer', 'payer_name', 'member_id', 'group_number',
            'priority', 'copay', 'effective_date', 'termination_date'
        ]


class EncounterDiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = EncounterDiagnosis
        fields = ['id', 'icd_code', 'description', 'order']


class EncounterServiceLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = EncounterServiceLine
        fields = [
            'id',
            'date_from',
            'date_to',

            'start_time',      # ✅
            'end_time',        # ✅
            'minutes',

            'procedure_code',
            'description',
            'modifiers',
            'units',
            'unit_charge',
            'total_charge',

            'diag_pointers',

            'is_concurrent',   # ✅
            'tos_code',        # ✅
            'ndc_code',
            'reference_code',  # ✅
            'is_voided',
            'rendering_provider',
            'line_note',
        ]
        read_only_fields = ['total_charge']


class AmbulanceDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = AmbulanceDetail
        fields = '__all__'
        read_only_fields = ['encounter']


class EncounterListSerializer(serializers.ModelSerializer):
    patient = PatientMinimalSerializer(read_only=True)
    rendering_provider = PatientProviderMinimalSerializer(read_only=True)
    primary_insurance = PatientInsuranceSerializer(read_only=True)

    class Meta:
        model = Encounter
        fields = [
            'id','encounter_number', 'patient', 'rendering_provider', 'service_date_from',
            'service_date_to', 'status', 'total_charges', 'balance_due',
            'primary_insurance', 'created_at','encounter_from_date',
            'encounter_through_date', 'post_date',
            'batch_number',
        ]


class EncounterDetailSerializer(serializers.ModelSerializer):
    patient = PatientMinimalSerializer(read_only=True)
    rendering_provider = PatientProviderMinimalSerializer(read_only=True)
    supervising_provider = PatientProviderMinimalSerializer(read_only=True)
    referring_provider = PatientProviderMinimalSerializer(read_only=True)
    primary_insurance = PatientInsuranceSerializer(read_only=True)
    appointment = AppointmentMinimalSerializer(read_only=True)  # ✅ added
    diagnoses = EncounterDiagnosisSerializer(many=True, read_only=True)
    service_lines = EncounterServiceLineSerializer(many=True, read_only=True)
    ambulance_detail = AmbulanceDetailSerializer(read_only=True, required=False)

    class Meta:
        model = Encounter
        fields = '__all__'
        read_only_fields = ['total_charges', 'balance_due', 'created_at', 'updated_at']


class EncounterCreateUpdateSerializer(serializers.ModelSerializer):
    """Main serializer for create/update with nested writable support"""
    diagnoses = EncounterDiagnosisSerializer(many=True, required=False)
    service_lines = EncounterServiceLineSerializer(many=True, required=False)
    ambulance_detail = AmbulanceDetailSerializer(required=False)

    total_charge = serializers.DecimalField(source='total_charges', max_digits=12, decimal_places=2, required=False)

    class Meta:
        model = Encounter
        fields = [
            'id','encounter_number', 'patient', 'appointment', 'rendering_provider',
            'supervising_provider', 'referring_provider', 'location',
            'place_of_service_code', 'service_date_from', 'service_date_to','hospitalized_from','encounter_from_date',
            'encounter_through_date', 'post_date', 'batch_number',
            'hospitalized_to', 'submit_reason', 'payer_doc_control', 'claim_code_10d', 'additional_claim_info',
            'eclaim_note_type', 'eclaim_note','started_at', 'ended_at', 'chief_complaint', 'reason_for_visit',
            'clinical_notes', 'primary_insurance', 'prior_authorization',
            'do_not_bill', 'do_not_send_electronically', 'status', 'total_charges', 'total_charge',
            'diagnoses', 'service_lines', 'ambulance_detail'
        ]
        read_only_fields = ['id', 'balance_due', 'created_at', 'updated_at']

    def validate(self, attrs):
        status = attrs.get('status')
        if status == 'accepted':
            appointment = attrs.get('appointment')
            if not appointment and self.instance:
                appointment = self.instance.appointment
            
            if appointment:
                note = ClinicalNote.objects.filter(appointment=appointment).first()
                if not note:
                    raise serializers.ValidationError({"status": "Cannot accept encounter: No clinical note found for this appointment."})
                
                if not note.is_signed:
                    raise serializers.ValidationError({"status": "Cannot accept encounter: The associated clinical note is not signed."})
        
        return attrs

    def create(self, validated_data):
        diagnoses_data = validated_data.pop('diagnoses', [])
        service_lines_data = validated_data.pop('service_lines', [])
        ambulance_data = validated_data.pop('ambulance_detail', None)

        encounter = Encounter.objects.create(**validated_data)

        # Create diagnoses
        for diag_data in diagnoses_data:
            EncounterDiagnosis.objects.create(encounter=encounter, **diag_data)

        # Create service lines
        for line_data in service_lines_data:
            EncounterServiceLine.objects.create(encounter=encounter, **line_data)

        # Create ambulance if present
        if ambulance_data:
            AmbulanceDetail.objects.create(encounter=encounter, **ambulance_data)

        return encounter

    def update(self, instance, validated_data):
        old_status = instance.status

        diagnoses_data = validated_data.pop('diagnoses', None)
        service_lines_data = validated_data.pop('service_lines', None)
        ambulance_data = validated_data.pop('ambulance_detail', None)

        # Update main fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Nested updates (same as before)
        if diagnoses_data is not None:
            instance.diagnoses.all().delete()
            for d in diagnoses_data:
                EncounterDiagnosis.objects.create(encounter=instance, **d)

        if service_lines_data is not None:
            instance.service_lines.all().delete()
            for line in service_lines_data:
                EncounterServiceLine.objects.create(encounter=instance, **line)

        if ambulance_data is not None:
            if hasattr(instance, 'ambulance_detail'):
                instance.ambulance_detail.delete()
            AmbulanceDetail.objects.create(encounter=instance, **ambulance_data)

        # ✅ CLAIM CREATION LOGIC
        if old_status != "submitted" and instance.status == "submitted":
            if instance.do_not_bill:
                raise serializers.ValidationError("Encounter marked as Do Not Bill")
            create_claim_from_encounter(instance)

        return instance
    


class PatientInsuranceFullSerializer(serializers.ModelSerializer):
    payer_name = serializers.CharField(source='payer.name', read_only=True)
    
    class Meta:
        model = PatientInsurance
        fields = '__all__'


class EncounterDiagnosisFullSerializer(serializers.ModelSerializer):
    class Meta:
        model = EncounterDiagnosis
        fields = '__all__'


class EncounterServiceLineFullSerializer(serializers.ModelSerializer):
    class Meta:
        model = EncounterServiceLine
        fields = '__all__'


class EncounterFullDetailSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    rendering_provider = PatientProviderSerializer(read_only=True)
    supervising_provider = PatientProviderSerializer(read_only=True)
    referring_provider = PatientProviderSerializer(read_only=True)
    primary_insurance = PatientInsuranceFullSerializer(read_only=True)
    appointment = AppointmentSerializer(read_only=True)
    diagnoses = EncounterDiagnosisFullSerializer(many=True, read_only=True)
    service_lines = EncounterServiceLineFullSerializer(many=True, read_only=True)
    ambulance_detail = AmbulanceDetailSerializer(read_only=True)

    class Meta:
        model = Encounter
        fields = '__all__'


class ServiceLocationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceLocation
        fields = [
            'id', 'name', 'city', 'state', 'zip_code',
            'place_of_service_code', 'phone', 'is_active',
            'display_on_scheduling_page','address1', 'address2','fax','timezone'
        ]


class ServiceLocationDetailSerializer(serializers.ModelSerializer):
    full_address = serializers.ReadOnlyField()

    class Meta:
        model = ServiceLocation
        fields = [
            'id', 'name', 'address1', 'address2', 'city', 'state', 'zip_code',
            'country', 'phone', 'fax', 'place_of_service_code', 'timezone',
            'google_place_id', 'allow_appointment_reminders',
            'include_address_in_reminders', 'display_on_scheduling_page',
            'is_active', 'full_address', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'full_address']


class ServiceLocationCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceLocation
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ClinicalNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalNote
        fields = "__all__"


class FeeScheduleEntryMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeScheduleEntry
        fields = ['procedure_code', 'par_amount']
