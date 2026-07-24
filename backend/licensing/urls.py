"""API routes for the licensing app."""
from django.urls import path

from .views import LicenseDetailView, LicenseListCreateView, LicensePlanListView

urlpatterns = [
    path("license-plans/", LicensePlanListView.as_view(), name="license-plans"),
    path("licenses/", LicenseListCreateView.as_view(), name="licenses"),
    path("licenses/<int:pk>/", LicenseDetailView.as_view(), name="license-detail"),
]
