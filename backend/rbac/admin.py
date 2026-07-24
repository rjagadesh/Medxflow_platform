from django.contrib import admin

from .models import RolePermission


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ["tenant", "role", "feature", "can_view", "can_edit", "can_delete"]
    list_filter = ["tenant", "role"]
    search_fields = ["feature"]
