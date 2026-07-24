"""
Secret Vault models (1Password-style).

A ``VaultItem`` is a stored secret — a login, API key, secure note, etc. The
sensitive value is held encrypted in ``secret_encrypted`` and only decrypted on
an explicit reveal. Items are tenant-scoped.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone

from .crypto import decrypt, encrypt


class VaultItem(models.Model):
    class Category(models.TextChoices):
        LOGIN = "LOGIN", "Login"
        PASSWORD = "PASSWORD", "Password"
        API_KEY = "API_KEY", "API Key"
        SECURE_NOTE = "SECURE_NOTE", "Secure Note"
        CARD = "CARD", "Credit Card"
        DATABASE = "DATABASE", "Database"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="vault_items"
    )
    title = models.CharField(max_length=150)
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.LOGIN
    )
    username = models.CharField(max_length=255, blank=True)
    url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    favorite = models.BooleanField(default=False)

    # The sensitive value, stored encrypted at rest.
    secret_encrypted = models.TextField(blank=True, default="")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-favorite", "title"]

    def __str__(self):
        return f"{self.title} ({self.category})"

    # -- Encrypted secret access -------------------------------------------
    def set_secret(self, plaintext):
        self.secret_encrypted = encrypt(plaintext) if plaintext else ""

    def get_secret(self):
        return decrypt(self.secret_encrypted)

    @property
    def has_secret(self):
        return bool(self.secret_encrypted)
