from django.contrib import admin

from .models import Automation, ScheduledRun


@admin.register(ScheduledRun)
class ScheduledRunAdmin(admin.ModelAdmin):
    list_display = ["skill_name", "tenant", "cadence", "active", "next_run"]
    list_filter = ["cadence", "active", "tenant"]


@admin.register(Automation)
class AutomationAdmin(admin.ModelAdmin):
    list_display = ["name", "tenant", "trigger_skill", "trigger_status", "action_skill", "active"]
    list_filter = ["active", "tenant"]
