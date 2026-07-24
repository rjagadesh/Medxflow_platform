"""API routes for the developer assistant."""
from django.urls import path

from .views import DevChatView

urlpatterns = [
    path("dev-chat/", DevChatView.as_view(), name="dev-chat"),
]
