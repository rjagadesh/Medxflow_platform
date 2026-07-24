from django.contrib import admin

from .models import FileFolder, StoredFile


@admin.register(FileFolder)
class FileFolderAdmin(admin.ModelAdmin):
    list_display = ["name", "tenant", "parent", "created_at"]
    list_filter = ["tenant"]


@admin.register(StoredFile)
class StoredFileAdmin(admin.ModelAdmin):
    list_display = ["name", "tenant", "folder", "size", "created_at"]
    list_filter = ["tenant"]
