"""
Seed a couple of demo voice agents per tenant so the Voice AI studio isn't
empty on first load. Idempotent.

Usage:
    python manage.py seed_agents
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Role, Tenant, User
from voiceai.models import VoiceAgent

DEMO_AGENTS = [
    {
        "name": "Reception Riley",
        "description": "Greets callers and routes them to the right place.",
        "persona": "Friendly front-desk receptionist",
        "status": VoiceAgent.Status.ACTIVE,
        "voice": VoiceAgent.Voice.ARIA,
        "language": VoiceAgent.Language.EN_US,
        "greeting": "Hi! Thanks for calling. How can I help you today?",
        "system_prompt": (
            "You are Riley, a warm and efficient receptionist. Greet callers, "
            "understand what they need, and route or answer briefly. Keep replies "
            "short and friendly."
        ),
        "model": VoiceAgent.Model.SONNET,
        "temperature": 0.6,
    },
    {
        "name": "Support Sam",
        "description": "Handles common support questions and troubleshooting.",
        "persona": "Patient technical support specialist",
        "status": VoiceAgent.Status.DRAFT,
        "voice": VoiceAgent.Voice.JAMES,
        "language": VoiceAgent.Language.EN_US,
        "greeting": "Hello, you've reached support. What can I help you fix today?",
        "system_prompt": (
            "You are Sam, a calm and knowledgeable support agent. Diagnose issues "
            "step by step, confirm understanding, and never overwhelm the caller."
        ),
        "model": VoiceAgent.Model.HAIKU,
        "temperature": 0.4,
    },
]


class Command(BaseCommand):
    help = "Seed demo voice agents for each tenant."

    @transaction.atomic
    def handle(self, *args, **options):
        for tenant in Tenant.objects.all():
            creator = (
                User.objects.filter(tenant=tenant, role=Role.TENANT_ADMIN).first()
            )
            for data in DEMO_AGENTS:
                if VoiceAgent.objects.filter(tenant=tenant, name=data["name"]).exists():
                    continue
                VoiceAgent.objects.create(tenant=tenant, created_by=creator, **data)
                self.stdout.write(f"• {tenant.name}: created agent {data['name']}")
        self.stdout.write(self.style.SUCCESS("\n✔ Agent seeding complete."))
