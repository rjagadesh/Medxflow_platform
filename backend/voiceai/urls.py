"""API routes for the Voice AI app."""
from django.urls import path

from .views import (
    AgentInstructionDetailView,
    AgentInstructionListCreateView,
    AgentOptionsView,
    AgentVersionDetailView,
    AgentVersionListCreateView,
    CallRecordListView,
    CampaignDetailView,
    CampaignListCreateView,
    IvrConfigDetailView,
    IvrConfigListCreateView,
    VobCallDetailView,
    VobCallListCreateView,
    VobOptionsView,
    VoiceAgentDetailView,
    VoiceAgentListCreateView,
)

urlpatterns = [
    path("voice-agents/options/", AgentOptionsView.as_view(), name="agent-options"),
    path("voice-agents/", VoiceAgentListCreateView.as_view(), name="voice-agents"),
    path("voice-agents/<int:pk>/", VoiceAgentDetailView.as_view(), name="voice-agent-detail"),
    path("voice-agents/<int:pk>/versions/", AgentVersionListCreateView.as_view(), name="agent-versions"),
    path("agent-versions/<int:pk>/", AgentVersionDetailView.as_view(), name="agent-version-detail"),
    path("campaigns/", CampaignListCreateView.as_view(), name="campaigns"),
    path("campaigns/<int:pk>/", CampaignDetailView.as_view(), name="campaign-detail"),
    path("call-records/", CallRecordListView.as_view(), name="call-records"),
    # VOB module
    path("vob/options/", VobOptionsView.as_view(), name="vob-options"),
    path("vob/instructions/", AgentInstructionListCreateView.as_view(), name="vob-instructions"),
    path("vob/instructions/<int:pk>/", AgentInstructionDetailView.as_view(), name="vob-instruction-detail"),
    path("vob/ivr-configs/", IvrConfigListCreateView.as_view(), name="vob-ivr-configs"),
    path("vob/ivr-configs/<int:pk>/", IvrConfigDetailView.as_view(), name="vob-ivr-config-detail"),
    path("vob/calls/", VobCallListCreateView.as_view(), name="vob-calls"),
    path("vob/calls/<int:pk>/", VobCallDetailView.as_view(), name="vob-call-detail"),
]
