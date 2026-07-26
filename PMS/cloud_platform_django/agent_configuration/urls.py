from django.urls import path
from .views import *
from rest_framework.routers import DefaultRouter
router = DefaultRouter()

urlpatterns = [
    path('save/', GeminiIntegrationSave.as_view(), name='save_agent_configuration'),
    path('list/',GeminiIntegrationList.as_view(), name ='list_agent_config'),
    path('update',GeminiIntegrationUpdate.as_view(), name ='list_agent_config'),
    path('get/<str:apikey>/', AgentConfigurationGetUsingAPIKEY.as_view(), name='get_agent_config')
]