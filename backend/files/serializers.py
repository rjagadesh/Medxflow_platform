"""Serializers for folders and files."""
from rest_framework import serializers

from .models import FileFolder, StoredFile


class FileFolderSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = FileFolder
        fields = ["id", "name", "parent", "item_count", "created_at"]
        read_only_fields = ["id", "item_count", "created_at"]

    def get_item_count(self, obj):
        return obj.children.count() + obj.files.count()


class StoredFileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.display_name", read_only=True, default=None
    )

    class Meta:
        model = StoredFile
        fields = [
            "id",
            "name",
            "folder",
            "file",
            "url",
            "size",
            "content_type",
            "uploaded_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "name", "url", "size", "content_type", "created_at"]
        extra_kwargs = {"file": {"write_only": True}}

    def get_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return None
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url
