"""
Per-tenant role permissions.

A ``RolePermission`` row grants a (role, feature) combination the ability to
view / edit / delete within one tenant. Rows are created on demand; when a row
is missing the app falls back to :func:`rbac.features.default_permissions`.
"""
from django.db import models

from accounts.models import Role


class RolePermission(models.Model):
    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="role_permissions"
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    feature = models.CharField(max_length=60)

    can_view = models.BooleanField(default=True)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ("tenant", "role", "feature")
        ordering = ["role", "feature"]

    def __str__(self):
        return f"{self.tenant.slug}:{self.role}:{self.feature}"
