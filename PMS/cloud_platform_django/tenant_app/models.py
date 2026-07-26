from django.db import models
import uuid
from django.core.exceptions import ValidationError
from tenant_encounter.models import ServiceLocation
from django.db.models import Q

def validate_insurance_name(value):
    if value and isinstance(value, dict) and 'primaryPayerId' not in value:
        raise ValidationError("The key 'primaryPayerId' is required.")

class PatientProvider(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateTimeField()

    NPI = models.CharField(max_length=100)
    practice_name = models.CharField(max_length=100)

    # Tenant-specific provider details
    organization_name = models.CharField(max_length=100, blank=True, null=True)
    provider_type = models.CharField(max_length=100, blank=True, null=True)
    specialty = models.CharField(max_length=100, blank=True, null=True)
    sub_specialty = models.CharField(max_length=100, blank=True, null=True)
    medicare_ptan = models.CharField(max_length=100, blank=True, null=True)
    medicaid_id = models.CharField(max_length=100, blank=True, null=True)
    taxid_ein = models.CharField(max_length=100, blank=True, null=True)
    taxid_ssn = models.CharField(max_length=100, blank=True, null=True)
    telehealth = models.CharField(max_length=50, blank=True, null=True)
    taxonomy = models.CharField(max_length=50, blank=True, null=True)


    address = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    zipcode = models.CharField(max_length=20)

    email = models.EmailField(max_length=255)
    password = models.CharField(max_length=255, blank=True, null=True)

    about = models.TextField(blank=True, null=True)
    week = models.JSONField(blank=True, null=True)
    qualification = models.TextField(blank=True, null=True)
    service = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    medical_license_number = models.CharField(max_length=255, blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "patient_provider"
        constraints = [
            models.UniqueConstraint(
                fields=['taxid_ein'],
                condition=Q(taxid_ein__isnull=False),
                name='unique_taxid_ein'
            ),
            models.UniqueConstraint(
                fields=['taxid_ssn'],
                condition=Q(taxid_ssn__isnull=False),
                name='unique_taxid_ssn'
            ),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Patient(models.Model):
    # --- Basic Information (Required) ---
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    GENDER_CHOICES = [
        ('Unknown', 'Unknown'),
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    # Pronouns Choices
    PRONOUN_CHOICES = [
        ('He/Him', 'He/Him'),
        ('She/Her', 'She/Her'),
        ('They/Them', 'They/Them'),
    ]

    # Marital Status Choices
    MARITAL_STATUS_CHOICES = [
        ('Single', 'Single'),
        ('Married', 'Married'),
        ('Divorced', 'Divorced'),
        ('Widowed', 'Widowed'),
    ]

    # Employment Status Choices
    EMPLOYMENT_STATUS_CHOICES = [
        ('Employed', 'Employed'),
        ('Unemployed', 'Unemployed'),
        ('Retired', 'Retired'),
        ('Student', 'Student'),
    ]

    # Referral Source Choices
    REFERRAL_SOURCE_CHOICES = [
        ('Not Specified', 'Not Specified'),
        ('Provider', 'Provider'),
        ('Friend', 'Friend'),
        ('Advertisement', 'Advertisement'),
    ]

    # Service Location Choices
    SERVICE_LOCATION_CHOICES = [
        ('Not Specified', 'Not Specified'),
        ('Main Office', 'Main Office'),
        ('Satellite Clinic', 'Satellite Clinic'),
    ]

    # Payer Scenario Choices
    PAYER_SCENARIO_CHOICES = [
        ("ATTORNEY_LIEN", "Attorney Lien"),
        ("AUTO", "Auto Insurance"),
        ("BCBS", "BC/BS"),
        ("BCBS_HMO", "BC/BS HMO"),
        ("COMMERCIAL", "Commercial"),
        ("HMO", "HMO"),
        ("MEDICAID", "Medicaid"),
        ("MEDICAID_HMO", "Medicaid HMO"),
        ("MEDICARE", "Medicare"),
        ("PPO", "PPO"),
        ("SELF_PAY", "Self Pay"),
        ("TRICARE", "Tricare"),
        ("VA", "VA"),
        ("WORKERS_COMP", "Workers Comp"),
        ("WC_APPLICANT", "Workers Comp - Applicant"),
        ("WC_DEFENSE", "Workers Comp - Defense"),
    ]

    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    mrn = models.CharField(max_length=50, blank=True, null=True, verbose_name="Medical Record Number")
    
    dob = models.DateField(blank=True, null=True, verbose_name="Date of Birth")
    ssn = models.CharField(max_length=11, blank=True, null=True, verbose_name="Social Security Number")
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='Unknown')
    pronouns = models.CharField(max_length=20, choices=PRONOUN_CHOICES, blank=True, null=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True, null=True)

    # Referral
    referral_source = models.CharField(max_length=50, choices=REFERRAL_SOURCE_CHOICES, default='Not Specified')

    # Providers
    pcp = models.ForeignKey(
        'tenant_app.PatientProvider',
        on_delete=models.CASCADE,
        related_name="primary_Care_physician",
        blank=True, null=True
    )
    referring_physician = models.ForeignKey(
        'tenant_app.PatientProvider',
        on_delete=models.CASCADE,
        related_name="referring_physician",
        blank=True, null=True
    )
    default_rendering_provider = models.ForeignKey(
        'tenant_app.PatientProvider',
        on_delete=models.CASCADE,
        related_name="default_rendering_provider",
        blank=True, null=True
    )
    default_service_location = models.CharField(max_length=50, choices=SERVICE_LOCATION_CHOICES, default='Not Specified')

    # Employment
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS_CHOICES, blank=True, null=True)
    employer = models.CharField(max_length=200, blank=True, null=True)

    # Contact
    address = models.TextField(blank=True, null=True)
    
    home_phone = models.CharField(max_length=20, blank=True, null=True)
    home_phone_ext = models.CharField(max_length=10, blank=True, null=True)
    work_phone = models.CharField(max_length=20, blank=True, null=True)
    work_phone_ext = models.CharField(max_length=10, blank=True, null=True)
    mobile_phone = models.CharField(max_length=20, blank=True, null=True)
    mobile_phone_ext = models.CharField(max_length=10, blank=True, null=True)

    enable_auto_reminders = models.BooleanField(default=False)
    send_email_notifications = models.BooleanField(default=True)

    # Emergency Contact
    emergency_name = models.CharField(max_length=200, blank=True, null=True)
    emergency_phone = models.CharField(max_length=20, blank=True, null=True)
    emergency_phone_ext = models.CharField(max_length=10, blank=True, null=True)

    # Responsible Party
    responsible_party_different = models.BooleanField(default=False)
    
    responsible_party_first_name = models.CharField(max_length=100, blank=True, null=True)
    responsible_party_last_name = models.CharField(max_length=100, blank=True, null=True)
    
    RESPONSIBLE_PARTY_RELATION_CHOICES = [
        ('Parent', 'Parent'),
        ('Spouse', 'Spouse'),
        ('Guardian', 'Guardian'),
        ('Other', 'Other'),
        ('Child', 'Child'),
        ('Sibling', 'Sibling'),
    ]
    responsible_party_relation = models.CharField(max_length=50, choices=RESPONSIBLE_PARTY_RELATION_CHOICES, blank=True, null=True)
    responsible_party_address = models.TextField(blank=True, null=True)

    # Insurance
    default_payer_scenario = models.CharField(max_length=50, choices=PAYER_SCENARIO_CHOICES, blank=True, null=True)
    insurance_name = models.JSONField(blank=True, null=True, validators=[validate_insurance_name])
    email = models.EmailField(blank=True, null=True)
    # Additional Fields
    memberId = models.CharField(max_length=50, blank=True, null=True)
    serviceTypeCode = models.CharField(max_length=50, blank=True, null=True)
    profilePicture = models.ImageField(upload_to='pms/patient_profiles/', blank=True, null=True)

    # Notes
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    eligibility_status = models.CharField(max_length=50, blank=True, null=True)
    provider_network = models.CharField(max_length=50, blank=True, null=True)
    eligibility_last_checked = models.DateTimeField(blank=True, null=True)
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        db_table = "patient_details"
        constraints = [
            models.UniqueConstraint(
                name='unique_non_null_email',
                fields=['email'],
                condition=models.Q(email__isnull=False)
            )
        ]
class Document(models.Model):
    STATUS_CHOICES = (
        ('Old', 'Old'),
        ('New', 'New')
    )
    LABEL_CHOICES = (
        ('Photo Id','Photo Id'),
        ('Insurance Card','Insurance Card'),
        ('Medical Records','Medical Records'),
        ('Miscellaneous','Miscellaneous')
    )
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    patient = models.ForeignKey(
        'tenant_app.Patient',
        on_delete=models.CASCADE,
        related_name='documents')
    
    appointment = models.ForeignKey(
        'tenant_app.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents')
    
    file_name = models.CharField(max_length=255,null=True)
    file_path = models.TextField(
        blank=True,
        help_text="Absolute or relative path if stored externally",null=True)
    
    label = models.CharField(
        max_length=40,
        choices=LABEL_CHOICES,
        default='active',null=True)
    
    notes = models.TextField(blank=True,null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',null=True
    )
    created_at = models.DateTimeField(auto_now_add=True,null=True)
    updated_at = models.DateTimeField(auto_now=True,null=True)

    class Meta:
        db_table = 'patient_documents'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file_name} ({self.patient})"

class Appointment(models.Model):

    APPOINTMENT_TYPES = [
        ("patient_appointment", "Patient Appointment"),
        ("other_appointment", "Other Appointment"),
        ("telehealth_appointment", "Telehealth Appointment"),
    ]

    CONFIRMATION_STATUS_CHOICES = [
        ("unconfirmed", "Unconfirmed"),
        ("scheduled", "Scheduled"),
        ("reminder_sent", "Reminder Sent"),
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("arrived", "Arrived"), # 
        ("checked_in", "Checked In"), #
        ("in_progress", "In Progress"), #
        ("roomed", "Roomed"), #
        ("in_session", "In Session"), # 
        ("checked_out", "Checked Out"), 
        ("completed", "Completed"),
        ("no_show", "No Show"),
        ("rescheduled", "Rescheduled"),
        ("cancelled", "Cancelled"),
    ]

    patient = models.ForeignKey(
        'tenant_app.Patient',
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    provider = models.ForeignKey(
        'tenant_app.PatientProvider',
        on_delete=models.CASCADE,
        related_name="appointments"
    )
    location = models.ForeignKey(
        'tenant_encounter.ServiceLocation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    date = models.DateField()
    time = models.TimeField()  # 24-hour format
    duration = models.CharField(max_length=50)

    type = models.CharField(
        max_length=30,
        choices=APPOINTMENT_TYPES
    )

    confirmationstatus = models.CharField(
        max_length=20,
        choices=CONFIRMATION_STATUS_CHOICES,
        default="pending"
    )

    location = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    reason = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    notes = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    self_pay = models.BooleanField(default=False)
    copay_amt = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    deposite_amt = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    self_amt = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    def __str__(self):
        return f"{self.patient} | {self.type} | {self.date} {self.time}"

    class Meta:
        db_table = "patient_appoitnment"

