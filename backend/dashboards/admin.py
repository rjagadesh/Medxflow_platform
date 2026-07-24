from django.contrib import admin

from .models import DashboardConfig


@admin.register(DashboardConfig)
class DashboardConfigAdmin(admin.ModelAdmin):
    list_display = ["tenant", "updated_at"]
