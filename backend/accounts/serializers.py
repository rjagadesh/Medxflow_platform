"""Serializers for authentication and account resources."""
import pyotp
from django.contrib.auth.password_validation import validate_password
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Role, Tenant, User


class TenantSerializer(serializers.ModelSerializer):
    user_count = serializers.IntegerField(source="users.count", read_only=True)

    class Meta:
        model = Tenant
        fields = ["id", "name", "slug", "is_active", "created_at", "user_count"]
        read_only_fields = ["id", "created_at", "user_count"]


class UserSerializer(serializers.ModelSerializer):
    """Public-facing representation of a user (no password)."""

    tenant_name = serializers.CharField(source="tenant.name", read_only=True)
    display_name = serializers.CharField(read_only=True)
    initials = serializers.CharField(read_only=True)
    tenants = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "display_name",
            "initials",
            "avatar",
            "role",
            "tenant",
            "tenant_name",
            "tenants",
            "mfa_enabled",
            "is_active",
            "date_joined",
        ]

    def get_tenants(self, obj):
        """Tenants this user may switch into (feature #12)."""
        return [{"id": t.id, "name": t.name} for t in obj.memberships.all()]
        read_only_fields = ["id", "date_joined", "display_name", "tenant_name"]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Lets a signed-in user edit their own profile — ``full_name`` and ``avatar``.
    Email, role and tenant are read-only, so a user can never change their own
    role or move themselves between tenants.
    """

    tenant_name = serializers.CharField(source="tenant.name", read_only=True)
    display_name = serializers.CharField(read_only=True)
    initials = serializers.CharField(read_only=True)
    tenants = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "display_name",
            "initials",
            "avatar",
            "role",
            "tenant",
            "tenant_name",
            "tenants",
            "mfa_enabled",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "tenant", "mfa_enabled", "date_joined"]

    def get_tenants(self, obj):
        return [{"id": t.id, "name": t.name} for t in obj.memberships.all()]


class RegistrationSerializer(serializers.Serializer):
    """
    Public self-service sign-up. Creates a brand-new organisation (tenant) and
    makes the registering user its tenant admin.
    """

    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    organization_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs

    def _unique_slug(self, name):
        base = slugify(name) or "org"
        slug, i = base, 1
        while Tenant.objects.filter(slug=slug).exists():
            i += 1
            slug = f"{base}-{i}"
        return slug

    def create(self, validated_data):
        tenant = Tenant.objects.create(
            name=validated_data["organization_name"],
            slug=self._unique_slug(validated_data["organization_name"]),
        )
        user = User(
            email=validated_data["email"],
            full_name=validated_data["full_name"],
            role=Role.TENANT_ADMIN,
            tenant=tenant,
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


class EirimTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    JWT login serializer that (a) embeds role/tenant into the token,
    (b) enforces MFA when the account has it enabled, and (c) returns the
    serialized user alongside the tokens.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["tenant_id"] = user.tenant_id
        token["email"] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)  # authenticates; sets self.user
        if not self.user.is_active:
            raise serializers.ValidationError("This account is disabled.")

        # Second factor: only after the password has already been verified.
        if self.user.mfa_enabled:
            otp = (self.initial_data or {}).get("otp", "")
            otp = (otp or "").strip()
            if not otp:
                raise serializers.ValidationError(
                    {"mfa_required": True, "detail": "Enter your authentication code."}
                )
            totp = pyotp.TOTP(self.user.mfa_secret)
            if not totp.verify(otp, valid_window=1):
                raise serializers.ValidationError(
                    {"mfa_required": True, "detail": "Invalid authentication code."}
                )

        data["user"] = UserSerializer(self.user).data
        return data


class CreateUserSerializer(serializers.ModelSerializer):
    """Used by tenant/super admins to create users within a tenant."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "password", "role", "tenant"]

    def validate_role(self, value):
        if value == Role.SUPER_ADMIN:
            raise serializers.ValidationError(
                "Super admins cannot be created through this endpoint."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
