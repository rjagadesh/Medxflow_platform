"""
Secret Vault API — tenant-scoped items with an explicit reveal + a password
generator.

  GET/POST        /api/vault/items/         -> list (no secrets) / create
  GET/PATCH/DELETE /api/vault/items/<id>/   -> retrieve / update / delete
  GET             /api/vault/items/<id>/reveal/ -> decrypt & return the secret
  GET             /api/vault/generate/      -> a strong random password
"""
import secrets
import string

from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role
from audit.models import record

from .models import VaultItem
from .serializers import VaultItemSerializer


def _items(user):
    qs = VaultItem.objects.select_related("tenant")
    return qs if user.role == Role.SUPER_ADMIN else qs.filter(tenant=user.tenant)


class VaultListCreateView(generics.ListCreateAPIView):
    serializer_class = VaultItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = _items(self.request.user)
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("q")
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(title__icontains=search)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.tenant is None:
            raise ValidationError("Sign in as a tenant user to use the vault.")
        item = serializer.save(tenant=user.tenant, created_by=user)
        record(user, "VAULT", "Created vault item", item.title)


class VaultDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VaultItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _items(self.request.user)


class VaultRevealView(APIView):
    """Decrypt and return an item's secret — the only endpoint that does so."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        item = _items(request.user).filter(pk=pk).first()
        if not item:
            return Response({"detail": "Not found."}, status=404)
        record(request.user, "VAULT", "Revealed secret", item.title)
        return Response({"secret": item.get_secret()})


class PasswordGeneratorView(APIView):
    """Generate a strong random password (1Password-style)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            length = min(max(int(request.query_params.get("length", 20)), 8), 64)
        except (TypeError, ValueError):
            length = 20
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*-_=+"
        password = "".join(secrets.choice(alphabet) for _ in range(length))
        return Response({"password": password, "length": length})
