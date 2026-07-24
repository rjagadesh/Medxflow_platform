"""
Roles & access API.

  GET  /api/rbac/catalog/       -> features + configurable roles (for the UI)
  GET  /api/rbac/permissions/   -> the tenant's full matrix (defaults filled in)
  PUT  /api/rbac/permissions/   -> bulk upsert the matrix (tenant admin only)
  GET  /api/rbac/my-permissions/-> the requesting user's effective permissions
"""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role
from accounts.permissions import IsTenantAdmin

from .features import (
    CONFIGURABLE_ROLES,
    FEATURE_SLUGS,
    FEATURES,
    default_permissions,
)
from .models import RolePermission


def _matrix_for_tenant(tenant):
    """Full role x feature matrix, using stored rows and falling back to defaults."""
    stored = {
        (rp.role, rp.feature): rp
        for rp in RolePermission.objects.filter(tenant=tenant)
    }
    matrix = {}
    for role_def in CONFIGURABLE_ROLES:
        role = role_def["value"]
        matrix[role] = {}
        for feature in FEATURES:
            slug = feature["slug"]
            rp = stored.get((role, slug))
            if rp:
                matrix[role][slug] = {
                    "can_view": rp.can_view,
                    "can_edit": rp.can_edit,
                    "can_delete": rp.can_delete,
                }
            else:
                matrix[role][slug] = default_permissions(role)
    return matrix


class RbacCatalogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"features": FEATURES, "roles": CONFIGURABLE_ROLES})


class RolePermissionsView(APIView):
    """Read or replace the tenant's permission matrix."""

    def get_permissions(self):
        # Reading is open to any tenant user; writing requires tenant admin.
        if self.request.method == "PUT":
            return [IsTenantAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        tenant = request.user.tenant
        if tenant is None:
            return Response({"matrix": {}})
        return Response({"matrix": _matrix_for_tenant(tenant)})

    def put(self, request):
        tenant = request.user.tenant
        if tenant is None:
            return Response({"detail": "No tenant."}, status=400)

        matrix = request.data.get("matrix", {})
        valid_roles = {r["value"] for r in CONFIGURABLE_ROLES}
        for role, features in matrix.items():
            if role not in valid_roles:
                continue
            for slug, perms in features.items():
                if slug not in FEATURE_SLUGS:
                    continue
                RolePermission.objects.update_or_create(
                    tenant=tenant,
                    role=role,
                    feature=slug,
                    defaults={
                        "can_view": bool(perms.get("can_view")),
                        "can_edit": bool(perms.get("can_edit")),
                        "can_delete": bool(perms.get("can_delete")),
                    },
                )
        from audit.models import record
        record(request.user, "ROLES", "Updated role permissions")
        return Response({"matrix": _matrix_for_tenant(tenant)})


class MyPermissionsView(APIView):
    """The requesting user's effective permissions per feature."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Super admins (and users without a tenant) get everything.
        if user.role == Role.SUPER_ADMIN or user.tenant is None:
            perms = {
                f["slug"]: {"can_view": True, "can_edit": True, "can_delete": True}
                for f in FEATURES
            }
            return Response({"role": user.role, "permissions": perms})

        matrix = _matrix_for_tenant(user.tenant)
        return Response(
            {"role": user.role, "permissions": matrix.get(user.role, {})}
        )
