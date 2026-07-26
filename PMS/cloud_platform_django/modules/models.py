from django.db import models
from accounts.models import User, Client
import hashlib
import time
import uuid
import secrets

DEFAULT_TABLE_COLUMNS = {
    "referral_agent": [{
        'table_name': 'patient_requests',
        'columns': {
            "Request ID": True,
            "Patient Name": True,
            "Date": True,
            "Priority": True,
            "Status": True
        }
    }],
}


class Module(models.Model):
    module_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    # system-wide vs client-specific
    is_system = models.BooleanField(default=False)

    # map to client
    client = models.ForeignKey(
        "accounts.Client", on_delete=models.CASCADE, null=True, blank=True, related_name="modules"
    )

    def __str__(self):
        return self.module_name
    class Meta:
        db_table = "module"

class App(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="apps")
    app_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    is_system = models.BooleanField(default=False)
    hide_app = models.ManyToManyField("accounts.Client", blank=True, related_name="hide_apps")

    client = models.ForeignKey(
        "accounts.Client", on_delete=models.CASCADE, null=True, blank=True, related_name="apps"
    )

    api_key = models.CharField(max_length=50, unique=True, null=True)
    def save(self, *args, **kwargs):
        if not self.api_key:
            self.api_key = self.generate_api_key()
        super().save(*args, **kwargs)

    def generate_api_key(self):
        import hashlib, time, uuid
        base_string = f"{self.app_name}-{time.time()}-{uuid.uuid4()}"
        hex_digest = hashlib.sha256(base_string.encode()).hexdigest()
        chunks = [hex_digest[i:i+5] for i in range(0, 25, 5)]
        return "-".join(chunks).upper()

    def __str__(self):
        return self.app_name
    class Meta:
        db_table = "app"

class Sub_apps(models.Model):
    parent_app = models.ForeignKey(App, on_delete=models.CASCADE, null=True, blank=True, related_name="sub_apps")
    sub_app_name = models.CharField(max_length=255)

    def __str__(self):
        return self.sub_app_name

    class Meta:
        db_table = "sub_agents"


class AppsColumnSetting(models.Model):
    app_name = models.ForeignKey(App, on_delete=models.CASCADE)      
    columns = models.JSONField()                  
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('app_name', 'user')
        db_table = "app_column_settings"

    def __str__(self):
        return f"{self.app_name} - ({self.user.username})"
    

class CustomColumn(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    column_names = models.JSONField()
    app_column_settings = models.ForeignKey(AppsColumnSetting, on_delete=models.CASCADE, null=True, blank=True)
    class Meta:
        db_table = "custom_columns"


def generate_api_key():
    return secrets.token_hex(16)


class GeneratedAPI(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("running", "Running"),
        ("success", "Success"),
        ("failure", "Failure"),
    ]
    api_key = models.CharField(max_length=255, unique=True, default=generate_api_key)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    apps = models.ForeignKey(App, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    max_retries = models.PositiveSmallIntegerField(default=1)  # moved here
    task_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    class Meta:
        db_table = "client_apps_apikey"
        unique_together = ("user", "apps")  

    def __str__(self):
        return f"API {self.api_key} - {self.user.first_name}"


class Agent_API_SecretKeyss(models.Model):

    api_key = models.CharField(max_length=255, unique=True, default=generate_api_key)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    sub_app = models.ForeignKey("Sub_apps", on_delete=models.CASCADE, null=True, blank=True, related_name="api_keys")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ✅ New column

    class Meta:
        db_table = "sub_agent_apikeys"
        unique_together = ("user", "sub_app")  # prevent duplicates per user+sub_app

    def __str__(self):
        return f"API {self.api_key} - {self.user.first_name if self.user else 'No User'}"
    


class ModulePermission(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    module_permissions = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "module_permissions"

    def __str__(self):
        return f"Permissions for {self.user.username}"

class LogRecords(models.Model):
    LOG_TYPE_CHOICES = [
        ("agent", "Agent"),
        ("api_key", "API Key"),
        ("login", "Login"),
        ("logout", "Logout"),
        ("modules", "Modules"),
    ]

    LOG_STATUS_CHOICES = [
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name="log_records"
    )
    log_type = models.CharField(max_length=100, choices=LOG_TYPE_CHOICES)
    log_status = models.CharField(max_length=100, choices=LOG_STATUS_CHOICES, null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    # ✅ Store client_id in DB
    client_id = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "log_records"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        # ✅ Automatically set client_id from user if it exists
        if self.user and hasattr(self.user, "client_id"):
            self.client_id = self.user.client_id
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.log_type} by {self.user.username if self.user else 'Unknown User'} at {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"