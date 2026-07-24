"""
Per-tenant dashboard customization. Each tenant has one ``DashboardConfig``
holding an ordered list of tiles it built (via the dashboard developer chat or
the manual picker). Persisted so every login shows the tenant's own dashboard.
"""
from django.db import models
from django.utils import timezone


class DashboardConfig(models.Model):
    tenant = models.OneToOneField(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="dashboard"
    )
    # [{ "id": str, "metric": key, "title": str, "size": "sm"|"lg" }]
    tiles = models.JSONField(default=list, blank=True)
    # A dashboard change proposed by the AI chat, awaiting the user's confirmation:
    # {"operations": [...], "reply": str, "summary": [str, ...]}. Cleared on apply/cancel.
    pending = models.JSONField(null=True, blank=True, default=None)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Dashboard[{self.tenant.slug}] ({len(self.tiles)} tiles)"


DEFAULT_TILES = [
    {"metric": "skill_runs", "size": "sm"},
    {"metric": "review_queue", "size": "sm"},
    {"metric": "success_rate", "size": "sm"},
    {"metric": "revenue", "size": "sm"},
]
