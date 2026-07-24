"""
Audit log (feature #9). Every notable user action is recorded as an
``AuditEvent`` — who did what, when, in which category. Records are tenant-scoped
and written via :func:`record`.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class AuditEvent(models.Model):
    class Category(models.TextChoices):
        RUN = "RUN", "Skill Run"
        VAULT = "VAULT", "Secret Vault"
        SETTINGS = "SETTINGS", "Settings"
        ROLES = "ROLES", "Roles"
        USERS = "USERS", "Users"
        AUTH = "AUTH", "Authentication"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="audit_events",
        null=True, blank=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    user_email = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=12, choices=Category.choices)
    action = models.CharField(max_length=120)
    description = models.CharField(max_length=400, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.category}:{self.action}"


def record(user, category, action, description=""):
    """Write an audit event. Safe to call from any view; never raises."""
    try:
        AuditEvent.objects.create(
            tenant=getattr(user, "tenant", None),
            user=user if getattr(user, "pk", None) else None,
            user_email=getattr(user, "email", ""),
            category=category,
            action=action,
            description=description,
        )
    except Exception:
        # Auditing must never break the primary request.
        pass
