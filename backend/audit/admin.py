from django.contrib import admin

from .models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ["created_at", "category", "action", "user_email", "tenant"]
    list_filter = ["category", "tenant"]
    search_fields = ["action", "description", "user_email"]
