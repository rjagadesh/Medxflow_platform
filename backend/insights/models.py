"""
Decision Engine data connections.

A tenant (or super admin) can register external databases by connection string.
The connection string (DSN) is stored server-side and never serialized back to
the client. The tenant's *own* MedXFlow operational database is always available as
a virtual built-in connection (not stored here) — see service.py.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class DataConnection(models.Model):
    class Engine(models.TextChoices):
        POSTGRES = "postgres", "PostgreSQL"
        MYSQL = "mysql", "MySQL"
        SQLITE = "sqlite", "SQLite"

    # tenant None = a platform-level connection added by a super admin.
    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE,
        related_name="data_connections", null=True, blank=True,
    )
    name = models.CharField(max_length=120)
    engine = models.CharField(max_length=10, choices=Engine.choices, default=Engine.POSTGRES)
    # SQLAlchemy URL / raw connection string. Stored server-side, never returned.
    dsn = models.TextField()
    status = models.CharField(max_length=14, default="unknown")
    error = models.CharField(max_length=300, blank=True, default="")
    table_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="created_connections",
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} [{self.engine}]"
