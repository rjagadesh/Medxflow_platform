"""
Seed the three license tiers, and (for demo purposes) allocate a couple of
sample licenses to the seeded tenants. Idempotent — safe to re-run.

Usage:
    python manage.py seed_licenses
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Role, Tenant, User
from licensing.models import License, LicensePlan

PLANS = [
    {
        "tier": LicensePlan.Tier.BASIC,
        "name": "Basic",
        "description": "For small teams getting started.",
        "default_seats": 5,
        "price_monthly": 0,
        "rank": 1,
        "features": ["Up to 5 seats", "Core features", "Community support"],
    },
    {
        "tier": LicensePlan.Tier.PROFESSIONAL,
        "name": "Professional",
        "description": "For growing organisations that need more.",
        "default_seats": 25,
        "price_monthly": 49,
        "rank": 2,
        "features": ["Up to 25 seats", "Advanced features", "Priority email support"],
    },
    {
        "tier": LicensePlan.Tier.ENTERPRISE,
        "name": "Enterprise",
        "description": "For large deployments with premium needs.",
        "default_seats": 100,
        "price_monthly": 199,
        "rank": 3,
        "features": ["100+ seats", "All features", "Dedicated support & SLA"],
    },
]


class Command(BaseCommand):
    help = "Seed license tiers and sample tenant allocations."

    @transaction.atomic
    def handle(self, *args, **options):
        plans = self._seed_plans()
        self._seed_sample_allocations(plans)
        self.stdout.write(self.style.SUCCESS("\n✔ License seeding complete."))

    def _seed_plans(self):
        plans = {}
        for data in PLANS:
            plan, created = LicensePlan.objects.update_or_create(
                tier=data["tier"], defaults=data
            )
            plans[data["tier"]] = plan
            verb = "Created" if created else "Updated"
            self.stdout.write(f"• {verb} tier {plan.name}")
        return plans

    def _seed_sample_allocations(self, plans):
        super_admin = User.objects.filter(role=Role.SUPER_ADMIN).first()
        today = timezone.now().date()

        samples = {
            "acme": [
                (LicensePlan.Tier.PROFESSIONAL, 25, today + timedelta(days=365)),
                (LicensePlan.Tier.BASIC, 5, None),
            ],
            "globex": [
                (LicensePlan.Tier.ENTERPRISE, 100, today + timedelta(days=365)),
            ],
        }

        for slug, allocations in samples.items():
            tenant = Tenant.objects.filter(slug=slug).first()
            if not tenant:
                continue
            for tier, seats, expires_on in allocations:
                plan = plans[tier]
                # Avoid duplicating the same demo allocation on re-run.
                exists = License.objects.filter(
                    tenant=tenant, plan=plan, seats=seats
                ).exists()
                if exists:
                    continue
                License.objects.create(
                    tenant=tenant,
                    plan=plan,
                    seats=seats,
                    starts_on=today,
                    expires_on=expires_on,
                    allocated_by=super_admin,
                )
                self.stdout.write(f"    - {tenant.name}: {plan.name} ({seats} seats)")
