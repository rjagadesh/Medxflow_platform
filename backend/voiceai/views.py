"""
Voice AI API — tenant-scoped agent CRUD plus a static options endpoint.

Any authenticated user may build and manage agents within their own tenant; a
super admin sees agents across all tenants.
"""
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role

from .models import AgentVersion, CallRecord, Campaign, VoiceAgent
from .serializers import (
    AgentVersionSerializer,
    CallRecordSerializer,
    CampaignSerializer,
    VoiceAgentSerializer,
    agent_options,
)


class AgentOptionsView(APIView):
    """Return the voice/language/model/status choices for the builder UI."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(agent_options())


class VoiceAgentListCreateView(generics.ListCreateAPIView):
    serializer_class = VoiceAgentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = VoiceAgent.objects.select_related("tenant", "created_by")
        if user.role == Role.SUPER_ADMIN:
            return qs
        return qs.filter(tenant=user.tenant)

    def perform_create(self, serializer):
        # A tenant user's agents belong to their tenant. The platform super
        # admin has no tenant, so they build agents from within a tenant login.
        user = self.request.user
        if user.tenant is None:
            raise ValidationError(
                "Agents are owned by a tenant. Sign in as a tenant user to create one."
            )
        agent = serializer.save(tenant=user.tenant, created_by=user)
        # Every new agent starts at v1.0 (Active) in the versioning table.
        AgentVersion.objects.create(
            agent=agent, version="v1.0", status=AgentVersion.Status.ACTIVE,
            voice_type="STT-TTS" if agent.voice_type == "STT_TTS" else "Real Time",
            agent_type=agent.agent_type, created_by=user,
        )


class VoiceAgentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VoiceAgentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = VoiceAgent.objects.select_related("tenant", "created_by")
        if user.role == Role.SUPER_ADMIN:
            return qs
        return qs.filter(tenant=user.tenant)


def _agent_for(user, pk):
    qs = VoiceAgent.objects.all()
    if user.role != Role.SUPER_ADMIN:
        qs = qs.filter(tenant=user.tenant)
    return qs.filter(pk=pk).first()


def _next_version(agent):
    """Compute the next version label, e.g. v1.0 -> v1.1."""
    latest = agent.versions.first()
    if not latest:
        return "v1.0"
    try:
        major, minor = latest.version.lstrip("v").split(".")
        return f"v{major}.{int(minor) + 1}"
    except (ValueError, AttributeError):
        return f"v{agent.versions.count() + 1}.0"


class AgentVersionListCreateView(generics.ListCreateAPIView):
    """List an agent's versions, or 'Save as New Version' (POST)."""

    serializer_class = AgentVersionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AgentVersion.objects.filter(agent_id=self.kwargs["pk"])

    def perform_create(self, serializer):
        agent = _agent_for(self.request.user, self.kwargs["pk"])
        if not agent:
            raise ValidationError("Agent not found.")
        # New version becomes Active; existing Active versions are paused.
        agent.versions.filter(status=AgentVersion.Status.ACTIVE).update(
            status=AgentVersion.Status.PAUSED
        )
        serializer.save(
            agent=agent,
            version=_next_version(agent),
            status=AgentVersion.Status.ACTIVE,
            voice_type="STT-TTS" if agent.voice_type == "STT_TTS" else "Real Time",
            agent_type=agent.agent_type,
            created_by=self.request.user,
        )


class AgentVersionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Set a version's status (Draft/Active/Paused) or delete it."""

    serializer_class = AgentVersionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = AgentVersion.objects.all()
        if user.role != Role.SUPER_ADMIN:
            qs = qs.filter(agent__tenant=user.tenant)
        return qs

    def perform_update(self, serializer):
        version = serializer.save()
        # Only one Active version per agent.
        if version.status == AgentVersion.Status.ACTIVE:
            version.agent.versions.exclude(pk=version.pk).filter(
                status=AgentVersion.Status.ACTIVE
            ).update(status=AgentVersion.Status.PAUSED)


