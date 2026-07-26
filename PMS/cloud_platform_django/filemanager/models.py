from django.db import models
from django.conf import settings

class FileManager(models.Model):

    data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    file_path = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_files",
    )

    class Meta:
        db_table = "file_manager"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.file_path or 'Unnamed File'}"
