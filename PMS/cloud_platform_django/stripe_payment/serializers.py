from rest_framework import serializers
from .models import PaymentData


class PaymentDataSerializer(serializers.ModelSerializer):
    patient_id = serializers.UUIDField(source="patient_id.id")
    appointment_id = serializers.IntegerField(source="appointment_id.id")

    appointment_date = serializers.DateField(
        source="appointment_id.date",
        read_only=True
    )
    appointment_time = serializers.TimeField(
        source="appointment_id.time",
        read_only=True
    )
    appointment_reason = serializers.CharField(
        source="appointment_id.reason",
        read_only=True
    )

    class Meta:
        model = PaymentData
        fields = [
            "payment_id",
            "patient_id",
            "appointment_id",
            "payment_type",
            "payment_amount",
            "check_number",
            "payment_date",
            "appointment_date",
            "appointment_time",
            "appointment_reason"
            
        ]