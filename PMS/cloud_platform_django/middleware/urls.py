# apps/usage/urls.py
from django.urls import path
from .views import *
stedi_urls = [
    path("proxy/", StediProxyView.as_view(), name="stedi-proxy"),
    path("usage/logs/", ClientApiUsageList.as_view(), name="stedi-usage-logs"),
    path("usage/summary/", ClientApiUsageSummary.as_view(), name="stedi-usage-summary"),
    path("client-api-usage/", client_api_usage_summary, name="client-api-usage-summary"),
    path("client-api-usage-client/", client_api_usage_clientwise, name="client-api-usage-client-wise"),
 
]

api_url =[
    path("text/", GeminiTextAPIView.as_view(), name="gemini-text"),
    path("vision/", GeminiVisionAPIView.as_view(), name="gemini-vision"),
    path('ai-usage-summary/', AIUsageSummaryView.as_view(), name='ai-usage-summary'),
]
urlpatterns = stedi_urls + api_url