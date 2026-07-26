from django.db import models
import uuid
from django.core.exceptions import ValidationError
from tenant_app.models import *
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _
from django.db import transaction
from django.db.models import Max

phone_regex = RegexValidator(
    regex=r'^\+?1?\d{9,15}$',
    message=_("Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
)
def generate_encounter_number():
    # Inside transaction.atomic() this will lock the table/rows depending on DB
    last = (
        Encounter.objects
        .all()
        .aggregate(max_num=Max("encounter_number"))
        ["max_num"]
    )

    if not last:
        return "ENC-001"

    try:
        last_int = int(last.split("-")[1])
        return f"ENC-{last_int + 1:03d}"
    except (IndexError, ValueError):
        # Fallback if the format is unexpected
        return f"ENC-{uuid.uuid4().hex[:8]}"


class ServiceLocation(models.Model):
    """
    Practice/Service Locations (e.g., main office, satellite clinic)
    Used in Appointments, Encounters, Claims (Place of Service Code)
    """
    name = models.CharField(max_length=150, help_text="e.g. Main Office, Downtown Clinic")
    
    # Address
    address1 = models.CharField(max_length=255)
    address2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)  # US state code e.g. "CA", "NY"
    zip_code = models.CharField(max_length=10)  # 12345 or 12345-6789
    country = models.CharField(max_length=100, default="United States")
    
    # Contact
    phone = models.CharField(max_length=20, validators=[phone_regex], blank=True)
    fax = models.CharField(max_length=20, validators=[phone_regex], blank=True, null=True)
    
    # Billing / HIPAA related
    place_of_service_code = models.CharField(
        max_length=2,
        blank=True,
        help_text="CMS Place of Service code (e.g. 11=Office, 02=Telehealth)"
    )
    
    # Timezone (important for scheduling/reminders)
    timezone = models.CharField(
        max_length=50,
        default="America/New_York",
        help_text="IANA timezone name"
    )
    
    # Google integration
    google_place_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Google Places API Place ID"
    )
    
    # Visibility & Reminder settings
    allow_appointment_reminders = models.BooleanField(
        default=True,
        verbose_name="Allow appointment reminders for this location"
    )
    include_address_in_reminders = models.BooleanField(
        default=True,
        verbose_name="Include address in appointment reminder notifications"
    )
    display_on_scheduling_page = models.BooleanField(
        default=True,
        verbose_name="Display location on practice scheduling page"
    )
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Optional: link to practice/tenant if multi-tenant
    practice = models.ForeignKey('practicesettings.PracticeInformation', on_delete=models.CASCADE, null=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Service Location"
        db_table = "service_location"
        verbose_name_plural = "Service Locations"

    def __str__(self):
        return f"{self.name} ({self.city}, {self.state})"

    @property
    def full_address(self):
        parts = [self.address1]
        if self.address2:
            parts.append(self.address2)
        parts.extend([f"{self.city}, {self.state} {self.zip_code}", self.country])
        return ", ".join(filter(None, parts))

class Encounter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    encounter_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        db_index=True
    )
    patient = models.ForeignKey("tenant_app.Patient", on_delete=models.PROTECT)
    appointment = models.ForeignKey(
        "tenant_app.Appointment", on_delete=models.SET_NULL, null=True, blank=True
    )
    
    # Providers
    rendering_provider = models.ForeignKey(
        "tenant_app.PatientProvider", on_delete=models.PROTECT, related_name='rendered_encounters', null=True, blank=True,
    )
    supervising_provider = models.ForeignKey(
        "tenant_app.PatientProvider", on_delete=models.SET_NULL, null=True, blank=True,
        related_name='supervised_encounters'
    )
    referring_provider = models.ForeignKey(
        "tenant_app.PatientProvider", on_delete=models.SET_NULL, null=True, blank=True,
        related_name='referred_encounters'
    )
    location = models.ForeignKey(
        ServiceLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="encounters"
    )
    # Location & Service
    location = models.CharField(max_length=120, blank=True)  # or ForeignKey if you have locations
    place_of_service_code = models.CharField(max_length=2, blank=True)  # 11=Office, 02=Telehealth, etc.
    
    encounter_from_date = models.DateField(null=True, blank=True)   # UI: From Date
    encounter_through_date = models.DateField(null=True, blank=True)  # UI: Through Date
    post_date = models.DateField(null=True, blank=True)             # UI: Post Date
    batch_number = models.CharField(max_length=50, blank=True)      # UI: Batch #

    encounter_mode = models.CharField(
        max_length=30,
        blank=True,
        help_text="Office, Telehealth, Ambulance, Home, etc."
    )

    payment_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Payment amount collected at encounter level"
    )

    # Dates & Times
    service_date_from = models.DateField(null=True, blank=True)
    service_date_to = models.DateField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    # Clinical
    chief_complaint = models.TextField(blank=True)
    reason_for_visit = models.TextField(blank=True)
    clinical_notes = models.TextField(blank=True)
    
    # Financial / Claim related
    primary_insurance = models.ForeignKey(
        "practicesettings.PatientInsurance", on_delete=models.SET_NULL, null=True, blank=True,
        related_name='primary_encounters'
    )
    prior_authorization = models.CharField(max_length=60, blank=True)
    do_not_bill = models.BooleanField(default=False)
    do_not_send_electronically = models.BooleanField(default=False)
    is_appt = models.BooleanField(default=False, blank=True, null=True)
    
    # Status tracking
    status = models.CharField(max_length=30, default='draft', choices=[
        ('draft', 'Draft'),
        ('ready', 'Ready to Submit'),
        ('submitted', 'Submitted'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
        ('not_started', 'Not Started'),
    ])
    
    # Totals (can be calculated or stored)
    total_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)\
    
    #Hospitalization Date
    hospitalized_from = models.DateField(null=True, blank=True)
    hospitalized_to = models.DateField(null=True, blank=True)

    #CMS-1500 Misc
    submit_reason = models.CharField(max_length=10, blank=True)
    payer_doc_control = models.CharField(max_length=50, blank=True)

    claim_code_10d = models.CharField(max_length=50, blank=True)
    additional_claim_info = models.TextField(blank=True)

    eclaim_note_type = models.CharField(max_length=50, blank=True)
    eclaim_note = models.TextField(blank=True)


    created_at = models.DateTimeField(
        default=timezone.now,      # ← important: callable, not timezone.now()
        editable=False,
    )
    updated_at = models.DateTimeField(
        auto_now=True,             # auto-updates on every save
        editable=False,
    )
    def save(self, *args, **kwargs):
        if not self.encounter_number:
            # Check again inside the transaction to prevent race conditions
            with transaction.atomic():
                # Attempt to get a unique encounter number
                # We try up to 3 times in case of extreme concurrency
                for attempt in range(3):
                    self.encounter_number = generate_encounter_number()
                    try:
                        # Create a savepoint to allow recovery from IntegrityError
                        with transaction.atomic():
                            return super().save(*args, **kwargs)
                    except Exception as e:
                        if attempt == 2: # Last attempt
                            # Fallback to a guaranteed unique value if sequential fails
                            self.encounter_number = f"ENC-ERR-{uuid.uuid4().hex[:8]}"
                            return super().save(*args, **kwargs)
                        continue
        else:
            super().save(*args, **kwargs)

    class Meta:
        db_table = "patient_encounter"
        ordering = ['-started_at']

    def __str__(self):
        return f"Encounter {self.id} - {self.patient} - {self.service_date_from}"


