"""
License API.

Access rules
------------
* GET  /api/license-plans/      – any authenticated user (read the catalogue).
* GET  /api/licenses/           – super admin sees all; a tenant user sees only
                                  their own tenant's licenses.
* POST /api/licenses/           – SUPER ADMIN ONLY (allocate a license).
* GET/PATCH/DELETE
       /api/licenses/<id>/      – SUPER ADMIN ONLY (manage an allocation).
"""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from accounts.models import Role
from accounts.permissions import IsSuperAdmin

from .models import License, LicensePlan
from .serializers import (
    AllocateLicenseSerializer,
    LicensePlanSerializer,
    LicenseSerializer,
)


class LicensePlanListView(generics.ListAPIView):
    """List the three license tiers. Readable by any authenticated user."""

    queryset = LicensePlan.objects.all()
    serializer_class = LicensePlanSerializer
    permission_classes = [IsAuthenticated]


class LicenseListCreateView(generics.ListCreateAPIView):
    """
    List licenses (scoped by role) or allocate a new one.

    Allocation (POST) is restricted to the super admin; reading is available to
    any authenticated user but is filtered to their own tenant.
    """

    def get_permissions(self):
        # Only the super admin may allocate; anyone signed in may read.
        if self.request.method == "POST":
            return [IsSuperAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        return AllocateLicenseSerializer if self.request.method == "POST" else LicenseSerializer

    def get_queryset(self):
        user = self.request.user
        qs = License.objects.select_related("tenant", "plan", "allocated_by")
        if user.role == Role.SUPER_ADMIN:
            return qs
        return qs.filter(tenant=user.tenant)

    def perform_create(self, serializer):
        # Record which super admin issued the license.
        serializer.save(allocated_by=self.request.user)


class LicenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update (e.g. suspend) or revoke a license — super admin only."""

    queryset = License.objects.select_related("tenant", "plan", "allocated_by")
    permission_classes = [IsSuperAdmin]

    def get_serializer_class(self):
        return LicenseSerializer if self.request.method == "GET" else AllocateLicenseSerializer
