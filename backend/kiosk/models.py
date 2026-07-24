"""Saved kiosk screens — each tenant can build and save multiple self-contained
kiosk HTML screens via the AI kiosk builder."""
from django.conf import settings
from django.db import models
from django.utils import timezone


class KioskScreen(models.Model):
    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="kiosk_screens"
    )
    name = models.CharField(max_length=120)
    html = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="kiosk_screens",
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Kiosk[{self.tenant.slug}] {self.name}"
