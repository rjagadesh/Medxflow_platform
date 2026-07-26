from django.db import models
from accounts.models import User
from modules.models import App

class Machine(models.Model):
    client = models.ForeignKey(User, on_delete=models.CASCADE)
    machine_ip = models.CharField(max_length=50)
    machine_name = models.CharField(max_length=30,null=True)
    machine_username = models.CharField(max_length=60,null=True)
    machine_password = models.CharField(max_length=60,null=True)
    width = models.IntegerField(null=True)
    height = models.IntegerField(null=True)
    modules_and_apps = models.JSONField(null=True, blank=True)
    license_key = models.CharField(max_length=255, null=True, blank=True)
    validity_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.license_key
    class Meta:
        db_table = "machine"

class AppApiKey(models.Model):
    tenant = models.ForeignKey(User, on_delete=models.CASCADE)
    app = models.ForeignKey(App, on_delete=models.CASCADE)
    app_key = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.app_key
    class Meta:
        db_table = "app_apikey"
