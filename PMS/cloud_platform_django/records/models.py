from django.db import models
from accounts.models import User
from modules.models import App

class AppRecord(models.Model):
    tenant = models.ForeignKey(User, on_delete=models.CASCADE)
    app = models.ForeignKey(App, on_delete=models.CASCADE)
    data = models.JSONField()

    def __str__(self):
        return f"{self.app.app_name} - Record"
    class Meta:
        db_table = "app_records"
