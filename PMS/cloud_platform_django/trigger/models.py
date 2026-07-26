from django.db import models

from django.db import models
from django.utils import timezone
from projects.models import Project,Task
from accounts.models import User
from licenses.models import Machine
from modules.models import App

class TriggerDetails(models.Model):
    trigger_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='triggers',
        null=True,
        blank=True
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='triggers',
        null=True,
        blank=True
    )
    machine = models.ForeignKey(
        Machine,
        on_delete=models.SET_NULL,
        related_name='triggers',
        null=True,
        blank=True
    )
    cron_query = models.TextField(blank=True, null=True)
    agentid = models.CharField(max_length=50, blank=True, null=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='triggers',
        null=True,
        blank=True
    )
    cron_command = models.TextField(blank=True, null=True)
    json_data = models.TextField(blank=True, null=True)
    is_created = models.BooleanField(default=False)
    cron_flag = models.CharField(max_length=100, blank=True, null=True)
    code_env = models.CharField(max_length=20, default="tasks-json")
    created_at = models.DateTimeField(default=timezone.now)
    scaling = models.CharField(max_length=10, default='100')

    class Meta:
        managed = True
        db_table = 'triggers'
        verbose_name = 'Trigger'
        verbose_name_plural = 'Triggers'
        indexes = [
            models.Index(fields=['project', 'task', 'created_at']),
        ]
    def get_machine_name(self):
        return self.machine.machine_name if self.machine else None
    def __str__(self):
        return self.name or f"Trigger {self.trigger_id}"
 
class TriggerStatus(models.Model):
    STATUS_CHOICES = [
        ("started", "Started"),
        ("success", "Success"),
        ("failure", "Failure"),
    ]

    trigger = models.ForeignKey(
        "TriggerDetails",
        on_delete=models.CASCADE,
        related_name="statuses",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        null=True,
        blank=True,
        default=None,
    )
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    exception = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "trigger_status"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.trigger} - {self.status}"
 
