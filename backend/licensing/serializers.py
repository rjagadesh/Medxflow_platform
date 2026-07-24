"""Serializers for license plans and tenant license allocations."""
from rest_framework import serializers

from accounts.models import Tenant

from .models import License, LicensePlan


class LicensePlanSerializer(serializers.ModelSerializer):
    tier_label = serializers.CharField(source="get_tier_display", read_only=True)

    class Meta:
        model = LicensePlan
        fields = [
            "id",
            "tier",
            "tier_label",
            "name",
            "description",
            "default_seats",
            "price_monthly",
            "features",
            "rank",
        ]


class LicenseSerializer(serializers.ModelSerializer):
    """Read representation of an allocated license, with resolved labels."""

    tenant_name = serializers.CharField(source="tenant.name", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    plan_tier = serializers.CharField(source="plan.tier", read_only=True)
    effective_status = serializers.CharField(read_only=True)
    allocated_by_email = serializers.EmailField(
        source="allocated_by.email", read_only=True, default=None
    )

    class Meta:
        model = License
        fields = [
            "id",
            "tenant",
            "tenant_name",
            "plan",
            "plan_name",
            "plan_tier",
            "seats",
            "status",
            "effective_status",
            "starts_on",
            "expires_on",
            "allocated_by_email",
            "created_at",
        ]


class AllocateLicenseSerializer(serializers.ModelSerializer):
    """
    Write serializer used only by the super admin to allocate a license to a
    tenant. ``allocated_by`` is injected from the request in the view.
    """

    class Meta:
        model = License
        fields = ["id", "tenant", "plan", "seats", "status", "starts_on", "expires_on"]

    def validate_seats(self, value):
        if value < 1:
            raise serializers.ValidationError("A license must grant at least one seat.")
        return value

    def validate_tenant(self, value):
        if not value.is_active:
            raise serializers.ValidationError("Cannot allocate a license to an inactive tenant.")
        return value

    def validate(self, attrs):
        starts_on = attrs.get("starts_on")
        expires_on = attrs.get("expires_on")
        if starts_on and expires_on and expires_on < starts_on:
            raise serializers.ValidationError(
                {"expires_on": "Expiry date cannot be before the start date."}
            )
        return attrs
