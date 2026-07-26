import re
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
import uuid, hashlib, time
from django.utils import timezone
import pyotp
from django.db import models, transaction, connection
from django_tenants.models import TenantMixin, DomainMixin
from django_tenants.utils import schema_context, get_tenant_model
from django.core.management import call_command
from django.core.exceptions import ValidationError
import secrets
import hashlib
from django.contrib.postgres.fields import ArrayField
from django.core.validators import validate_ipv46_address


from django.conf import settings
class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("The Username must be set")
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("roles", "admin")
        return self.create_user(username, password, **extra_fields)


class Client(TenantMixin):
    LICENSE_CHOICES = [
        ("standard", "STANDARD"),
        ("pro", "PRO"),
        ("enterprise", "ENTERPRISE"),
        ("lite", "LITE"),
        ("free trail", "FREE TRAIL"),
    ]

    # Your existing fields
    client_id = models.CharField(max_length=50, unique=True, blank=True)
    client_name = models.CharField(max_length=255, unique=True)
    license_tier = models.CharField(max_length=50, choices=LICENSE_CHOICES, default="free trail")
    dev_count = models.PositiveIntegerField(default=0)
    dev_vm_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    prod_count = models.PositiveIntegerField(default=0)
    prod_vm_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    vm_count = models.PositiveIntegerField(default=0)
    client_vm_count = models.PositiveIntegerField(default=0)
    client_virtual_machine_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    client_vm_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_of_vm = models.CharField(max_length=10, choices=[('actual', 'Actual Cost'), ('sop', 'SOP Cost')], blank=True, null=True)
    effective_date = models.DateTimeField(default=timezone.now)
    license_key = models.CharField(max_length=50, unique=True, blank=True)
    created_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    machine_ip = models.CharField(max_length=15, null=True, blank=True)
    status = models.CharField(max_length=10, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    api_key = models.CharField(max_length=100, unique=True, null=True, blank=True)
    additional_cost = models.JSONField(null=True, blank=True)
    tier_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_clients")
    voice_ai_license = models.BooleanField(default=False, help_text="Enable Voice AI License")
    # Controls EMR isolation
    has_emr_module = models.BooleanField(default=False, help_text="Enable isolated EMR/PHR schema")

    allowed_ips = ArrayField(
        models.GenericIPAddressField(), 
        default=list, 
        blank=True, 
        help_text="List of allowed IP addresses (e.g. ['192.168.1.1', '10.0.0.1'])"
    )

    # THIS LINE IS THE FIX — NO MORE MIGRATION PROMPT EVER
    schema_name = models.CharField(
        max_length=63,
        blank=True,
        null=True,
        default='public',
        unique=False,  # ← THIS IS THE FIX — no unique constraint
        help_text="Auto-set to 'public' for non-EMR, unique tenant_xxx for EMR"
    )

    # django-tenants required
    auto_create_schema = True
    auto_drop_schema = True
    number_limit = models.PositiveIntegerField(default=1)
        # --- MODEL VALIDATION HERE ---
    def clean(self):
        super().clean()
        
        # Validate the allowed_ips list on Create and Update
        if self.allowed_ips:
            invalid_ips = []
            for ip in self.allowed_ips:
                try:
                    # Built-in Django validator for IPv4 and IPv6
                    validate_ipv46_address(ip)
                except ValidationError:
                    invalid_ips.append(ip)
            
            if invalid_ips:
                raise ValidationError({
                    'allowed_ips': f"The following IPs are invalid: {', '.join(invalid_ips)}"
                })

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        was_emr = False
        if not is_new:
            old = Client.objects.get(pk=self.pk)
            was_emr = old.has_emr_module

        # Generate IDs
        if not self.client_id:
            self.client_id = self.generate_client_id()
        if not self.license_key:
            self.license_key = self.generate_license_key()

        # AUTO SET SCHEMA NAME
        if self.has_emr_module:
            if not self.schema_name or self.schema_name == 'public':
                safe = re.sub(r'[^a-z0-9]+', '_', self.client_name.lower()).strip('_')
                self.schema_name = f"tenant_{safe}"[:63]
            self.auto_create_schema = True
        else:
            self.schema_name = 'public'
            self.auto_create_schema = False

        super().save(*args, **kwargs)

        # Inside save(), after super().save()
        if self.has_emr_module and (is_new or not was_emr):
            if not self.schema_name or self.schema_name == 'public':
                raise ValueError("Schema name must be set for EMR tenant")

            try:
                # THIS IS THE CORRECT WAY
                call_command("migrate_schemas", schema_name=self.schema_name, noinput=True, verbosity=0)
            except Exception as e:
                connection.set_schema_to_public()
                if is_new:
                    # Clean up failed schema
                    from django.db import connection
                    connection.schema_editor().delete_schema(self.schema_name, cascade=True)
                    self.delete()
                raise RuntimeError(f"Failed to migrate tenant schema '{self.schema_name}': {e}") from e

        # Your audit log code here (unchanged)
        # ...

    def generate_client_id(self):
        last = Client.objects.order_by("-id").first()
        num = int(last.client_id[1:]) + 1 if last and last.client_id else 1
        return f"D{num:04d}"

    def generate_license_key(self):
        base = f"{self.client_id}-{time.time()}-{uuid.uuid4()}"
        h = hashlib.sha256(base.encode())
        return "-".join(h.hexdigest()[:25][i:i+5] for i in range(0, 25, 5)).upper()

    def __str__(self):
        return f"{self.client_name} ({self.client_id}) {'[EMR]' if self.has_emr_module else ''}"

    class Meta:
        db_table = "client"


class ClientChangeLog(models.Model):
    client = models.ForeignKey(
        "Client",
        on_delete=models.CASCADE,
        related_name="change_logs",
        db_index=True
    )
    cost_of_vm = models.CharField(
        max_length=10,
        choices=[('actual', 'Actual Cost'), ('sop', 'SOP Cost')],
        blank=True,
        null=True
    )
    client_vm_count = models.PositiveIntegerField(null=True, blank=True)
    client_virtual_machine_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    client_vm_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    vm_count = models.PositiveIntegerField(null=True, blank=True)
    dev_count = models.PositiveIntegerField(null=True, blank=True)
    dev_vm_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    prod_count = models.PositiveIntegerField(null=True, blank=True)
    prod_vm_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    effective_date = models.DateTimeField(null=True, blank=True)
    license_tier = models.CharField(max_length=50, null=True, blank=True)
    tier_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    additional_cost = models.JSONField(null=True, blank=True)
    effective_from = models.DateTimeField(default=timezone.now, db_index=True)
    effective_to = models.DateTimeField(null=True, blank=True, db_index=True)
    edited_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "client_change_log"
        ordering = ["-effective_from"]
        indexes = [
            models.Index(fields=["client", "effective_from"]),
            models.Index(fields=["client", "effective_to"]),
            models.Index(fields=["license_tier"]),
            models.Index(fields=["client"], name="active_logs_idx", condition=models.Q(effective_to__isnull=True)),
        ]

    def __str__(self):
        return f"{self.client.client_name} - {self.license_tier} ({self.effective_from.date()} → {self.effective_to.date() if self.effective_to else 'Present'})"


class Module(models.Model):
    """
    Defines system modules/features
    """
    MODULE_CATEGORY_CHOICES = [
        ("monitoring", "Monitoring"),
        ("agent_management", "Agent Management"),
        ("analytics", "Analytics"),
        ("droid_studio", "DroidStudio"),
        ("roi", "ROI"),
        ("settings", "Settings"),
        ("billing", "Billing"),
    ]

    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    category = models.CharField(max_length=50, choices=MODULE_CATEGORY_CHOICES, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = "modules"
        ordering = ["category", "name"]


class Role(models.Model):
    """
    Defines roles with permissions stored as JSONField
    """
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    description = models.TextField(null=True, blank=True)
    
    permissions = models.JSONField(
        default=dict,
        help_text="JSON object mapping module codes to permission flags"
    )
    
    client = models.ForeignKey(
        'Client', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name="roles",
        help_text="If NULL, this is a system-wide template role"
    )
    
    is_active = models.BooleanField(default=True)
    is_system_role = models.BooleanField(
        default=False,
        help_text="System roles serve as templates for client roles"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def has_permission(self, module_code, permission_type="view"):
        """Check if role has specific permission for a module"""
        module_perms = self.permissions.get(module_code, {})
        return module_perms.get(permission_type, False)

    def get_module_permissions(self, module_code):
        """Get all permissions for a specific module"""
        return self.permissions.get(module_code, {
            "view": False,
            "create": False,
            "edit": False,
            "delete": False,
            "export": False
        })

    def set_module_permissions(self, module_code, **permissions):
        """
        FIXED: Set permissions for a specific module
        
        IMPORTANT: For JSONField updates to work properly, you must:
        1. Create a NEW dict (don't modify in place)
        2. Assign it back to the field
        3. Call save()
        
        Usage: role.set_module_permissions('monitoring_dashboard', view=True, create=True)
        """
        # Create a new dict from existing permissions
        new_permissions = dict(self.permissions)
        
        # Update the module in the new dict
        if module_code not in new_permissions:
            new_permissions[module_code] = {}
        
        new_permissions[module_code].update(permissions)
        
        # Assign the new dict back to the field
        self.permissions = new_permissions
        
        # Now save
        self.save()

    def __str__(self):
        if self.client:
            return f"{self.name} ({self.client.client_name})"
        return f"{self.name} (System Template)"

    class Meta:
        db_table = "roles"
        unique_together = [["code", "client"]]
        ordering = ["is_system_role", "name"]
        indexes = [
            models.Index(fields=["client", "code"]),
            models.Index(fields=["is_system_role"]),
        ]



class User(AbstractBaseUser):
    username = models.CharField(max_length=150, unique=True)  # Login field
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=15)
    mail = models.CharField(max_length=255, unique=True)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    roles = models.CharField(
        max_length=20,
        choices=[
            ("default_user", "Default User"),
            ("client", "Client"),
            ("user", "User"),
            ("admin", "Admin"),
            ("owner", "Owner"),
            ("developer", "Developer"),
            ("project_manager", "Project Manager"),
            ("analyst", "Analyst"),
            ("bot_operator", "Bot Operator"),
            ("viewer", "Viewer"),
        ],
        default="default_user",
    )

    client = models.ForeignKey("accounts.Client", on_delete=models.SET_NULL, null=True, blank=True, related_name="users")


    tax_id = models.CharField(max_length=100, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    contact_name = models.CharField(max_length=255, null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    user_verify = models.BooleanField(default=False)

    # MFA
    mfa_secret = models.CharField(max_length=32, default=pyotp.random_base32)
    mfa_enabled = models.BooleanField(default=False)
    qr_code = models.ImageField(upload_to="mfa_qr/", blank=True, null=True)
    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["first_name", "last_name", "mobile"]

    def get_full_name(self):
        """AbstractBaseUser doesn't provide this; telehealth/meetings code relies on it."""
        full_name = f"{self.first_name or ''} {self.last_name or ''}".strip()
        return full_name or self.username

    def get_short_name(self):
        return (self.first_name or "").strip() or self.username

    def has_permission(self, module_code, permission_type="view"):
        """
        Check if user has specific permission for a module
        """
        if self.is_superuser:
            return True
        
        if not self.role:
            return False

        return self.role.has_permission(module_code, permission_type)

    def get_module_permissions(self, module_code):
        """
        Get all permissions for a specific module
        """
        if self.is_superuser:
            return {
                "view": True,
                "create": True,
                "edit": True,
                "delete": True,
                "export": True
            }
        
        if not self.role:
            return {
                "view": False,
                "create": False,
                "edit": False,
                "delete": False,
                "export": False
            }

        return self.role.get_module_permissions(module_code)

    def get_accessible_modules(self):
        """
        Get all modules the user has view access to
        """
        if self.is_superuser:
            return Module.objects.filter(is_active=True)
        
        if not self.role:
            return Module.objects.none()

        # Get module codes from role permissions where view=True
        accessible_codes = [
            code for code, perms in self.role.permissions.items()
            if perms.get("view", False)
        ]
        
        return Module.objects.filter(
            code__in=accessible_codes,
            is_active=True
        )

    def __str__(self):
        return f"{self.username} ({self.roles})"

    class Meta:
        db_table = "users"

    

class AppVersion(models.Model):
    app_name = models.CharField(max_length=255, unique=True)
    version = models.CharField(max_length=20, default="0.0.1")

    def increment_version(self):
        """Increment patch version (x.y.z → x.y.(z+1))"""
        major, minor, patch = map(int, self.version.split("."))
        patch += 1
        self.version = f"{major}.{minor}.{patch}"
        self.save()
        return self.version

    def __str__(self):
        return f"{self.app_name} - {self.version}"
    class Meta:
        db_table = "appversion"


class SummaryReportAlert(models.Model):
    SCHEDULE_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("biweekly", "Biweekly"),
        ("start-of-month","Start of the Month"),
        ("end-of-month","End of the Month"),
    ]

    emails = models.JSONField(default=list, help_text="List of recipient emails")
    schedule = models.CharField(max_length=50, choices=SCHEDULE_CHOICES)
    report_type = models.CharField(max_length=50)
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="summary_report_alerts",
    )
    schedule_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"SummaryReport: {self.report_type} - {self.schedule}"

    class Meta:
        db_table = "summary_report_alerts"
        ordering = ["report_type", "schedule"]


class InvoiceAlert(models.Model):
    SCHEDULE_CHOICES = [
        ("end-of-month","End of the Month"),
    ]

    emails = models.JSONField(default=list, help_text="List of recipient emails")
    schedule = models.CharField(max_length=50, blank=True, null=True, choices=SCHEDULE_CHOICES)
    client = models.ForeignKey(
        Client,
        related_name="invoice_alerts",
        on_delete=models.CASCADE
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"InvoiceAlert: {self.schedule}"

    class Meta:
        db_table = "invoice_alerts"
        ordering = ["schedule"]


class TeleHealthGuestAccessToken(models.Model):
    """
    Unified access tokens for both providers and patients to join telehealth meetings
    - Providers: Can use either their login credentials OR access token
    - Patients: Use guest token (no login required)
    """
    
    USER_TYPE_CHOICES = [
        ('patient', 'Patient'),
        ('provider', 'Provider'),
        ('guest', 'Guest'),
    ]
    
    # Token information
    token = models.CharField(max_length=255, unique=True, db_index=True)
    token_hash = models.CharField(max_length=64, unique=True)  # SHA256 hash
    
    # Meeting link - store database ID, not Chime meeting_id
    meeting_db_id = models.IntegerField(help_text="TelehealthMeeting database ID")
    
    # User information
    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='patient'
    )
    user_name = models.CharField(max_length=255)
    user_email = models.EmailField(null=True, blank=True)
    user_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Optional: Link to actual user if they have an account (for providers)
    linked_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='telehealth_guest_tokens',
        help_text="Link to provider's user account if applicable"
    )
    
    # Optional: Link to patient if they exist in the system
    linked_patient_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="Patient ID in tenant schema"
    )
    
    # Access control
    tenant_schema = models.CharField(max_length=63)  # Which tenant schema
    is_active = models.BooleanField(default=True)
    is_used = models.BooleanField(default=False)
    
    # Permissions (different defaults for providers vs patients)
    can_share_screen = models.BooleanField(default=True)
    can_record = models.BooleanField(default=False)
    can_chat = models.BooleanField(default=True)
    can_use_video = models.BooleanField(default=True)
    can_use_audio = models.BooleanField(default=True)
    can_mute_others = models.BooleanField(default=False)
    can_remove_participants = models.BooleanField(default=False)
    can_end_meeting = models.BooleanField(default=False)
    
    # Expiry
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    
    # Usage tracking
    access_count = models.IntegerField(default=0)
    max_access_count = models.IntegerField(default=100000)  # Can rejoin 10 times
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    
    # Security tracking (store as JSON to track multiple accesses)
    ip_addresses = models.JSONField(default=list, blank=True)
    user_agents = models.JSONField(default=list, blank=True)
    
    # Created by
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_guest_tokens'
    )
    
    class Meta:
        app_label = "accounts"
        db_table = 'guest_access_token'
        db_table = 'telehealth_guest_token'
        indexes = [
            models.Index(fields=['token_hash']),
            models.Index(fields=['tenant_schema', 'is_active']),
            models.Index(fields=['meeting_db_id', 'user_type']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.user_type.title()} token for {self.user_name} - Meeting {self.meeting_db_id}"
    
    def is_valid(self):
        """Check if token is still valid"""
        return (
            self.is_active and
            not self.is_expired() and
            self.access_count < self.max_access_count
        )
    
    def is_expired(self):
        """Check if token has expired"""
        return timezone.now() > self.expires_at
    
    def mark_used(self, ip_address=None, user_agent=None):
        """Mark token as used and track access"""
        self.access_count += 1
        self.last_accessed_at = timezone.now()
        
        if not self.is_used:
            self.is_used = True
            self.used_at = timezone.now()
        
        # Track IP addresses (avoid duplicates)
        if ip_address and ip_address not in self.ip_addresses:
            self.ip_addresses.append(ip_address)
        
        # Track user agents (avoid duplicates)
        if user_agent and user_agent not in self.user_agents:
            self.user_agents.append(user_agent)
        
        self.save(update_fields=[
            'access_count',
            'last_accessed_at',
            'is_used',
            'used_at',
            'ip_addresses',
            'user_agents'
        ])
    
    def revoke(self):
        """Revoke the token"""
        self.is_active = False
        self.save(update_fields=['is_active'])
    
    def extend_expiry(self, hours=24):
        """Extend token expiry by specified hours"""
        self.expires_at = timezone.now() + timezone.timedelta(hours=hours)
        self.save(update_fields=['expires_at'])
    
    @staticmethod
    def generate_token():
        """Generate secure random token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def hash_token(token):
        """Hash token for secure storage"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    @classmethod
    def create_for_patient(cls, meeting_db_id, patient_name, patient_email=None, 
                          patient_phone=None, tenant_schema=None, 
                          expires_hours=24, created_by=None, linked_patient=None,
                          max_access_count=10):
        """Create a guest token for a patient"""
        token = cls.generate_token()
        token_hash = cls.hash_token(token)
        
        guest_token = cls.objects.create(
            token=token,
            token_hash=token_hash,
            meeting_db_id=meeting_db_id,
            user_type='patient',
            user_name=patient_name,
            user_email=patient_email,
            user_phone=patient_phone,
            linked_patient=linked_patient,
            tenant_schema=tenant_schema or 'public',
            expires_at=timezone.now() + timezone.timedelta(hours=expires_hours),
            # Patient permissions
            can_record=False,
            can_share_screen=True,
            can_mute_others=False,
            can_remove_participants=False,
            can_end_meeting=False,
            max_access_count=max_access_count,
            created_by=created_by
        )
        
        return guest_token, token  # Return both object and plain token
    
    @classmethod
    def create_for_provider(cls, meeting_db_id, provider_name, provider_email=None,
                           tenant_schema=None, expires_hours=24, 
                           created_by=None, linked_user=None,
                           max_access_count=10):
        """Create an access token for a provider"""
        token = cls.generate_token()
        token_hash = cls.hash_token(token)
        
        guest_token = cls.objects.create(
            token=token,
            token_hash=token_hash,
            meeting_db_id=meeting_db_id,
            user_type='provider',
            user_name=provider_name,
            user_email=provider_email,
            tenant_schema=tenant_schema or 'public',
            expires_at=timezone.now() + timezone.timedelta(hours=expires_hours),
            # Provider permissions (full control)
            can_record=True,
            can_share_screen=True,
            can_mute_others=True,
            can_remove_participants=True,
            can_end_meeting=True,
            linked_user=linked_user,
            max_access_count=max_access_count,
            created_by=created_by
        )
        
        return guest_token, token  # Return both object and plain token
    
    @classmethod
    def verify_token(cls, token, meeting_db_id=None):
        """
        Verify a token and return the guest token object if valid
        Returns: (guest_token, error_message)
        """
        try:
            token_hash = cls.hash_token(token)
            guest_token = cls.objects.get(token_hash=token_hash)
            
            # Check if token is for the correct meeting
            if meeting_db_id and guest_token.meeting_db_id != meeting_db_id:
                return None, "Invalid token for this meeting"
            
            # Check if token is valid
            if not guest_token.is_valid():
                if guest_token.is_expired():
                    return None, "Token has expired"
                elif guest_token.access_count >= guest_token.max_access_count:
                    return None, "Token access limit reached"
                elif not guest_token.is_active:
                    return None, "Token has been revoked"
                else:
                    return None, "Token is invalid"
            
            return guest_token, None
            
        except cls.DoesNotExist:
            return None, "Invalid token"
    
    def get_meeting_url(self, base_url):
        """Generate the meeting URL with token"""
        return f"{base_url}/guest/join?token={self.token}"
    
    def get_permissions_dict(self):
        """Get permissions as a dictionary"""
        return {
            'can_share_screen': self.can_share_screen,
            'can_record': self.can_record,
            'can_chat': self.can_chat,
            'can_use_video': self.can_use_video,
            'can_use_audio': self.can_use_audio,
            'can_mute_others': self.can_mute_others,
            'can_remove_participants': self.can_remove_participants,
            'can_end_meeting': self.can_end_meeting,
        }
    
    def to_dict(self):
        """Convert to dictionary for API responses (without sensitive data)"""
        return {
            'id': self.id,
            'user_type': self.user_type,
            'user_name': self.user_name,
            'user_email': self.user_email,
            'meeting_db_id': self.meeting_db_id,
            'is_valid': self.is_valid(),
            'is_expired': self.is_expired(),
            'access_count': self.access_count,
            'max_access_count': self.max_access_count,
            'expires_at': self.expires_at.isoformat(),
            'created_at': self.created_at.isoformat(),
            'permissions': self.get_permissions_dict()
        }
    
    def get_chime_capabilities(self):
        """Get Chime capabilities based on permissions"""
        return {
            'Audio': 'SendReceive' if self.can_use_audio else 'None',
            'Video': 'SendReceive' if self.can_use_video else 'None',
            'Content': 'SendReceive' if self.can_share_screen else 'None'
        }