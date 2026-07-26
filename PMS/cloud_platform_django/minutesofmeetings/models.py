from django.db import models
from accounts.models import Client
from django.conf import settings


class MinutesOfMeetings(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    transcription = models.TextField(blank=True, null=True)
    transcription_file = models.FileField(upload_to="minutes_of_meetings/input/", null=True, blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="minutes_of_meetings")
    output = models.TextField(help_text="Generated Minutes of Meeting text")
    output_file = models.FileField(upload_to="minutes_of_meetings/output/", null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.date}"


class MailTemplate(models.Model):
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    to_mails = models.TextField(help_text="Comma-separated email addresses")
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="mail_templates")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_mail_templates")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Signature(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="signatures")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.user}"
