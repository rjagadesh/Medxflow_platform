"""API routes for the skills app + decision engine."""
from django.urls import path

from .views import (
    DecisionEngineView,
    NotificationsView,
    ResolveRunView,
    ReviewQueueView,
    SkillBatchRunView,
    SkillDetailView,
    SkillListView,
    SkillRunListView,
    SkillRunView,
)

urlpatterns = [
    path("skills/", SkillListView.as_view(), name="skills"),
    path("skill-runs/", SkillRunListView.as_view(), name="skill-runs"),
    path("skill-runs/<int:pk>/resolve/", ResolveRunView.as_view(), name="skill-run-resolve"),
    path("review-queue/", ReviewQueueView.as_view(), name="review-queue"),
    path("notifications/", NotificationsView.as_view(), name="notifications"),
    path("decision-engine/", DecisionEngineView.as_view(), name="decision-engine"),
    path("skills/<slug:slug>/", SkillDetailView.as_view(), name="skill-detail"),
    path("skills/<slug:slug>/run/", SkillRunView.as_view(), name="skill-run"),
    path("skills/<slug:slug>/batch/", SkillBatchRunView.as_view(), name="skill-batch"),
]
