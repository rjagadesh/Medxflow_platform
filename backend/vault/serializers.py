"""
Serializers for vault items.

The list/detail representation never includes the decrypted secret — it only
flags whether one exists (``has_secret``). Writing accepts a ``secret`` field
(write-only) which is encrypted on save. Revealing the secret is a separate,
explicit endpoint.
"""
from rest_framework import serializers

from .models import VaultItem


class VaultItemSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    has_secret = serializers.BooleanField(read_only=True)
    secret = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = VaultItem
        fields = [
            "id",
            "title",
            "category",
            "category_label",
            "username",
            "url",
            "notes",
            "favorite",
            "has_secret",
            "secret",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "category_label", "has_secret", "created_at", "updated_at"]

    def create(self, validated_data):
        secret = validated_data.pop("secret", "")
        item = VaultItem(**validated_data)
        item.set_secret(secret)
        item.save()
        return item

    def update(self, instance, validated_data):
        secret = validated_data.pop("secret", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if secret is not None:
            instance.set_secret(secret)
        instance.save()
        return instance
