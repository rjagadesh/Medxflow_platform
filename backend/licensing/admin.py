"""Django admin registration for licensing."""
from django.contrib import admin

from .models import License, LicensePlan


@admin.register(LicensePlan)
class LicensePlanAdmin(admin.ModelAdmin):
    list_display = ["name", "tier", "default_seats", "price_monthly", "rank"]
    ordering = ["rank"]


@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):
    list_display = ["tenant", "plan", "seats", "status", "starts_on", "expires_on", "allocated_by"]
    list_filter = ["status", "plan__tier", "tenant"]
    search_fields = ["tenant__name"]
    autocomplete_fields = ["tenant"]
