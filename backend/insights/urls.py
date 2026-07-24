"""Decision Engine chat routes."""
from django.urls import path

from .views import AskView, ConnectionDetailView, ConnectionsView

urlpatterns = [
    path("decision-engine/connections/", ConnectionsView.as_view(), name="de-connections"),
    path("decision-engine/connections/<int:pk>/", ConnectionDetailView.as_view(), name="de-connection"),
    path("decision-engine/ask/", AskView.as_view(), name="de-ask"),
]
