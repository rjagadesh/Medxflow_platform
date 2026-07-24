"""
Developer-mode chat log.

Each message belongs to a (tenant, user, section) conversation. ``section`` is
the screen the user was on when developer mode was toggled — e.g.
"eligibility-verification" or "decision-engine" — so the assistant's context is
scoped to that tab.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class DevChatMessage(models.Model):
    class Sender(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="dev_chats"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dev_chats"
    )
    section = models.CharField(max_length=80)
    sender = models.CharField(max_length=10, choices=Sender.choices)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.section}:{self.sender}"
