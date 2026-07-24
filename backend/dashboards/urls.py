"""API routes for the dashboard."""
from django.urls import path

from .views import DashboardTileDetailView, DashboardTilesView, DashboardView

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("dashboard/tiles/", DashboardTilesView.as_view(), name="dashboard-tiles"),
    path("dashboard/tiles/<str:tile_id>/", DashboardTileDetailView.as_view(), name="dashboard-tile-detail"),
]