# ───────────────────────────────────────────────────────────────
#                   Diagnoses (ICD-10)
# ───────────────────────────────────────────────────────────────

class EncounterDiagnosis(models.Model):
    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE, related_name="diagnoses")
    icd_code = models.CharField(max_length=10)          # F32.9, E11.65, etc.
    description = models.CharField(max_length=300, blank=True)
    order = models.PositiveSmallIntegerField(default=1)  # 1-12 usually

    class Meta:
        unique_together = [['encounter', 'order']]
        ordering = ['order']
        db_table = "encounter_diagnosis"

    def __str__(self):
        return f"{self.icd_code} ({self.order})"


# ───────────────────────────────────────────────────────────────
#               Procedures / Service Lines
# ───────────────────────────────────────────────────────────────

class EncounterServiceLine(models.Model):
    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE, related_name="service_lines")
    
    date_from = models.DateField()
    date_to = models.DateField(null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)  
    end_time = models.TimeField(null=True, blank=True)     

    procedure_code = models.CharField(max_length=10)  # CPT / HCPCS
    description = models.CharField(max_length=300, blank=True)
    
    modifiers = models.CharField(max_length=255, blank=True)  # "25,59" or separate fields better
    units = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_charge = models.DecimalField(max_digits=10, decimal_places=2)
    total_charge = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    
    # Diagnosis pointers (A=1, B=2, C=3, D=4 usually)
    diag_pointers = models.CharField(max_length=255, blank=True)  # "A,B" or JSONField
    
    # Additional fields
    ndc_code = models.CharField(max_length=30, blank=True)             # drugs
    minutes = models.PositiveIntegerField(null=True, blank=True)       # timed services

    is_concurrent = models.BooleanField(default=False)   # Concurrent Procedure
    tos_code = models.CharField(max_length=5, blank=True)  # TOS
    ndc_code = models.CharField(max_length=30, blank=True)  # already present
    reference_code = models.CharField(max_length=30, blank=True)  # Ref. Code

    is_voided = models.BooleanField(default=False, null=True, blank=True)  # Voided Line

    rendering_provider = models.ForeignKey(
        "tenant_app.PatientProvider",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_line_provider"
    )
    
    line_note = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        self.total_charge = self.unit_charge * self.units
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['date_from', 'id']
        db_table = "encounter_serviceline"

    def __str__(self):
        return f"{self.procedure_code} × {self.units} = ${self.total_charge}"


# ───────────────────────────────────────────────────────────────
#                   Ambulance Extension
# ───────────────────────────────────────────────────────────────

class AmbulanceDetail(models.Model):
    encounter = models.OneToOneField(Encounter, on_delete=models.CASCADE, related_name="ambulance_detail")
    
    emergency = models.BooleanField(default=False)
    patient_weight_lbs = models.PositiveIntegerField(null=True, blank=True)
    transport_miles = models.DecimalField(max_digits=8, decimal_places=1, null=True, blank=True)
    
    pickup_address = models.TextField(blank=True)
    dropoff_address = models.TextField(blank=True)
    
    transport_code = models.CharField(max_length=10, blank=True)       # A0425, A0429...
    reason_code = models.CharField(max_length=10, blank=True)
    
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    
    round_trip_description = models.TextField(blank=True)
    stretcher_purpose = models.TextField(blank=True)
    certification_reasons = models.TextField(blank=True)  # or ManyToManyField if you want to normalize

    class Meta:
        verbose_name_plural = "Ambulance Details"
        db_table = "ambulance_details"
