"""Tenant-scoped CRUD for scheduled runs and automations."""
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from accounts.models import Role
from skills.registry import REGISTRY

from .models import Automation, ScheduledRun
from .serializers import AutomationSerializer, ScheduledRunSerializer


def _scoped(qs, user):
    return qs if user.role == Role.SUPER_ADMIN else qs.filter(tenant=user.tenant)


def _require_tenant(user):
    if user.tenant is None:
        raise ValidationError("Sign in as a tenant user.")


class ScheduledRunListCreateView(generics.ListCreateAPIView):
    serializer_class = ScheduledRunSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _scoped(ScheduledRun.objects.all(), self.request.user)

    def perform_create(self, serializer):
        _require_tenant(self.request.user)
        slug = serializer.validated_data.get("skill_slug")
        skill = REGISTRY.get(slug)
        if not skill:
            raise ValidationError({"skill_slug": "Unknown skill."})
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user,
            skill_name=skill.name,
        )


class ScheduledRunDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ScheduledRunSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _scoped(ScheduledRun.objects.all(), self.request.user)


class AutomationListCreateView(generics.ListCreateAPIView):
    serializer_class = AutomationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _scoped(Automation.objects.all(), self.request.user)

    def perform_create(self, serializer):
        _require_tenant(self.request.user)
        # Only validate the legacy fields when provided; studio flows use `graph`.
        for key in ("trigger_skill", "action_skill"):
            value = serializer.validated_data.get(key)
            if value and value not in REGISTRY:
                raise ValidationError({key: "Unknown skill."})
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)


class AutomationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AutomationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _scoped(Automation.objects.all(), self.request.user)
