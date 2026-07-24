"""Eligibility Verification routes."""
from django.urls import path

from .views import (
    ChecksView, CheckDetailView, NpiLookupView, PayerSearchView, ReparseView, ServiceTypesView,
)

urlpatterns = [
    path("eligibility/service-types/", ServiceTypesView.as_view(), name="elig-service-types"),
    path("eligibility/payers/", PayerSearchView.as_view(), name="elig-payers"),
    path("eligibility/checks/", ChecksView.as_view(), name="elig-checks"),
    path("eligibility/checks/<int:pk>/", CheckDetailView.as_view(), name="elig-check-detail"),
    path("eligibility/checks/<int:pk>/reparse/", ReparseView.as_view(), name="elig-reparse"),
    path("npi/<str:npi>", NpiLookupView.as_view(), name="npi-lookup"),
]
