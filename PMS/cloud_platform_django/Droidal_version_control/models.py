from django.db import models
from django.utils import timezone

class VersionControl(models.Model):
    """
    Maintain version control for each app.
    """
    app_name = models.CharField(max_length=100, unique=True)
    version_number = models.CharField(max_length=20)
    description = models.TextField(blank=True, null=True)
    release_date = models.DateTimeField(default=timezone.now)
    deployed_by = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "version_control"
        ordering = ["-release_date"]

    def __str__(self):
        return f"{self.app_name} - v{self.version_number}"
