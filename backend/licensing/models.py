"""
Licensing model for MedXFlow.

Concepts
--------
* ``LicensePlan`` — the catalogue of purchasable tiers. MedXFlow ships with three:
  BASIC, PROFESSIONAL and ENTERPRISE. These are reference data (seeded once).

* ``License`` — a single allocation of a plan to a tenant. A tenant may hold
  **many** licenses at once (e.g. a block of PROFESSIONAL seats plus a separate
  ENTERPRISE grant). Only the platform super admin can create or change these;
  the ``allocated_by`` field records which super admin issued each one.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class LicensePlan(models.Model):
    """A subscription tier. Reference data — three rows, seeded once."""

    class Tier(models.TextChoices):
        BASIC = "BASIC", "Basic"
        PROFESSIONAL = "PROFESSIONAL", "Professional"
        ENTERPRISE = "ENTERPRISE", "Enterprise"

    tier = models.CharField(max_length=20, choices=Tier.choices, unique=True)
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=255, blank=True)
    # Default number of user seats included; 0 is treated as "unlimited".
    default_seats = models.PositiveIntegerField(default=5)
    price_monthly = models.DecimalField(max_digits=9, decimal_places=2, default=0)
    features = models.JSONField(default=list, blank=True)
    # Sort/rank order so tiers display Basic -> Professional -> Enterprise.
    rank = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["rank"]

    def __str__(self):
        return self.name


class License(models.Model):
    """An allocation of a plan to a tenant. Only a super admin may create it."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        SUSPENDED = "SUSPENDED", "Suspended"
        EXPIRED = "EXPIRED", "Expired"

    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="licenses"
    )
    plan = models.ForeignKey(
        LicensePlan, on_delete=models.PROTECT, related_name="licenses"
    )
    seats = models.PositiveIntegerField(
        default=1, help_text="Number of user seats this license grants."
    )
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.ACTIVE
    )
    starts_on = models.DateField(default=timezone.localdate)
    expires_on = models.DateField(
        null=True, blank=True, help_text="Leave blank for a perpetual license."
    )
    allocated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="allocated_licenses",
        help_text="The super admin who issued this license.",
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tenant.name} · {self.plan.name} ({self.seats} seats)"

    @property
    def is_expired(self):
        return bool(self.expires_on and self.expires_on < timezone.now().date())

    @property
    def effective_status(self):
        """Status that accounts for the expiry date without a background job."""
        if self.status == self.Status.SUSPENDED:
            return self.Status.SUSPENDED
        if self.is_expired:
            return self.Status.EXPIRED
        return self.Status.ACTIVE

    @property
    def is_valid(self):
        return self.effective_status == self.Status.ACTIVE
