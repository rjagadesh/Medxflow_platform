

from django.urls import include,path
from .views import *
from rest_framework.routers import DefaultRouter
from .views import AgentLifeCycleViewSet, TelephonySettingsViewSet, AgentPromptViewSet, ConversationAnalysisAPI, get_livekit_connection_details

router = DefaultRouter()
router.register("agent-life-cycle", AgentLifeCycleViewSet, basename="agent-life-cycle")
router.register("telephony-settings", TelephonySettingsViewSet, basename="telephony-settings")
router.register("agent-versions", AgentVersionViewSet, basename="agent-versions")
router.register("agent-prompts", AgentPromptViewSet, basename="agent-prompts")
router.register("config-json",ConfigJSONViewSet,basename="config-json")
router.register(r'call-logs', CallLogViewSet, basename='call-log')
router.register("agent-scripts", AgentScriptViewSet, basename="agent-scripts")

urlpatterns = [
    path('agent-scripts/get_by_version/', AgentScriptViewSet.as_view({'get': 'get_by_version'}), name='agent-scripts-get-by-version'),
    path('voice-home/',home,name="home"),
    path('contact-number/',ListofAvailableNumber.as_view(),name="ListofAvailableNumber"),
    path('Retrive-Contant-Number/',RetriveContantNumber.as_view(),name="RetriveContantNumber"),
    path('conversation-process/<int:pk>/', ConversationAnalysisAPI.as_view(), name="conversation-analysis"),
    path('AI-Agent-Data/',RetriveAgentData.as_view(),name="RetriveAgentData"),
    path('', include(router.urls)),
    path('connection-details/', get_livekit_connection_details, name='get-livekit-connection-details'),
    path('update-room-metadata/', update_room_metadata, name='update_room_metadata'),
    path('agent-info/phone-number', AgentInfoByPhoneNumberView.as_view(), name='agent-info-by-phone'),
    path(
        "agent-info/by-app/",
        AgentInfoByAppUserView.as_view(),
        name="agent-info-by-app",
    ),
    path('analyze-files/', GeminiFileAnalysis.as_view(), name='analyze_agent_files'),
    path('create-checkout-session/', VoiceAICreateCheckoutSessionView.as_view(), name='voiceai_create_checkout_session'),
    path("agents/outbound-enabled/", OutboundEnabledAgentsView.as_view(), name="outbound-enabled-agents"),
    path('recordings/url/', get_recording_presigned_url, name='recording-presigned-url'),
    path('mobile-numbers/', list_mobile_numbers, name='list-mobile-numbers'),
    path('mobile-numbers/assign/', assign_number_to_agent, name='assign-mobile-number'),
    path('mobile-numbers/release/', release_number, name='release-mobile-number'),
    path('optimize-script/', OptimizeScriptAPI.as_view(), name='optimize_script'),
    path('agent-scripts-version/get_by_version/', AgentScriptViewSet.as_view({'get': 'get_by_version'}), name='agent-scripts-get-by-version'),
    path("twiml-bin/", TwiMLVoiceHandler.as_view(), name="twiml-voice"),
    path('analytics/<int:department_id>/', AgentAnalyticsView.as_view(), name='agent-analytics'),
    path(
        "analytics/<int:department_id>/total-duration/",
        AgentTotalDurationView.as_view(),
        name="agent-total-duration",
    ),
    path(
        "analytics/<int:department_id>/historical-spend/",
        HistoricalMonthlySpendView.as_view(),
        name="historical-monthly-spend",
    ),
    path("client-voice-usage/", ClientVoiceAIUsageView.as_view(), name="client-voice-usage"),
    path("daily-voice-usage/", DailyVoiceAIUsageView.as_view(), name="daily-voice-usage"),
    path("agent-tasks/<int:pk>/update-data/", AgentTaskDataUpdateView.as_view(), name="agent-task-update-data"),
    path('analytics/kpi/', VoiceAIKPIView.as_view(), name='voice_ai_kpi'),

]
