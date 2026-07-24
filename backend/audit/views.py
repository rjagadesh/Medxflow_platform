"""Audit log API — filterable, tenant-scoped, read-only."""
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated

from accounts.models import Role

from .models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = AuditEvent
        fields = ["id", "category", "category_label", "action", "description",
                  "user_email", "created_at"]


class AuditListView(generics.ListAPIView):
    serializer_class = AuditEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = AuditEvent.objects.all()
        if user.role != Role.SUPER_ADMIN:
            qs = qs.filter(tenant=user.tenant)
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        return qs[:200]
