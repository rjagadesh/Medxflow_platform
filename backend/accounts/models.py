"""
Data model for MedXFlow's multi-tenant, role-based platform.

Tenancy model
-------------
A single shared PostgreSQL database and schema is used. Every user belongs to
exactly one ``Tenant`` (except the platform SUPER_ADMIN, whose ``tenant`` is
null because they operate above all tenants). This "shared schema + tenant_id"
approach keeps the setup simple and easy to review while still isolating data
per organisation at the application layer.

Roles
-----
* SUPER_ADMIN  – platform owner; can see and manage every tenant.
* TENANT_ADMIN – administers users inside their own tenant.
* MEMBER       – a regular end user of a tenant.
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class Tenant(models.Model):
    """An organisation / customer account. The isolation boundary for data."""

    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=60, unique=True, help_text="URL-safe identifier")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.slug})"


class Role(models.TextChoices):
    """The role a user holds within the platform."""

    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
    TENANT_ADMIN = "TENANT_ADMIN", "Tenant Admin"
    MEMBER = "MEMBER", "Member"


class UserManager(BaseUserManager):
    """Manager for the email-based custom user model."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", Role.MEMBER)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Create a platform super admin (also a Django superuser)."""
        extra_fields.setdefault("role", Role.SUPER_ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("tenant", None)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Email-authenticated user. Each user carries a ``role`` and (for everyone
    except the super admin) a ``tenant`` they belong to.
    """

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.MEMBER
    )

    # Multi-factor authentication (TOTP). ``mfa_secret`` holds the shared secret;
    # ``mfa_enabled`` is only set True once the user verifies a first code.
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=64, blank=True, default="")
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="users",
        null=True,
        blank=True,
        help_text="The active tenant. Null only for the platform super admin.",
    )
    # Every tenant this user may switch into (feature #12). Their active
    # ``tenant`` is always one of these.
    memberships = models.ManyToManyField(
        Tenant, related_name="members", blank=True
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # email + password are prompted by createsuperuser

    class Meta:
        ordering = ["email"]

    def __str__(self):
        return self.email

    # -- Convenience role helpers -------------------------------------------
    @property
    def is_super_admin(self):
        return self.role == Role.SUPER_ADMIN

    @property
    def is_tenant_admin(self):
        return self.role == Role.TENANT_ADMIN

    @property
    def display_name(self):
        return self.full_name or self.email.split("@")[0]

    @property
    def initials(self):
        source = self.full_name.strip() or self.email
        parts = source.split()
        if len(parts) >= 2:
            return (parts[0][:1] + parts[1][:1]).upper()
        return source[:2].upper()
