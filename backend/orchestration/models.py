"""
Orchestration models.

* ``ScheduledRun`` (feature #7) — a skill set to run on a recurring cadence with
  a saved input snapshot.
* ``Automation`` (feature #8) — a chain rule: when a trigger skill finishes with
  a given status, auto-run an action skill.

Both are tenant-scoped. Execution wiring (a worker/cron) is out of scope here;
these persist and manage the definitions, which is what the UI drives.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class ScheduledRun(models.Model):
    class Cadence(models.TextChoices):
        DAILY = "DAILY", "Daily"
        WEEKLY = "WEEKLY", "Weekly"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="scheduled_runs"
    )
    skill_slug = models.CharField(max_length=60)
    skill_name = models.CharField(max_length=120)
    cadence = models.CharField(max_length=10, choices=Cadence.choices, default=Cadence.DAILY)
    input = models.JSONField(default=dict, blank=True)
    active = models.BooleanField(default=True)
    next_run = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.skill_name} · {self.cadence}"


class Automation(models.Model):
    class Status(models.TextChoices):
        SUCCESS = "success", "on success"
        WARNING = "warning", "on warning"
        ERROR = "error", "on error"
        ANY = "any", "on any result"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="automations"
    )
    name = models.CharField(max_length=150)
    # Legacy single trigger->action fields (kept for compatibility / summaries).
    trigger_skill = models.CharField(max_length=60, blank=True, default="")
    trigger_status = models.CharField(max_length=10, choices=Status.choices, default=Status.SUCCESS)
    action_skill = models.CharField(max_length=60, blank=True, default="")
    # The visual flow graph built in the Automation Studio: {nodes, edges}.
    graph = models.JSONField(default=dict, blank=True)
    active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
