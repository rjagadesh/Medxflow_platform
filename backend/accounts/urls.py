"""API routes for the accounts app."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .mfa import MFADisableView, MFASetupView, MFAVerifyView
from .views import (
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    SwitchTenantView,
    TenantListCreateView,
    UserListCreateView,
)

urlpatterns = [
    # Auth
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    # Current user
    path("me/", MeView.as_view(), name="me"),
    path("switch-tenant/", SwitchTenantView.as_view(), name="switch-tenant"),
    # MFA
    path("mfa/setup/", MFASetupView.as_view(), name="mfa-setup"),
    path("mfa/verify/", MFAVerifyView.as_view(), name="mfa-verify"),
    path("mfa/disable/", MFADisableView.as_view(), name="mfa-disable"),
    # Admin resources
    path("tenants/", TenantListCreateView.as_view(), name="tenants"),
    path("users/", UserListCreateView.as_view(), name="users"),
]
