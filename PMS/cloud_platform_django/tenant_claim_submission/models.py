from django.db import models
from tenant_encounter.models import Encounter
from django.utils import timezone
# Create your models here.
import uuid
class Claim(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # encounter = models.OneToOneField(
        # "tenant_encounter.Encounter", on_delete=models.PROTECT, related_name="submitted_claim"
    # )
    encounter = models.ForeignKey(
    "tenant_encounter.Encounter", 
    on_delete=models.PROTECT,
    related_name="claims"
)

    claim_number = models.CharField(max_length=50, unique=True)
    claim_type = models.CharField(
        max_length=10, choices=[('837P','Professional'), ('837I','Institutional')],
        default='837P'
    )

    status = models.CharField(
        max_length=30,
        choices=[
            ('draft','Draft'),
            ('All Claims','All Claims'),
            ('Ready to Print Paper','Ready to Print Paper'),
            ('Ready to Electronic Statements','Ready to Electronic Statements'),
            ('Rejections','Rejections'),
            ('Denials','Denials'),
            ('No Response','No Response'),
            ('Pending Insurance','Pending Insurance'),
            ('Pending Patients','Pending Patients'),
            ('Completed','Completed')
        ],
        default='draft'
    )

    allowed = models.DecimalField(max_digits=12, decimal_places=2)

    paid = models.DecimalField(max_digits=12, decimal_places=2)
    
    balance_due = models.DecimalField(max_digits=12, decimal_places=2)

    submitted_at = models.DateTimeField(null=True, blank=True)
    payer_claim_id = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    procedure_code = models.CharField(max_length=10, blank=True, null=True)
    modifiers = models.CharField(max_length=255, blank=True, null=True)
    units = models.PositiveIntegerField(blank=True, null=True)
    charge_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    diagnosis_pointers = models.CharField(max_length=255, blank=True, null=True)  # "1,2"
    rendering_provider = models.ForeignKey(
        "tenant_app.PatientProvider",
        on_delete=models.PROTECT, blank=True, null=True
    )

    date_from = models.DateField(default=timezone.now)
    date_to = models.DateField(default=timezone.now)

    transaction_id = models.CharField(max_length=100, null=True,blank=True)

    class Meta:
        db_table = "claim"


# class ClaimServiceLine(models.Model):
#     claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name="lines")

    # procedure_code = models.CharField(max_length=10)
    # modifiers = models.CharField(max_length=255, blank=True)
    # units = models.PositiveIntegerField()
    # charge_amount = models.DecimalField(max_digits=10, decimal_places=2)

    # diagnosis_pointers = models.CharField(max_length=255)  # "1,2"
    # rendering_provider = models.ForeignKey(
    #     "tenant_app.PatientProvider",
    #     on_delete=models.PROTECT
    # )

    # date_from = models.DateField()
    # date_to = models.DateField(null=True, blank=True)

    # class Meta:
        # db_table = "claim_service_line"


class SFTPConfiguration(models.Model):
    ENV_CHOICES = [
        ("production", "Production"),
        ("staging", "Staging"),
        ("test", "Test"),
    ]

    AUTH_CHOICES = [
        ("ssh", "SSH Key"),
        ("password", "Password"),
    ]

    COMPRESSION_CHOICES = [
        ("none", "None"),
        ("zip", "ZIP"),
        ("gzip", "GZIP"),
    ]

    FREQUENCY_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
        ("hourly","Hourly"),
        ("minutes","Minutes")
    ]

    environment = models.CharField(max_length=20, choices=ENV_CHOICES)
    host = models.CharField(max_length=255)
    port = models.PositiveIntegerField(default=22)

    auth_type = models.CharField(max_length=20, choices=AUTH_CHOICES)
    username = models.CharField(max_length=255, blank=True, null=True)
    password = models.CharField(max_length=255, blank=True, null=True)
    ssh_key = models.TextField(blank=True, null=True)

    inbound_dir = models.CharField(max_length=255, blank=True, null=True)
    archive_dir = models.CharField(max_length=255, blank=True, null=True)
    retention_days = models.PositiveIntegerField(blank=True, null=True)

    x12_version = models.CharField(max_length=50, default="005010X221A1")
    compression = models.CharField(max_length=20, choices=COMPRESSION_CHOICES, default="none")
    naming_convention = models.CharField(max_length=255, blank=True, null=True)

    payer_name = models.CharField(max_length=255, blank=True, null=True)
    payer_id = models.CharField(max_length=100, blank=True, null=True)
    trading_partner_id = models.CharField(max_length=100, blank=True, null=True)

    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    delivery_window = models.CharField(max_length=100, blank=True, null=True)
    avg_files_per_day = models.CharField(max_length=50, blank=True, null=True)
    file_frequency = models.CharField(max_length=50, blank=True, null=True)

    whitelisted_ips = models.TextField(blank=True, null=True)
    tech_contact = models.CharField(max_length=255, blank=True, null=True)
    ops_contact = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.environment} | {self.host}"