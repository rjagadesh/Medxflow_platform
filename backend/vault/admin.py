from django.contrib import admin

from .models import VaultItem


@admin.register(VaultItem)
class VaultItemAdmin(admin.ModelAdmin):
    list_display = ["title", "tenant", "category", "username", "favorite", "updated_at"]
    list_filter = ["category", "tenant", "favorite"]
    search_fields = ["title", "username"]
    # Never expose the encrypted blob for editing in the admin.
    exclude = ["secret_encrypted"]
