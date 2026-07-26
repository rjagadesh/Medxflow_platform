from django.db import models
from tenant_app.models import Patient, PatientProvider
from django.core.exceptions import ValidationError
from tenant_encounter.models import ServiceLocation
import pytz

class PracticeInformation(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    fax = models.CharField(max_length=20)
    logo = models.ImageField(upload_to='practice_logos/', blank=True, null=True)
    practice_preference = models.BooleanField(default=False)
    practice_notification = models.BooleanField(default=False)
    language = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.name
    class Meta:
        db_table = "practice_information"


class InsurancePayer(models.Model):
    """Master list of insurance companies / payers"""
    payer_id = models.CharField(max_length=50, unique=True)           # e.g. "00001" for Medicare
    name = models.CharField(max_length=200)
    payer_type = models.CharField(max_length=30, choices=[
        ('commercial', 'Commercial'),
        ('medicare', 'Medicare'),
        ('medicaid', 'Medicaid'),
        ('other', 'Other'),
    ])
    electronic_submit = models.BooleanField(default=True)
    clearinghouse = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name_plural = "Insurance Payers"
        db_table = "payer_insurance"

    def __str__(self):
        return self.name


class PatientInsurance(models.Model):
    """Patient's insurance coverages - multiple per patient possible"""
    patient = models.ForeignKey('tenant_app.Patient', on_delete=models.CASCADE, related_name="insurances")
    
    payer = models.ForeignKey('practicesettings.InsurancePayer', on_delete=models.PROTECT)
    plan_name = models.CharField(max_length=120, blank=True)
    
    # Priority / coordination of benefits
    priority = models.PositiveSmallIntegerField(default=1, choices=[(1,'Primary'),(2,'Secondary'),(3,'Tertiary')])
    
    # Policy details
    member_id = models.CharField(max_length=60, verbose_name="Member/Policy ID")
    group_number = models.CharField(max_length=60, blank=True)
    policy_holder_name = models.CharField(max_length=150, blank=True)
    relationship_to_insured = models.CharField(max_length=30, choices=[
        ('self', 'Self'),
        ('spouse', 'Spouse'),
        ('child', 'Child'),
        ('other', 'Other'),
    ], default='self')
    
    # Effective dates
    effective_date = models.DateField()
    termination_date = models.DateField(null=True, blank=True)
    
    # Billing specifics
    copay = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coinsurance = models.DecimalField(max_digits=6, decimal_places=2, default=0, null=True)  # %
    deductible = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True)

    class Meta:
        unique_together = [['patient', 'priority']]
        ordering = ['priority']
        db_table = "patient_insurance"


    def __str__(self):
        return f"{self.payer.name} - {self.priority} - {self.member_id}"
    

class InsuranceCompany(models.Model):
    """Master list of insurance companies / payers"""
    payer_id = models.CharField(max_length=50, unique=True)           # e.g. "00001" for Medicare
    name = models.CharField(max_length=200, unique=True)
    coverage_type = models.JSONField(blank=True, null=True)
    stedi_id = models.CharField(max_length=50, unique=True)
    electronic_submit = models.BooleanField(default=True)
    clearinghouse = models.CharField(max_length=100, blank=True, default="STEDI")
    stedi_response = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Insurance Companies"
        db_table = "company_insurance"

    def __str__(self):
        return self.name

class InsurancePlan(models.Model):
    # Relation
    insurance_company = models.ForeignKey(
        'practicesettings.InsuranceCompany',
        on_delete=models.CASCADE,
        related_name="plans"
    )

    # Plan info
    plan_name = models.CharField(max_length=255)

    # Address
    address_street1 = models.CharField(max_length=255)
    address_city = models.CharField(max_length=100)
    address_state = models.CharField(max_length=50)
    address_zip = models.CharField(max_length=20)

    # Contact name
    contact_prefix = models.CharField(max_length=20, blank=True)
    contact_first_name = models.CharField(max_length=100, blank=True)
    contact_middle_name = models.CharField(max_length=100, blank=True)
    contact_last_name = models.CharField(max_length=100, blank=True)
    contact_suffix = models.CharField(max_length=20, blank=True)

    # Contact details
    contact_phone = models.CharField(max_length=30, blank=True)
    contact_phone_ext = models.CharField(max_length=10, blank=True)
    contact_fax = models.CharField(max_length=30, blank=True)
    contact_fax_ext = models.CharField(max_length=10, blank=True)

    # Notes
    notes = models.TextField(blank=True)

    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)

    # Meta
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Insurance Plans"
        db_table = "plan_insurance"
        constraints = [
            models.UniqueConstraint(
                fields=["insurance_company", "plan_name"],
                name="unique_plan_per_insurance_company"
            )
        ]


    def __str__(self):
        return f"{self.plan_name} ({self.insurance_company.name})"

from django.db import models


