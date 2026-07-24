"""
AI Kiosk Builder API.

  GET  /api/kiosk/default/          -> the default starter kiosk HTML
  GET  /api/kiosk/screens/          -> list saved screens {id, name, updated_at}
  POST /api/kiosk/screens/          -> save a new screen {name, html}
  GET  /api/kiosk/screens/<id>/     -> load a screen (full html)
  PUT  /api/kiosk/screens/<id>/     -> update a screen {name?, html?}
  DELETE /api/kiosk/screens/<id>/   -> delete a screen
  POST /api/kiosk/chat/             -> {html, message} -> {html, reply}  (AI edits HTML)
"""
from django.utils import timezone
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role

from . import ai
from .models import KioskScreen
from .serializers import KioskScreenListSerializer, KioskScreenSerializer
from .templates import DEFAULT_HTML, SAMPLE_KIOSKS


def _tscope(user):
    qs = KioskScreen.objects.all()
    return qs if user.role == Role.SUPER_ADMIN else qs.filter(tenant=user.tenant)


class DefaultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"html": DEFAULT_HTML})


class ScreensView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tscope(self.request.user)

    def list(self, request, *args, **kwargs):
        # Seed a couple of sample kiosks the first time a tenant opens the builder.
        u = request.user
        if u.tenant is not None and not KioskScreen.objects.filter(tenant=u.tenant).exists():
            for sample in SAMPLE_KIOSKS:
                KioskScreen.objects.create(
                    tenant=u.tenant, created_by=u, name=sample["name"], html=sample["html"],
                )
        return super().list(request, *args, **kwargs)

    def get_serializer_class(self):
        return KioskScreenSerializer if self.request.method == "POST" else KioskScreenListSerializer

    def perform_create(self, serializer):
        if self.request.user.tenant is None:
            raise ValidationError("Sign in as a tenant user to save kiosks.")
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)


class ScreenDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = KioskScreenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tscope(self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())


class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = (request.data.get("message") or "").strip()
        html = request.data.get("html") or DEFAULT_HTML
        if not message:
            raise ValidationError("Tell me what to change on the kiosk.")
        try:
            new_html, reply = ai.edit(html, message)
        except ai.KioskAIUnavailable:
            return Response({
                "html": html,
                "reply": "The AI designer is offline — set ANTHROPIC_API_KEY to edit the kiosk by chat.",
            })
        return Response({"html": new_html, "reply": reply})
