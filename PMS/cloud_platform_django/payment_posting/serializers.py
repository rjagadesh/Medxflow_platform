from rest_framework import serializers
from .models import (
    Payment,
    Payment_EOB,
    Payment_EOB_Adjustment,
    PaymentLedger,
    ProviderLedger,
    AdjustmentCode,
)


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["status", "created_at"]

class AdjustmentCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdjustmentCode
        fields = "__all__"

class PaymentLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentLedger
        fields = "__all__"
        read_only_fields = ["created_at"]

    def create(self, validated_data):
        instance = PaymentLedger(**validated_data)
        instance.full_clean()
        instance.save()
        return instance

class ProviderLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderLedger
        fields = "__all__"
        read_only_fields = ["created_at"]

    def create(self, validated_data):
        instance = ProviderLedger(**validated_data)
        instance.full_clean()
        instance.save()
        return instance

class PaymentEOBSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment_EOB
        fields = "__all__"
        read_only_fields = ["created_at"]

class PaymentEOBAdjustmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment_EOB_Adjustment
        fields = "__all__"


class PaymentEOBAggregatedSerializer(serializers.ModelSerializer):
    adjustments = PaymentEOBAdjustmentSerializer(many=True, read_only=True)

    class Meta:
        model = Payment_EOB
        fields = "__all__"
