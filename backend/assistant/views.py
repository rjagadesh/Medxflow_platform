"""
Developer-mode chat API.

  GET  /api/dev-chat/?section=<slug>  -> conversation history for this user+section
  POST /api/dev-chat/  {section, message} -> logs the message, replies, logs reply
"""
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DevChatMessage
from .reply import generate_reply


class DevChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DevChatMessage
        fields = ["id", "section", "sender", "content", "created_at"]


class DevChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        section = request.query_params.get("section", "")
        qs = DevChatMessage.objects.filter(user=request.user, section=section)
        return Response(DevChatMessageSerializer(qs, many=True).data)

    def post(self, request):
        user = request.user
        if user.tenant is None:
            raise ValidationError("Developer chat is available to tenant users.")

        section = str(request.data.get("section", "")).strip()
        message = str(request.data.get("message", "")).strip()
        if not section or not message:
            raise ValidationError("Both 'section' and 'message' are required.")

        DevChatMessage.objects.create(
            tenant=user.tenant, user=user, section=section,
            sender=DevChatMessage.Sender.USER, content=message,
        )

        history = list(
            DevChatMessage.objects.filter(user=user, section=section)
            .order_by("created_at")
            .values("sender", "content")
        )

        # Page-scoped actuator: the dashboard chat actually edits the dashboard
        # (adds/removes metric tiles) — and ONLY the dashboard. Every other
        # section falls back to the guidance responder.
        action = None
        if section == "dashboard":
            from dashboards.chat import handle as handle_dashboard
            reply_text, action = handle_dashboard(user, message)
        else:
            reply_text = generate_reply(section, message, history)

        reply = DevChatMessage.objects.create(
            tenant=user.tenant, user=user, section=section,
            sender=DevChatMessage.Sender.ASSISTANT, content=reply_text,
        )
        data = DevChatMessageSerializer(reply).data
        if action:
            data["action"] = action
        return Response(data, status=201)