class InsurancePolicy(models.Model):
    # Insurance company

    insurance_plan = models.ForeignKey('practicesettings.InsurancePlan', on_delete=models.PROTECT)
    insurance_company_id = models.ForeignKey('practicesettings.InsuranceCompany', on_delete=models.PROTECT)
    patient = models.ForeignKey('tenant_app.Patient', on_delete=models.PROTECT)
    # Claims address
    claims_street1 = models.CharField(max_length=255, blank=True)
    claims_street2 = models.CharField(max_length=255, blank=True)
    claims_city = models.CharField(max_length=100, blank=True)
    claims_state = models.CharField(max_length=50, blank=True)
    claims_zip = models.CharField(max_length=20, blank=True)
    claims_country = models.CharField(max_length=50, blank=True)

    # Contact details
    phone = models.CharField(max_length=30, blank=True)
    phone_ext = models.CharField(max_length=10, blank=True)
    fax = models.CharField(max_length=30, blank=True)
    fax_ext = models.CharField(max_length=10, blank=True)

    # Policy details
    insurance_type = models.CharField(max_length=100, blank=True)
    policy_number = models.CharField(max_length=100, blank=True)
    group_number = models.CharField(max_length=100, blank=True)
    group_name = models.CharField(max_length=255, blank=True)

    copay = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    deductible = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    effective_start = models.DateField(null=True, blank=True)
    effective_end = models.DateField(null=True, blank=True)

    release_of_info = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    policy_through_employer = models.BooleanField(default=False)
    employer_name = models.CharField(max_length=255, blank=True)

    relationship = models.CharField(max_length=50, blank=True)

    # Insured name
    insured_prefix = models.CharField(max_length=20, blank=True)
    insured_first_name = models.CharField(max_length=100, blank=True)
    insured_middle_name = models.CharField(max_length=100, blank=True)
    insured_last_name = models.CharField(max_length=100, blank=True)
    insured_suffix = models.CharField(max_length=20, blank=True)

    # Insured address
    insured_street1 = models.CharField(max_length=255, blank=True)
    insured_street2 = models.CharField(max_length=255, blank=True)
    insured_city = models.CharField(max_length=100, blank=True)
    insured_state = models.CharField(max_length=50, blank=True)
    insured_zip = models.CharField(max_length=20, blank=True)
    insured_country = models.CharField(max_length=50, blank=True)

    # Insured personal info
    insured_id = models.CharField(max_length=100, blank=True)
    ssn = models.CharField(max_length=20, blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)

    active = models.BooleanField(default=True)
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.insurance_company} - {self.policy_number}"


class PracticeSchedulingSettings(models.Model):
    TIMEZONE_CHOICES = [(tz, tz) for tz in pytz.all_timezones]

    CALENDAR_INCREMENT_CHOICES = (
        (5, "5 minutes"),
        (10, "10 minutes"),
        (15, "15 minutes"),
        (30, "30 minutes"),
        (60, "60 minutes"),
    )

    patient_provider = models.ForeignKey(
        'tenant_app.PatientProvider',
        on_delete=models.CASCADE,
        related_name="scheduling_settings",
        null=True, blank=True
    )

    timezone = models.CharField(
        max_length=64,
        choices=TIMEZONE_CHOICES,
        default="UTC"
    )

    calendar_increment = models.PositiveIntegerField(
        choices=CALENDAR_INCREMENT_CHOICES,
        default=15,
        help_text="Time slot duration in minutes"
    )

    group_appointments = models.BooleanField(
        default=False,
        help_text="Allow booking multiple patients in one slot"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("patient_provider",)
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Scheduling Settings - {self.patient_provider}"


class StaffSchedule(models.Model):
    staff_name = models.CharField(
        max_length=100,
        help_text="Staff name is required"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.staff_name
    
class StaffDailySchedule(models.Model):
    DAY_CHOICES = (
        ("monday", "Monday"),
        ("tuesday", "Tuesday"),
        ("wednesday", "Wednesday"),
        ("thursday", "Thursday"),
        ("friday", "Friday"),
        ("saturday", "Saturday"),
        ("sunday", "Sunday"),
    )

    staff_schedule = models.ForeignKey(
        'practicesettings.StaffSchedule',
        on_delete=models.CASCADE,
        related_name="daily_schedules"
    )

    day = models.CharField(
        max_length=10,
        choices=DAY_CHOICES
    )

    # 🔹 Working hours
    work_start_time = models.TimeField(null=True, blank=True)
    work_end_time = models.TimeField(null=True, blank=True)

    # 🔹 Break / Lunch
    break_start_time = models.TimeField(null=True, blank=True)
    break_end_time = models.TimeField(null=True, blank=True)

    break_duration_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Break duration in hours (e.g., 1.5)"
    )

    break_description = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Lunch / Tea / Personal break"
    )

    is_working_day = models.BooleanField(
        default=True,
        help_text="Mark false for holidays / off days"
    )

    class Meta:
        unique_together = ("staff_schedule", "day")
        ordering = ["staff_schedule", "day"]

    def __str__(self):
        return f"{self.staff_schedule.staff_name} - {self.day}"


