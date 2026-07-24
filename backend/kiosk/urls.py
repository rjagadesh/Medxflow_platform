"""AI Kiosk Builder routes."""
from django.urls import path

from .views import ChatView, DefaultView, ScreenDetailView, ScreensView

urlpatterns = [
    path("kiosk/default/", DefaultView.as_view(), name="kiosk-default"),
    path("kiosk/screens/", ScreensView.as_view(), name="kiosk-screens"),
    path("kiosk/screens/<int:pk>/", ScreenDetailView.as_view(), name="kiosk-screen"),
    path("kiosk/chat/", ChatView.as_view(), name="kiosk-chat"),
]
