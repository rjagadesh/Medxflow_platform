"""
SkillRun — a logged execution of a skill: what went in, what came out, and the
resulting status. These records power history views and the Decision Engine's
aggregates. Runs are tenant-scoped.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class SkillRun(models.Model):
    class Resolution(models.TextChoices):
        OPEN = "OPEN", "Open"
        APPROVED = "APPROVED", "Approved"
        RETRIED = "RETRIED", "Retried"
        ESCALATED = "ESCALATED", "Escalated"
        RESOLVED = "RESOLVED", "Resolved"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="skill_runs"
    )
    skill_slug = models.CharField(max_length=60)
    skill_name = models.CharField(max_length=120)
    input = models.JSONField(default=dict)
    output = models.JSONField(default=dict)
    # Mirrors output["status"]: success | warning | error
    status = models.CharField(max_length=12, default="success")
    # Review-queue lifecycle for warning/error runs.
    resolution = models.CharField(
        max_length=12, choices=Resolution.choices, default=Resolution.OPEN
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    connector = models.ForeignKey(
        "connectors.Connector",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="skill_runs",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.skill_name} · {self.status} · {self.tenant.slug}"