class StaffTimeOff(models.Model):
    staff = models.ForeignKey(
        'practicesettings.StaffSchedule',
        on_delete=models.CASCADE,
        related_name="time_offs"
    )

    reason = models.CharField(
        max_length=255,
        help_text="Reason for time off"
    )

    start_datetime = models.DateTimeField(
        help_text="Time off start date & time"
    )

    end_datetime = models.DateTimeField(
        help_text="Time off end date & time"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.start_datetime >= self.end_datetime:
            raise ValidationError(
                "End date/time must be greater than start date/time."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.staff.staff_name} | {self.start_datetime} → {self.end_datetime}"
    

class Room(models.Model):
    name = models.CharField(
        max_length=100,
        help_text="Room name (required)"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
class Equipment(models.Model):
    name = models.CharField(
        max_length=100,
        help_text="Equipment name (required)"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class PracticeHoliday(models.Model):
    name = models.CharField(
        max_length=150,
        help_text="Holiday name (required)"
    )

    date = models.DateField(
        help_text="Holiday date"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date"]
        unique_together = ("name", "date")

    def __str__(self):
        return f"{self.name} - {self.date}"
    
class ProviderScheduleBlock(models.Model):
    provider = models.ForeignKey(
        'tenant_app.PatientProvider',
        on_delete=models.CASCADE,
        related_name="schedule_blocks"
    )

    name = models.CharField(
        max_length=150,
        help_text="Block / Schedule name"
    )

    color = models.CharField(
        max_length=20,
        help_text="Color code (e.g. #FF5733 or blue)"
    )

    start_date = models.DateField(
        help_text="Start date"
    )

    from_time = models.TimeField(
        help_text="Start time"
    )

    to_time = models.TimeField(
        help_text="End time"
    )

    custom_text = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    service_location = models.ForeignKey(
        'tenant_encounter.ServiceLocation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    block_appointments = models.BooleanField(
        default=False,
        help_text="Block appointments during this time"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.from_time >= self.to_time:
            raise ValidationError(
                "To time must be greater than from time."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.provider} | {self.name}"
    
class ServiceCode(models.Model):
    name = models.CharField(
        max_length=150,
        help_text="Service code name"
    )

    procedures = models.CharField(
        max_length=255,
        help_text="Procedure codes or names"
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Active / Inactive status"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("name", "procedures")

    def __str__(self):
        return self.name


class VisitReason(models.Model):
    name = models.CharField(
        max_length=150,
        help_text="Visit reason name"
    )

    duration = models.PositiveIntegerField(
        help_text="Duration in minutes"
    )

    color = models.CharField(
        max_length=20,
        help_text="Calendar color (e.g. #4CAF50)"
    )

    service = models.ForeignKey(
        'practicesettings.ServiceCode',
        on_delete=models.CASCADE,
        related_name="visit_reasons",
        help_text="Linked service code"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("name", "service")

    def __str__(self):
        return self.name



class FeeScheduleEntry(models.Model):
 
    # === Core Fields ===
    note = models.TextField(blank=True, null=True)
 
    procedure_code = models.CharField(
        max_length=20,
        help_text="CPT / HCPCS code (e.g., 99213, G0283)"
    )
 
    modifier = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )
 
    # === Pricing Fields ===
    par_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Participating provider amount",
        null=True,
        blank=True
    )
 
    non_par_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Non-participating provider amount",
        null=True,
        blank=True
    )
 
    limiting_charge_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Maximum limiting charge amount",
        null=True,
        blank=True
    )
 
    currency = models.CharField(
        max_length=10,
        default="USD"
    )
 
    # === Status & Metadata ===
    is_active = models.BooleanField(default=True)
 
    # === Timestamps ===
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
 
    class Meta:
        ordering = ["procedure_code"]
        indexes = [
            models.Index(fields=["procedure_code"]),
            models.Index(fields=["modifier"]),
            models.Index(fields=["is_active"]),
        ]
        verbose_name = "Fee Schedule Entry"
        verbose_name_plural = "Fee Schedule Entries"
 
    def __str__(self):
        return f"{self.procedure_code} | Par: {self.par_amount}"
 
    def clean(self):
        # Basic validation
        if self.par_amount < 0:
            raise ValidationError("Par amount cannot be negative.")
 
        if self.non_par_amount < 0:
            raise ValidationError("Non-par amount cannot be negative.")
 
        if self.limiting_charge_amount < 0:
            raise ValidationError("Limiting charge amount cannot be negative.")
 
        if self.non_par_amount > self.limiting_charge_amount:
            raise ValidationError(
                "Non-par amount cannot exceed the limiting charge amount."
            )
 
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
