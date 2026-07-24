"""
API views for authentication, the current user, tenants and user management.

Access rules
------------
* /api/auth/login/   – public (issues JWT access + refresh).
* /api/auth/refresh/ – public (exchanges a refresh token for a new access).
* /api/me/           – any authenticated user (their own profile).
* /api/tenants/      – SUPER_ADMIN only.
* /api/users/        – TENANT_ADMIN (their tenant) or SUPER_ADMIN (all tenants).
"""
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Role, Tenant, User
from .permissions import IsSuperAdmin, IsTenantAdmin
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    CreateUserSerializer,
    EirimTokenObtainPairSerializer,
    ProfileUpdateSerializer,
    RegistrationSerializer,
    TenantSerializer,
    UserSerializer,
)


class LoginView(TokenObtainPairView):
    """POST email + password (+ otp when MFA is on) -> {access, refresh, user}."""

    permission_classes = [AllowAny]
    serializer_class = EirimTokenObtainPairSerializer


class RegisterView(APIView):
    """
    Public self-service sign-up. Creates a new organisation + tenant admin and
    immediately returns JWT tokens so the user lands signed in.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["tenant_id"] = user.tenant_id
        refresh["email"] = user.email
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class SwitchTenantView(APIView):
    """
    Feature #12: switch the user's active tenant to another org they belong to.
    POST {tenant_id}. The target must be in the user's memberships.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        tenant_id = request.data.get("tenant_id")
        target = user.memberships.filter(pk=tenant_id).first()
        if not target:
            return Response(
                {"detail": "You don't have access to that organisation."},
                status=status.HTTP_403_FORBIDDEN,
            )
        user.tenant = target
        user.save(update_fields=["tenant"])
        return Response(UserSerializer(user).data)


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET the current user's profile, or PATCH it to update editable fields
    (currently just ``full_name``). Always operates on the requesting user.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ProfileUpdateSerializer

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        from audit.models import record

        serializer.save()
        record(self.request.user, "SETTINGS", "Updated profile")


class LogoutView(APIView):
    """
    Stateless JWT logout. Tokens are short-lived and the client discards them
    on logout; this endpoint exists so the frontend has a definitive call to
    make and so the flow can later be extended with token blacklisting.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {"detail": "Logged out."}, status=status.HTTP_205_RESET_CONTENT
        )


class TenantListCreateView(generics.ListCreateAPIView):
    """List all tenants or create a new one — super admin only."""

    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsSuperAdmin]


class UserListCreateView(generics.ListCreateAPIView):
    """
    List/create users. A super admin sees every user; a tenant admin sees and
    creates only within their own tenant.
    """

    permission_classes = [IsTenantAdmin]

    def get_serializer_class(self):
        return CreateUserSerializer if self.request.method == "POST" else UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == Role.SUPER_ADMIN:
            return User.objects.select_related("tenant").all()
        return User.objects.select_related("tenant").filter(tenant=user.tenant)

    def perform_create(self, serializer):
        from audit.models import record

        user = self.request.user
        # A tenant admin can only create users inside their own tenant.
        if user.role == Role.TENANT_ADMIN:
            created = serializer.save(tenant=user.tenant)
        else:
            created = serializer.save()
        record(user, "USERS", "Created user", created.email)
