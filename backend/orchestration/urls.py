"""API routes for orchestration (scheduled runs + automations)."""
from django.urls import path

from .views import (
    AutomationDetailView,
    AutomationListCreateView,
    ScheduledRunDetailView,
    ScheduledRunListCreateView,
)

urlpatterns = [
    path("scheduled-runs/", ScheduledRunListCreateView.as_view(), name="scheduled-runs"),
    path("scheduled-runs/<int:pk>/", ScheduledRunDetailView.as_view(), name="scheduled-run-detail"),
    path("automations/", AutomationListCreateView.as_view(), name="automations"),
    path("automations/<int:pk>/", AutomationDetailView.as_view(), name="automation-detail"),
]
