"""
Seed demo connectors per tenant plus a handful of sample skill runs so the
Decision Engine and history views have data. Idempotent.

Usage:
    python manage.py seed_connectors
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Role, Tenant, User
from connectors.models import Connector
from skills.models import SkillRun
from skills.registry import REGISTRY

DEMO_CONNECTORS = [
    {
        "name": "Availity Eligibility API",
        "kind": Connector.Kind.REST,
        "base_url": "https://api.availity.example.com",
        "description": "Real-time 270/271 eligibility checks.",
        "status": Connector.Status.CONNECTED,
    },
    {
        "name": "Change Healthcare Claims",
        "kind": Connector.Kind.REST,
        "base_url": "https://api.changehealthcare.example.com",
        "description": "837 claim submission clearinghouse.",
        "status": Connector.Status.CONNECTED,
    },
    {
        "name": "Payer MCP Server",
        "kind": Connector.Kind.MCP,
        "base_url": "https://mcp.eirim.io/payer",
        "description": "MCP tools for payer data & prior-auth.",
        "status": Connector.Status.DISCONNECTED,
    },
]

# (skill slug, sample input) used to generate a few runs per tenant.
SAMPLE_RUNS = [
    ("eligibility-verification", {"member_id": "ABC123456789", "payer": "Aetna PPO", "service_type": "Office visit", "service_date": "2026-07-15"}),
    ("eligibility-verification", {"member_id": "XYZ987654321", "payer": "Cigna HMO", "service_type": "Imaging", "service_date": "2026-07-16"}),
    ("prior-authorization", {"member_id": "ABC123456789", "cpt_code": "70551", "diagnosis_code": "M54.5", "provider": "Dr. Smith"}),
    ("claim-submission", {"patient_name": "Jane Doe", "payer": "UnitedHealthcare", "cpt_codes": "99213", "charge_amount": "320"}),
    ("claim-submission", {"patient_name": "John Roe", "payer": "Aetna", "cpt_codes": "93000", "charge_amount": "180"}),
    ("referrals", {"patient_name": "Jane Doe", "referring_provider": "Dr. Lee", "specialty": "Cardiology", "reason": "Chest pain"}),
    ("denial-management", {"claim_id": "CLM0099123456", "denial_reason_code": "CO-16", "payer": "Aetna"}),
    ("denial-management", {"claim_id": "CLM0088777111", "denial_reason_code": "PR-1", "payer": "Cigna"}),
    ("claim-status-inquiry", {"claim_id": "CLM0077665544", "member_id": "ABC123456789"}),
    ("claim-status-inquiry", {"claim_id": "CLM0055443322", "member_id": "XYZ987654321"}),
    ("payment-posting", {"era_reference": "ERA-2026-000123", "claim_id": "CLM0099123456"}),
    ("payment-posting", {"era_reference": "ERA-2026-000124"}),
]


class Command(BaseCommand):
    help = "Seed demo connectors and sample skill runs for each tenant."

    @transaction.atomic
    def handle(self, *args, **options):
        for tenant in Tenant.objects.all():
            admin = User.objects.filter(tenant=tenant, role=Role.TENANT_ADMIN).first()
            self._seed_connectors(tenant, admin)
            self._seed_runs(tenant, admin)
        self.stdout.write(self.style.SUCCESS("\n✔ Connectors & sample runs seeded."))

    def _seed_connectors(self, tenant, admin):
        for data in DEMO_CONNECTORS:
            if Connector.objects.filter(tenant=tenant, name=data["name"]).exists():
                continue
            Connector.objects.create(
                tenant=tenant, created_by=admin, last_checked_at=timezone.now(), **data
            )
            self.stdout.write(f"• {tenant.name}: connector {data['name']}")

    def _seed_runs(self, tenant, admin):
        if SkillRun.objects.filter(tenant=tenant).exists():
            return
        for slug, data in SAMPLE_RUNS:
            skill = REGISTRY.get(slug)
            if not skill:
                continue
            output = skill.run(data, {"user": admin, "connector": None})
            SkillRun.objects.create(
                tenant=tenant,
                skill_slug=skill.slug,
                skill_name=skill.name,
                input=data,
                output=output,
                status=output.get("status", "success"),
                created_by=admin,
            )
        self.stdout.write(f"• {tenant.name}: {len(SAMPLE_RUNS)} sample runs")
