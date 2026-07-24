"""
Idempotent seed command: creates the platform super admin plus a couple of
sample tenants, each with a tenant admin and a member, so you can log in and
explore role-based behaviour right away.

Usage:
    python manage.py seed_data
"""
import os

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Role, Tenant, User


# (email, full_name, password, role) for the per-tenant demo users.
def _tenant_people(slug):
    return [
        (f"admin@{slug}.eirim.io", f"{slug.title()} Admin", "Tenant@12345", Role.TENANT_ADMIN),
        (f"user@{slug}.eirim.io", f"{slug.title()} User", "Member@12345", Role.MEMBER),
    ]


SAMPLE_TENANTS = [
    ("Acme Corporation", "acme"),
    ("Globex Industries", "globex"),
]


class Command(BaseCommand):
    help = "Seed the platform super admin, sample tenants, admins and members."

    @transaction.atomic
    def handle(self, *args, **options):
        self._create_super_admin()
        for name, slug in SAMPLE_TENANTS:
            self._create_tenant(name, slug)
        self.stdout.write(self.style.SUCCESS("\n✔ Seeding complete."))
        self.stdout.write("\nLog in with any of these accounts:")
        self.stdout.write(self.style.WARNING(f"  SUPER ADMIN  {self._sa_email()} / {self._sa_password()}"))
        for _, slug in SAMPLE_TENANTS:
            for email, _name, pwd, role in _tenant_people(slug):
                self.stdout.write(f"  {role:<12} {email} / {pwd}")

    # -- helpers ------------------------------------------------------------
    def _sa_email(self):
        return os.environ.get("SUPERADMIN_EMAIL", "admin@eirim.io").lower()

    def _sa_password(self):
        return os.environ.get("SUPERADMIN_PASSWORD", "Admin@12345")

    def _create_super_admin(self):
        email = self._sa_email()
        if User.objects.filter(email=email).exists():
            self.stdout.write(f"• Super admin {email} already exists.")
            return
        User.objects.create_superuser(
            email=email, password=self._sa_password(), full_name="MedXFlow Super Admin"
        )
        self.stdout.write(self.style.SUCCESS(f"• Created super admin {email}"))

    def _create_tenant(self, name, slug):
        tenant, created = Tenant.objects.get_or_create(slug=slug, defaults={"name": name})
        if created:
            self.stdout.write(self.style.SUCCESS(f"• Created tenant {name}"))
        for email, full_name, password, role in _tenant_people(slug):
            if User.objects.filter(email=email).exists():
                continue
            user = User(email=email, full_name=full_name, role=role, tenant=tenant)
            user.set_password(password)
            user.save()
            self.stdout.write(f"    - {role} {email}")
