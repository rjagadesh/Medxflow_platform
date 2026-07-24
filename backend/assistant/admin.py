from django.contrib import admin

from .models import DevChatMessage


@admin.register(DevChatMessage)
class DevChatMessageAdmin(admin.ModelAdmin):
    list_display = ["section", "sender", "user", "tenant", "created_at"]
    list_filter = ["section", "sender", "tenant"]
