from django.db import models
from modules.models import App  # your client model
from accounts.models import User, Client
from django.contrib.postgres.indexes import GinIndex
from django.utils import timezone
class AgentTask(models.Model):
    STATUS_CHOICES = [
        ("NEW", "New"),
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILURE", "Failure"),
        ("NEEDS-ATTENTION", "Needs Attention"),
    ]

    id = models.BigAutoField(primary_key=True)
    apikey = models.ForeignKey(App, to_field="api_key", db_column="apikey", on_delete=models.CASCADE)
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, null=True, blank=True, default=None)

    data = models.JSONField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="NEW")
    created_at = models.DateTimeField(default=timezone.now)
    status_changed_at = models.DateTimeField(auto_now=True)

    # ✅ Internal counter for retries
    current_retry = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "agent_task"

    def __str__(self):
        return f"{self.apikey} - {self.status} ({self.current_retry}/{self.max_retries})"


class Instructions(models.Model):
    system_prompt = models.TextField()
    questions = models.JSONField()
    client = models.OneToOneField(Client, on_delete=models.CASCADE)

    def __str__(self):
        return self.system_prompt[:50]