def _campaign_scope(user):
    qs = Campaign.objects.select_related("agent")
    return qs if user.role == Role.SUPER_ADMIN else qs.filter(tenant=user.tenant)


class CampaignListCreateView(generics.ListCreateAPIView):
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _campaign_scope(self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.tenant is None:
            raise ValidationError("Sign in as a tenant user to create campaigns.")
        agent = serializer.validated_data.get("agent")
        if agent.tenant_id != user.tenant_id:
            raise ValidationError({"agent": "Agent belongs to another tenant."})
        serializer.save(tenant=user.tenant, created_by=user)


class CampaignDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _campaign_scope(self.request.user)


class CallRecordListView(generics.ListAPIView):
    """Call transcripts/history, filterable by ?agent= or ?campaign=."""

    serializer_class = CallRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = CallRecord.objects.select_related("agent")
        if user.role != Role.SUPER_ADMIN:
            qs = qs.filter(tenant=user.tenant)
        agent = self.request.query_params.get("agent")
        campaign = self.request.query_params.get("campaign")
        if agent:
            qs = qs.filter(agent_id=agent)
        if campaign:
            qs = qs.filter(campaign_id=campaign)
        return qs[:100]


# ==========================================================================
# VOB voice-agent module views
# ==========================================================================
from django.utils import timezone  # noqa: E402

from .models import AgentInstruction, IvrConfig, VobCall  # noqa: E402
from .serializers import (  # noqa: E402
    AgentInstructionSerializer,
    IvrConfigSerializer,
    VobCallListSerializer,
    VobCallSerializer,
)
from .vob_pipeline import simulate_call  # noqa: E402

VOB_VOICES = [
    {"value": "rachel", "label": "Rachel — warm female (Aura-2 Thalia)"},
    {"value": "adam", "label": "Adam — calm male (Aura-2 Orion)"},
    {"value": "bella", "label": "Bella — bright female (Aura-2 Andromeda)"},
]


def _tscope(model, user):
    qs = model.objects.all()
    return qs if user.role == Role.SUPER_ADMIN else qs.filter(tenant=user.tenant)


def _need_tenant(user):
    if user.tenant is None:
        raise ValidationError("Sign in as a tenant user.")


class VobOptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"voices": VOB_VOICES})


class AgentInstructionListCreateView(generics.ListCreateAPIView):
    serializer_class = AgentInstructionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tscope(AgentInstruction, self.request.user)

    def perform_create(self, serializer):
        _need_tenant(self.request.user)
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)


class AgentInstructionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AgentInstructionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tscope(AgentInstruction, self.request.user)


class IvrConfigListCreateView(generics.ListCreateAPIView):
    serializer_class = IvrConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tscope(IvrConfig, self.request.user)

    def perform_create(self, serializer):
        _need_tenant(self.request.user)
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)


class IvrConfigDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = IvrConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tscope(IvrConfig, self.request.user)


class VobCallListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tscope(VobCall, self.request.user)

    def get_serializer_class(self):
        return VobCallSerializer if self.request.method == "POST" else VobCallListSerializer

    def perform_create(self, serializer):
        """Place a call: create the session, then run the (simulated) pipeline."""
        user = self.request.user
        _need_tenant(user)
        call = serializer.save(tenant=user.tenant, created_by=user, status=VobCall.Status.DIALING)
        transcript, vob, confidence, decision, mode, recording = simulate_call(call)
        call.transcript = transcript
        call.vob_data = vob
        call.confidence = confidence
        call.decision = decision
        call.mode = mode
        call.recording_url = recording
        call.status = VobCall.Status.COMPLETED
        call.completed_at = timezone.now()
        call.save()


class VobCallDetailView(generics.RetrieveAPIView):
    serializer_class = VobCallSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tscope(VobCall, self.request.user)
