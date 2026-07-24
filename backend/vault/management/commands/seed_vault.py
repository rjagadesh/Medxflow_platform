"""
Seed demo vault items and a couple of file folders per tenant so the Secret
Vault and File Manager aren't empty on first load. Idempotent.

Usage:
    python manage.py seed_vault
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Role, Tenant, User
from files.models import FileFolder
from vault.models import VaultItem

VAULT_ITEMS = [
    {"title": "Payer Portal Login", "category": "LOGIN", "username": "billing@clinic.com",
     "url": "https://portal.availity.com", "secret": "Sup3r$ecret!23", "favorite": True},
    {"title": "Clearinghouse API Key", "category": "API_KEY", "username": "prod",
     "secret": "sk_live_9f8a7b6c5d4e3f2a1b0c", "favorite": False},
    {"title": "EHR Database", "category": "DATABASE", "username": "eirim_app",
     "url": "db.internal.eirim.io", "secret": "P@ssw0rd-db-2026", "favorite": False},
    {"title": "Recovery Codes", "category": "SECURE_NOTE",
     "notes": "Break-glass MFA recovery codes for the admin account.",
     "secret": "42917-88103-55620-77431", "favorite": False},
]

FOLDERS = ["Contracts", "Claims", "Compliance"]


class Command(BaseCommand):
    help = "Seed demo vault items and file folders for each tenant."

    @transaction.atomic
    def handle(self, *args, **options):
        for tenant in Tenant.objects.all():
            admin = User.objects.filter(tenant=tenant, role=Role.TENANT_ADMIN).first()
            self._seed_vault(tenant, admin)
            self._seed_folders(tenant, admin)
        self.stdout.write(self.style.SUCCESS("\n✔ Vault & folders seeded."))

    def _seed_vault(self, tenant, admin):
        if VaultItem.objects.filter(tenant=tenant).exists():
            return
        for data in VAULT_ITEMS:
            fields = {k: v for k, v in data.items() if k != "secret"}
            item = VaultItem(tenant=tenant, created_by=admin, **fields)
            item.set_secret(data.get("secret", ""))
            item.save()
        self.stdout.write(f"• {tenant.name}: {len(VAULT_ITEMS)} vault items")

    def _seed_folders(self, tenant, admin):
        for name in FOLDERS:
            FileFolder.objects.get_or_create(
                tenant=tenant, name=name, parent=None,
                defaults={"created_by": admin},
            )
        self.stdout.write(f"• {tenant.name}: {len(FOLDERS)} folders")
