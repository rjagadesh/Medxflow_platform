from django.db import models
from accounts.models import User
from django.utils import timezone
from modules.models import GeneratedAPI
class Project(models.Model):
    tenant = models.ForeignKey(User, on_delete=models.CASCADE)
    project_name = models.CharField(max_length=255)
    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)  # created once
    updated_at = models.DateTimeField(auto_now=True)      # auto-updates on save

    def __str__(self):
        return self.project_name

    class Meta:
        db_table = "project"


class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    task_name = models.CharField(max_length=255)
    description = models.TextField()
    task_data = models.JSONField(null=True, blank=True)

    # ✅ store python code here
    python_code = models.TextField(null=True, blank=True)
    apikey = models.ForeignKey(GeneratedAPI, to_field="api_key", db_column="apikey",null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.task_name

    class Meta:
        db_table = "task"


class AssetDetails(models.Model):
    asset_id = models.AutoField(db_column='asset_id', primary_key=True)
    name = models.CharField(db_column='asset_name', max_length=255, blank=True, null=True)
    description = models.TextField(db_column='asset_desc', blank=True, null=True)
    value = models.TextField(db_column='asset_value', blank=True, null=True)
    asset_type = models.CharField(db_column='asset_type', max_length=100, blank=True, null=True)
    user = models.ForeignKey(
        User,
        db_column='asset_user_id',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )
    label = models.CharField(db_column='asset_label', max_length=100, blank=True, null=True)

    created_at = models.DateField(db_column='asset_created_at', blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'assets'

import uuid

class UserAPIKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=64, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="api_keys")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_api_keys"
