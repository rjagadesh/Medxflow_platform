from django.db import models
from django.conf import settings
from tenant_app.models import Patient, Appointment, PatientProvider
# Create your models here.
class Allergy(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("error", "Marked as Error"),
    ]
 
    SEVERITY_CHOICES = [
        ("mild", "Mild"),
        ("moderate", "Moderate"),
        ("severe", "Severe"),
        ("mild_moderate", "Mild to moderate"),
    ]
 
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="allergies"
    )
 
    allergen = models.CharField(max_length=255)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    reactions = models.TextField()
    date_of_onset = models.DateField(null=True, blank=True)
    comments = models.TextField(blank=True)
 
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="active"
    )
 
    # 🔑 Reconciliation fields (IMPORTANT)
    reconciled = models.BooleanField(default=False)
    reconciled_at = models.DateTimeField(null=True, blank=True)
    reconciled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reconciled_allergies"
    )
 
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="updated_allergies"
    )
 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
 
    class Meta:
        ordering = ["-updated_at"]
 
    def __str__(self):
        return self.allergen

 
class PatientAllergyProfile(models.Model):
    patient = models.OneToOneField(
        Patient,
        on_delete=models.CASCADE,
        related_name="allergy_profile"
    )
 
    no_known_allergies = models.BooleanField(default=False)
    no_known_medication_allergies = models.BooleanField(default=False)
 
    updated_at = models.DateTimeField(auto_now=True)
 
    def __str__(self):
        return f"Allergy Profile - {self.patient}"
    

class PatientProblem(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("resolved", "Resolved"),
    ]
 
    TYPE_CHOICES = [
        ("acute", "Acute"),
        ("chronic", "Chronic"),
    ]
 
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="problems"
    )
    icd_name = models.CharField(max_length=1000)
    snomed_name = models.CharField(max_length=1000)
   
    icd10_code = models.CharField(max_length=500)
    snomed_code = models.CharField(max_length=500)
 
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="active"
    )
    problem_type = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
        blank=True
    )
 
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
 
    comments = models.TextField(blank=True)
 
    reconciliation_performed = models.BooleanField(default=False)
    reconciled_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reconciled_problems"
    )
    reconciled_at = models.DateTimeField(null=True, blank=True)
 
    # Audit
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_problems"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
 
    def __str__(self):
        return f"{self.patient} - {self.icd10.code}"
    
    
class Medications(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("discontinued", "Discontinued"),
        ("not_administered", "Not Administered"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="prescriptions"
    )

    drug_name = models.CharField(max_length=1000)
    reason_for_rx_icd10_code = models.CharField(max_length=500, blank=True, null=True)
    reason_for_rx_icd10_name = models.CharField(max_length=1000, blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )

    patient_instructions = models.TextField(
        help_text="Free-text or built instructions",
        blank=True,
        null=True
    )

    quantity = models.PositiveIntegerField(blank=True, null=True)

    refills = models.PositiveIntegerField(default=0, blank=True, null=True)

    allow_substitution = models.BooleanField(default=True, blank=True, null=True)

    days_supply = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    prescriber = models.ForeignKey(
        'tenant_app.PatientProvider',
        on_delete=models.PROTECT,
        related_name="prescriptions_written",
        blank=True,
        null=True
    )

    started_on = models.DateField(blank=True, null=True)

    administered_during_visit = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.medication} for {self.patient}"

