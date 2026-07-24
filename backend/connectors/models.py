"""
Connectors — reusable integrations a tenant can plug into.

A connector is either an **MCP server** (Model Context Protocol) or a plain
**REST API** endpoint. Skills (eligibility, prior-auth, claims, …) can run
"through" a connector, so integrations are configured once and reused. Secrets
are write-only over the API and never returned.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class Connector(models.Model):
    class Kind(models.TextChoices):
        MCP = "MCP", "MCP Server"
        REST = "REST", "REST API"

    class Status(models.TextChoices):
        CONNECTED = "CONNECTED", "Connected"
        DISCONNECTED = "DISCONNECTED", "Disconnected"
        ERROR = "ERROR", "Error"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="connectors"
    )
    name = models.CharField(max_length=120)
    kind = models.CharField(max_length=8, choices=Kind.choices, default=Kind.REST)
    base_url = models.URLField(help_text="MCP server URL or REST base URL.")
    description = models.CharField(max_length=255, blank=True)

    # Stored server-side, never serialized back out.
    api_key = models.CharField(max_length=255, blank=True, default="")

    status = models.CharField(
        max_length=14, choices=Status.choices, default=Status.DISCONNECTED
    )
    last_checked_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_connectors",
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} [{self.kind}]"

    @property
    def has_credentials(self):
        return bool(self.api_key)
