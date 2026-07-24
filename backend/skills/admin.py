from django.contrib import admin

from .models import SkillRun


@admin.register(SkillRun)
class SkillRunAdmin(admin.ModelAdmin):
    list_display = ["skill_name", "tenant", "status", "created_by", "created_at"]
    list_filter = ["skill_slug", "status", "tenant"]
    readonly_fields = ["input", "output"]
