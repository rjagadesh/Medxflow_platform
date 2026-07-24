"""
Connector API — tenant-scoped CRUD plus a "test connection" action.

The test is a lightweight reachability check: for a REST connector we attempt a
short HTTP GET; for MCP we validate the URL shape. Either way we record the
resulting status so the UI can show a live badge. (No secrets are returned.)
"""
from urllib.request import Request, urlopen

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role

from .models import Connector
from .serializers import ConnectorSerializer


def _tenant_qs(user):
    qs = Connector.objects.select_related("tenant")
    if user.role == Role.SUPER_ADMIN:
        return qs
    return qs.filter(tenant=user.tenant)


class ConnectorListCreateView(generics.ListCreateAPIView):
    serializer_class = ConnectorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tenant_qs(self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.tenant is None:
            from rest_framework.exceptions import ValidationError

            raise ValidationError("Sign in as a tenant user to add a connector.")
        serializer.save(tenant=user.tenant, created_by=user)


class ConnectorDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ConnectorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tenant_qs(self.request.user)


class ConnectorTestView(APIView):
    """POST /api/connectors/<id>/test/ — probe the endpoint and store status."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        connector = _tenant_qs(request.user).filter(pk=pk).first()
        if not connector:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        ok, detail = self._probe(connector)
        connector.status = (
            Connector.Status.CONNECTED if ok else Connector.Status.ERROR
        )
        connector.last_checked_at = timezone.now()
        connector.save(update_fields=["status", "last_checked_at"])
        return Response(
            {"status": connector.status, "detail": detail},
            status=status.HTTP_200_OK,
        )

    def _probe(self, connector):
        url = connector.base_url
        if not (url.startswith("http://") or url.startswith("https://")):
            return False, "URL must start with http:// or https://"
        try:
            req = Request(url, method="GET")
            if connector.api_key:
                req.add_header("Authorization", f"Bearer {connector.api_key}")
            with urlopen(req, timeout=4) as resp:
                return True, f"Reachable (HTTP {resp.status})."
        except Exception as exc:  # noqa: BLE001 — surface any failure to the UI
            # A reachable host that returns an HTTP error still counts as "up".
            code = getattr(exc, "code", None)
            if code:
                return True, f"Reachable (HTTP {code})."
            return False, f"Unreachable: {exc.__class__.__name__}"
