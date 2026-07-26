from django.db import models
from django.utils import timezone
from modules.models import Agent_API_SecretKeyss


class ClientApiUsage(models.Model):
    apikey = models.ForeignKey(
        Agent_API_SecretKeyss,
        to_field="api_key",
        db_column="apikey",
        on_delete=models.CASCADE,
        related_name="api_usages"
    )
    date = models.DateField(default=timezone.now)
    count = models.IntegerField(default=1)

    class Meta:
        db_table = "client_api_usage"
        unique_together = ("apikey", "date")   # ✅ unique per apikey + date
        indexes = [
            models.Index(fields=["apikey", "date"]),
        ]

    def __str__(self):
        return f"{self.apikey.api_key} ({self.date})"


class ClientAIUsage(models.Model):
    client = models.ForeignKey(
        'accounts.Client',
        on_delete=models.CASCADE,
        related_name='ai_usage',
        null=True,
        blank=True
    )
    request_type = models.CharField(max_length=50)  # e.g., "text" or "vision"
    # prompt = models.TextField()
    # response_text = models.TextField(blank=True, null=True)
    tokens_used = models.IntegerField(default=0)
    cost = models.DecimalField(max_digits=10, decimal_places=4, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "client_ai_usage"