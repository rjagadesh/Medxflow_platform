"""API routes for the Secret Vault."""
from django.urls import path

from .views import (
    PasswordGeneratorView,
    VaultDetailView,
    VaultListCreateView,
    VaultRevealView,
)

urlpatterns = [
    path("vault/items/", VaultListCreateView.as_view(), name="vault-items"),
    path("vault/items/<int:pk>/", VaultDetailView.as_view(), name="vault-item-detail"),
    path("vault/items/<int:pk>/reveal/", VaultRevealView.as_view(), name="vault-reveal"),
    path("vault/generate/", PasswordGeneratorView.as_view(), name="vault-generate"),
]
