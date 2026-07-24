"""API routes for the connectors app."""
from django.urls import path

from .views import ConnectorDetailView, ConnectorListCreateView, ConnectorTestView

urlpatterns = [
    path("connectors/", ConnectorListCreateView.as_view(), name="connectors"),
    path("connectors/<int:pk>/", ConnectorDetailView.as_view(), name="connector-detail"),
    path("connectors/<int:pk>/test/", ConnectorTestView.as_view(), name="connector-test"),
]
