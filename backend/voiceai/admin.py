"""Django admin registration for Voice AI agents."""
from django.contrib import admin

from .models import VoiceAgent


@admin.register(VoiceAgent)
class VoiceAgentAdmin(admin.ModelAdmin):
    list_display = ["name", "tenant", "status", "voice", "language", "model", "updated_at"]
    list_filter = ["status", "voice", "language", "tenant"]
    search_fields = ["name", "description"]


from .models import AgentInstruction, IvrConfig, VobCall


@admin.register(AgentInstruction)
class AgentInstructionAdmin(admin.ModelAdmin):
    list_display = ["name", "tenant", "voice", "created_at"]


@admin.register(IvrConfig)
class IvrConfigAdmin(admin.ModelAdmin):
    list_display = ["name", "tenant", "payer_label", "created_at"]


@admin.register(VobCall)
class VobCallAdmin(admin.ModelAdmin):
    list_display = ["patient_name", "member_id", "payer", "status", "confidence", "created_at"]
    list_filter = ["status", "tenant"]