class PatientVitals(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="vitals"
    )

    recorded_at = models.DateTimeField()

    # Blood Pressure
    systolic_bp = models.PositiveIntegerField(null=True, blank=True)
    diastolic_bp = models.PositiveIntegerField(null=True, blank=True)

    # Height / Length (inches)
    height_in = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    # Head circumference (inches)
    head_circumference_in = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    # Weight
    weight_lbs = models.PositiveIntegerField(null=True, blank=True)
    weight_oz = models.PositiveIntegerField(null=True, blank=True)

    # Temperature (F)
    temperature_f = models.DecimalField(
        max_digits=4, decimal_places=1, null=True, blank=True
    )

    # Heart rate
    heart_rate = models.PositiveIntegerField(null=True, blank=True)

    # Respiratory rate
    respiratory_rate = models.PositiveIntegerField(null=True, blank=True)

    # Oxygen
    spo2 = models.PositiveIntegerField(null=True, blank=True)
    inhaled_o2 = models.PositiveIntegerField(null=True, blank=True)

    # Calculated BMI
    bmi = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    comments = models.TextField(blank=True)

    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name="vitals_entered"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_locked = models.BooleanField(default=False)  # locked when encounter signed

    def __str__(self):
        return f"Vitals for {self.patient} @ {self.recorded_at}"


class ClinicalNote(models.Model):

    notes_type = models.CharField(
        max_length=20,
        default="SOAP"
    )

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="encounter_notes"
    )

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name="encounter_note"
    )

    assigned_to = models.ForeignKey(
        PatientProvider,
        on_delete=models.PROTECT,
        related_name="assigned_notes"
    )

    active_sections = models.JSONField(
        default=list,
        help_text="List of enabled sections"
    )

    sections_notes = models.JSONField(default=dict)

    # Draft / Save
    saved_at = models.DateTimeField(null=True, blank=True)
    saved_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="notes_saved"
    )

    # Sign-off
    sign_off_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="notes_signed"
    )
    sign_off_at = models.DateTimeField(null=True, blank=True)

    is_signed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Encounter Note - {self.patient} ({self.notes_type})"


# ───────────────────────────────────────────────────────────────
#               Labs / Studies Orders
# ───────────────────────────────────────────────────────────────
class LabOrder(models.Model):
    TYPE_CHOICES = [
        ("Labs", "Labs"),
        ("Studies", "Studies"),
        ("Imaging", "Imaging"),
    ]
    STAT_CHOICES = [
        ("Yes", "Yes"),
        ("No", "No"),
    ]
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("ordered", "Ordered"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="lab_orders",
    )
    order_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="Labs")
    is_elab = models.BooleanField(default=False)

    ordering_provider = models.ForeignKey(
        PatientProvider,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lab_orders_ordered",
    )
    processing_provider = models.ForeignKey(
        PatientProvider,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lab_orders_processed",
    )

    notes = models.TextField(blank=True)
    stat = models.CharField(max_length=3, choices=STAT_CHOICES, default="No")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="ordered")

    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_lab_orders",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order_type} order for {self.patient} ({self.status})"


class LabOrderDiagnosis(models.Model):
    order = models.ForeignKey(
        LabOrder, on_delete=models.CASCADE, related_name="diagnoses"
    )
    icd_code = models.CharField(max_length=20)
    description = models.CharField(max_length=500, blank=True)

    def __str__(self):
        return f"{self.icd_code}"


class LabOrderItem(models.Model):
    order = models.ForeignKey(
        LabOrder, on_delete=models.CASCADE, related_name="items"
    )
    code = models.CharField(max_length=50, blank=True)
    name = models.CharField(max_length=500)

    def __str__(self):
        return self.name


# ───────────────────────────────────────────────────────────────
#               Past Medical / Surgical History
# ───────────────────────────────────────────────────────────────
class PatientHistory(models.Model):
    TYPE_CHOICES = [
        ("medical", "Past Medical History"),
        ("surgical", "Past Surgical History"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("resolved", "Resolved"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="history_entries",
    )
    history_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    name = models.CharField(max_length=500)          # condition or procedure name
    note = models.TextField(blank=True)
    onset_date = models.DateField(null=True, blank=True)   # diagnosis / surgery date
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")

    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_history_entries",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Patient histories"

    def __str__(self):
        return f"{self.get_history_type_display()}: {self.name} ({self.patient})"
