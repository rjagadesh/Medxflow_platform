from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'triggers', TriggerDetailsViewSet, basename='triggerdetails')

urlpatterns = [
    path('', include(router.urls)),
    path('generate-cron/', CronGeneratorView.as_view(), name='generate-cron'),
    path('triggerflag/', triggerflag, name='triggerflag'),
    path("status/<int:trigger_id>/", TriggerStatusAPIView.as_view(), name="trigger-status"),
]
