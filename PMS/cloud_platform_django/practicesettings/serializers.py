from rest_framework import serializers
from .models import *


class PracticeInformationSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PracticeInformation
        fields = "__all__"

    def update(self, instance, validated_data):
        new_logo = validated_data.get("logo", None)

        # delete old logo if new one uploaded
        if new_logo and instance.logo:
            instance.logo.delete(save=False)

        return super().update(instance, validated_data)

    def get_logo_url(self, obj):
        request = self.context.get("request")
        if obj.logo and request:
            return request.build_absolute_uri(obj.logo.url)
        return None
    
class InsuranceCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuranceCompany
        fields = "__all__"
        read_only_fields = ['created_by']

class InsurancePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsurancePlan
        fields = "__all__"
        read_only_fields = ['created_by']


class InsurancePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = InsurancePolicy
        fields = "__all__"
        read_only_fields = ['created_by']


class PracticeSchedulingSettingsSerializer(serializers.ModelSerializer):
    patient_provider_name = serializers.SerializerMethodField()
    patient_provider_profile = serializers.SerializerMethodField()

    class Meta:
        model = PracticeSchedulingSettings
        fields = [
            "id",
            "patient_provider",
            "patient_provider_name",
            "patient_provider_profile",
            "timezone",
            "calendar_increment",
            "group_appointments",
            "created_at",
            "updated_at",
        ]

    def get_patient_provider_name(self, obj):
        if obj.patient_provider:
            return f"{obj.patient_provider.first_name} {obj.patient_provider.last_name}"
        return None

    def get_patient_provider_profile(self, obj):
        if obj.patient_provider and obj.patient_provider.profile_picture:
            return obj.patient_provider.profile_picture.url
        return None



class StaffDailyScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffDailySchedule
        fields = "__all__"
        read_only_fields = ["staff_schedule"]


class StaffScheduleSerializer(serializers.ModelSerializer):
    # 🔥 OPTIONAL field
    daily_schedules = StaffDailyScheduleSerializer(
        many=True,
        required=False
    )

    class Meta:
        model = StaffSchedule
        fields = [
            "id",
            "staff_name",
            "is_active",
            "daily_schedules",
            "created_at",
            "updated_at",
        ]
        
    def create(self, validated_data):
        daily_data = validated_data.pop("daily_schedules", [])
        staff_schedule = StaffSchedule.objects.create(**validated_data)

        days = [
            "monday", "tuesday", "wednesday",
            "thursday", "friday", "saturday", "sunday"
        ]

        for day in days:
            StaffDailySchedule.objects.get_or_create(
                staff_schedule=staff_schedule,
                day=day,
                defaults={"is_working_day": False}
            )

        for day_data in daily_data:
            StaffDailySchedule.objects.update_or_create(
                staff_schedule=staff_schedule,
                day=day_data["day"],
                defaults=day_data
            )

        return staff_schedule


    def update(self, instance, validated_data):
        daily_data = validated_data.pop("daily_schedules", [])

        instance.staff_name = validated_data.get(
            "staff_name", instance.staff_name
        )
        instance.is_active = validated_data.get(
            "is_active", instance.is_active
        )
        instance.save()

        for day_data in daily_data:
            StaffDailySchedule.objects.update_or_create(
                staff_schedule=instance,
                day=day_data["day"],  # REQUIRED
                defaults={
                    "work_start_time": day_data.get("work_start_time"),
                    "work_end_time": day_data.get("work_end_time"),
                    "break_start_time": day_data.get("break_start_time"),
                    "break_end_time": day_data.get("break_end_time"),
                    "break_description": day_data.get("break_description"),
                    "is_working_day": day_data.get("is_working_day", True),
                }
            )

        return instance

    
class StaffTimeOffSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffTimeOff
        fields = [
            "id",
            "staff",
            "reason",
            "start_datetime",
            "end_datetime",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        if attrs["start_datetime"] >= attrs["end_datetime"]:
            raise serializers.ValidationError(
                "End date/time must be after start date/time."
            )
        return attrs
    
class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "is_active",
            "created_at",
            "updated_at",
        ]


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = [
            "id",
            "name",
            "is_active",
            "created_at",
            "updated_at",
        ]

class PracticeHolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeHoliday
        fields = [
            "id",
            "name",
            "date",
            "is_active",
            "created_at",
            "updated_at",
        ]

class ProviderScheduleBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderScheduleBlock
        fields = [
            "id",
            "provider",
            "name",
            "color",
            "start_date",
            "from_time",
            "to_time",
            "custom_text",
            "service_location",
            "block_appointments",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        from_time = attrs.get("from_time")
        to_time = attrs.get("to_time")

        if from_time and to_time and from_time >= to_time:
            raise serializers.ValidationError(
                "To time must be greater than from time."
            )
        return attrs
    
class ServiceCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCode
        fields = [
            "id",
            "name",
            "procedures",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]

class VisitReasonSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(
        source="service.name",
        read_only=True
    )

    class Meta:
        model = VisitReason
        fields = [
            "id",
            "name",
            "duration",
            "color",
            "service",
            "service_name",
            "is_active",
            "created_at",
            "updated_at",
        ]

    
class FeeScheduleEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeScheduleEntry
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "version")

class BulkFeeScheduleUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, file):
        if not file.name.lower().endswith((".csv", ".xlsx", ".xls")):
            raise serializers.ValidationError("Only CSV or Excel files are allowed.")
        return file