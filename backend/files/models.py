"""
File Manager models.

A simple tenant-scoped file tree: ``FileFolder`` forms the hierarchy (a null
parent is the tenant root) and ``StoredFile`` holds an uploaded file inside a
folder (or the root when folder is null).
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class FileFolder(models.Model):
    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="folders"
    )
    name = models.CharField(max_length=120)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class StoredFile(models.Model):
    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="files"
    )
    folder = models.ForeignKey(
        FileFolder, on_delete=models.CASCADE, null=True, blank=True, related_name="files"
    )
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="tenant_files/")
    size = models.PositiveBigIntegerField(default=0)
    content_type = models.CharField(max_length=120, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        # Remove the file from storage when the record is deleted.
        self.file.delete(save=False)
        super().delete(*args, **kwargs)
