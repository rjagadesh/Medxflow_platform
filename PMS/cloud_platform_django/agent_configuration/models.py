from django.db import models
from accounts.models import Client
from modules.models import App


class AgentConfiguration(models.Model):
    app = models.ForeignKey('modules.App', null=True, on_delete=models.CASCADE)
    client = models.ForeignKey("accounts.Client",  null=True,on_delete=models.CASCADE)
    agent_name = models.CharField(max_length=1000)
    agent_description = models.TextField(blank=True, null=True)
    role = models.TextField(blank=True, null=True)
    few_shot = models.TextField(blank=True, null=True)
    task = models.TextField(blank=True, null=True)
    rules = models.TextField(blank=True, null=True)
    context = models.TextField(blank=True, null=True)
    config_data = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('app', 'agent_name')

    def __str__(self):
        return f"{self.agent_name} ({self.app})"