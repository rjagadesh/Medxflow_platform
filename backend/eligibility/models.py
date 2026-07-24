"""
Eligibility Verification — modelled on the Availity insurance-verification portal.

An ``EligibilityCheck`` records one coverage lookup: the member/provider/payer
input, the (simulated) 270/271 coverage result normalised into an Excel-style
benefit table (in-network vs out-of-network copay / coinsurance / deductible /
OOP, plus auth & referral requirements per service type), and the AI-generated
Verification-of-Benefits summary + action items (Claude).
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class EligibilityCheck(models.Model):
    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="eligibility_checks"
    )

    # -- Input --------------------------------------------------------------
    payer = models.CharField(max_length=120, blank=True)
    payer_id = models.CharField(max_length=40, blank=True)
    member_id = models.CharField(max_length=60, blank=True)
    first_name = models.CharField(max_length=80, blank=True)
    last_name = models.CharField(max_length=80, blank=True)
    dob = models.CharField(max_length=20, blank=True)
    npi = models.CharField(max_length=20, blank=True)
    cpt = models.CharField(max_length=40, blank=True)
    service_types = models.JSONField(default=list, blank=True)  # ["30","98",...]

    # -- Coverage result (simulated 270/271) --------------------------------
    coverage_status = models.CharField(max_length=20, blank=True)   # Active / Inactive
    plan_type = models.CharField(max_length=20, blank=True)         # PPO / HMO / ...
    plan_name = models.CharField(max_length=140, blank=True)
    group_number = models.CharField(max_length=60, blank=True)
    subscriber = models.CharField(max_length=20, blank=True)        # Self / Spouse / Dependent
    effective_date = models.CharField(max_length=20, blank=True)
    termination_date = models.CharField(max_length=20, blank=True)
    benefits = models.JSONField(default=list, blank=True)   # per service-type rows (in/oon)
    normalized = models.JSONField(default=dict, blank=True)  # top-level copay/deductible/oop/...

    # -- AI Verification of Benefits ---------------------------------------
    vob_summary = models.TextField(blank=True)
    action_items = models.JSONField(default=list, blank=True)
    ai_model = models.CharField(max_length=60, blank=True)

    status = models.CharField(max_length=14, default="completed")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="eligibility_checks",
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Eligibility {self.member_id or self.last_name} · {self.payer} · {self.coverage_status}"
