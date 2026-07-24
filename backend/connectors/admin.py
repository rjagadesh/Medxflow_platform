from django.contrib import admin

from .models import Connector


@admin.register(Connector)
class ConnectorAdmin(admin.ModelAdmin):
    list_display = ["name", "tenant", "kind", "status", "base_url", "last_checked_at"]
    list_filter = ["kind", "status", "tenant"]
    search_fields = ["name", "base_url"]
