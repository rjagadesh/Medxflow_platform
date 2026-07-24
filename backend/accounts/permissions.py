"""Reusable DRF permission classes for role-based access control."""
from rest_framework.permissions import BasePermission

from .models import Role


class IsSuperAdmin(BasePermission):
    """Allow only the platform super admin."""

    message = "Super admin privileges are required for this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.SUPER_ADMIN
        )


class IsTenantAdmin(BasePermission):
    """Allow tenant admins (and super admins, who outrank them)."""

    message = "Tenant admin privileges are required for this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.SUPER_ADMIN, Role.TENANT_ADMIN)
        )
