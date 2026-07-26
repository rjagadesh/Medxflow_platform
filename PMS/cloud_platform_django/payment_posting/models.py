from django.db import models,transaction
import uuid
from django.core.exceptions import ValidationError


# Create your models here.


class PaymentBatchSequence(models.Model):
    last_value = models.PositiveIntegerField(default=0)

class Payment(models.Model):
    SOURCE_CHOICES = [
        ("eft", "EFT"),
        ("check", "Check"),
        ("cash", "Cash"),
        ("card", "Card"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PARTIALLY_POSTED", "Partially Posted"),
        ("POSTED", "Posted"),
        ("REVERSED", "Reversed"),
    ]


    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=True
    )

    batch_number = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True
    )

    payer_name = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        null=True,
        blank=True
    )

    received_date = models.DateField(
        null=True,
        blank=True
    )

    deposit_date = models.DateField(
        null=True,
        blank=True
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )


    payer_id = models.CharField(max_length=50, null=True, blank=True)

    reference_number = models.CharField(
        max_length=100, help_text="Check number / ERA trace number"
    )


    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="PENDING"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.batch_number} - {self.payer_name}"
    
    def save(self, *args, **kwargs):
        if not self.batch_number:
            with transaction.atomic():
                seq, _ = PaymentBatchSequence.objects.select_for_update().get_or_create(
                    id=1
                )
                seq.last_value += 1
                seq.save(update_fields=["last_value"])

                self.batch_number = f"BATCH-{seq.last_value:08d}"

        super().save(*args, **kwargs)





class AdjustmentCode(models.Model):
    """
    CAS Adjustment Codes (835)
    Example:
      PR-1  Deductible
      PR-2  Coinsurance
      PR-3  Copay
      CO-45 Contractual Obligation
    """

    ADJUSTMENT_GROUPS = [
        ("PR", "Patient Responsibility"),
        ("CO", "Contractual Obligation"),
        ("OA", "Other Adjustment"),
        ("PI", "Payer Initiated"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    group_code = models.CharField(
        max_length=2, choices=ADJUSTMENT_GROUPS
    )  # PR / CO / OA / PI

    code = models.CharField(
        max_length=10
    )  # 1, 2, 3, 45, 94, etc.

    description = models.CharField(max_length=255)

    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("group_code", "code")
        indexes = [
            models.Index(fields=["group_code", "code"]),
        ]

    def __str__(self):
        return f"{self.group_code}-{self.code}: {self.description}"



class Payment_EOB(models.Model):

    claim = models.ForeignKey("tenant_claim_submission.Claim", on_delete=models.CASCADE, related_name='eobs',null=True)

    payment_id = models.ForeignKey("Payment",on_delete=models.CASCADE,null=True)

    encounter_id = models.ForeignKey("tenant_encounter.Encounter",on_delete=models.CASCADE,null=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payer = models.CharField(max_length=255, null=True, blank=True)
    allowed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    contract_adj = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    deductible = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    coinsurance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    copay = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    status = models.CharField(max_length=255, null=True, blank=True)
    adj_code = models.ForeignKey(
        AdjustmentCode,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )

    # Payer identifiers (CLP segment)
    payer_claim_control_number = models.CharField(
        max_length=100, null=True, blank=True
    )
    payer_claim_status_code = models.CharField(
        max_length=10, null=True, blank=True
    )
    adj_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
         null=True,
        blank=True,
    )

    # Billed amount (what YOU charged)
    billed_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    # Your claim number echoed by payer
    patient_control_number = models.CharField(
        max_length=100, null=True, blank=True
    )

    # RARC / remark codes (why payer did something)
    remark_codes = models.JSONField(null=True, blank=True)

    # Dates
    claim_received_date = models.DateField(null=True, blank=True)
    claim_adjudication_date = models.DateField(null=True, blank=True)

    note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    procedure_code = models.CharField(max_length=20,null=True, blank=True)

    units = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )

    service_date = models.DateField(null=True, blank=True)
    from_date = models.DateField(null=True,blank=True)
    to_date = models.DateField(null=True,blank=True)
    remark_codes = models.JSONField(null=True, blank=True)
    

    class Meta:
        db_table = "payment_eob"


class Payment_EOB_Adjustment(models.Model):
    eob = models.ForeignKey(
        Payment_EOB,
        on_delete=models.CASCADE,
        related_name="adjustments"
    )
    adjustment_code = models.ForeignKey(AdjustmentCode, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)



# class Payment_EOB_Line(models.Model):
#     eob = models.ForeignKey(
#         Payment_EOB,
#         on_delete=models.CASCADE,
#         related_name="lines"
#     )

#     service_line_number = models.IntegerField()
#     procedure_code = models.CharField(max_length=20)

#     line_charge_amount = models.DecimalField(max_digits=10, decimal_places=2)
#     line_allowed_amount = models.DecimalField(max_digits=10, decimal_places=2)
#     line_paid_amount = models.DecimalField(max_digits=10, decimal_places=2)

#     units = models.DecimalField(
#         max_digits=6, decimal_places=2, null=True, blank=True
#     )

#     service_date = models.DateField(null=True, blank=True)
#     remark_codes = models.JSONField(null=True, blank=True)


class PaymentLedger(models.Model):
    ENTRY_TYPES = [
        ("PAYMENT", "Payment"),
        ("ADJUSTMENT", "Adjustment"),
        ("REVERSAL", "Reversal"),
        ("CLAIMS",'Claims'),
        ("CHARGE", 'Charge'),
    ]

    RESPONSIBILITY_TYPES = [
        ("PAYER", "Payer"),
        ("PATIENT", "Patient"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    batch = models.ForeignKey(
        Payment,
        on_delete=models.PROTECT,
        related_name="ledger_entries",
        null=True, blank=True
    )

    claim = models.ForeignKey(
        "tenant_claim_submission.Claim",
        on_delete=models.PROTECT,
        related_name="ledger_entries",
        null = True,
        blank = True
    )

    patient = models.ForeignKey(
        "tenant_app.Patient",
        on_delete = models.PROTECT,
        null = True,
        blank = True,
        related_name = 'patient_ledger'
        )

    claim_line_id = models.UUIDField(null=True, blank=True)

    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES)

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    notes = models.CharField(max_length=200, null = True, blank= True)
    responsibility_type = models.CharField(
        max_length=10, choices=RESPONSIBILITY_TYPES
    )

    adjustment_code = models.ForeignKey(
        AdjustmentCode,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    adj_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
         null=True,
        blank=True,
    )
    source = models.CharField(max_length=20, default="ERA")
    reference_id = models.CharField(max_length=100, null=True, blank=True)

    posting_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["claim"]),
            models.Index(fields=["batch"]),
            models.Index(fields=["entry_type"]),
        ]

    def clean(self):
        if self.entry_type == "PAYMENT" and self.amount <= 0:
            raise ValidationError("PAYMENT must be positive")

        if self.entry_type == "ADJUSTMENT" and self.amount >= 0:
            raise ValidationError("ADJUSTMENT must be negative")

        if self.entry_type == "ADJUSTMENT" and not self.adjustment_code:
            raise ValidationError("ADJUSTMENT requires AdjustmentCode")

        if self.entry_type == "PAYMENT" and self.adjustment_code:
            raise ValidationError("PAYMENT cannot have AdjustmentCode")
        
        if self.entry_type == "CLAIMS" and self.amount >= 0 :
            raise ValidationError ("CLAIMS SHOULD BE IN NEGATIVE AMOUNT")
        if (
            self.adjustment_code
            and self.adjustment_code.group_code == "PR"
            and self.responsibility_type != "PATIENT"
        ):
            raise ValidationError("PR adjustments must be PATIENT responsibility")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class ProviderLedger(models.Model):
    ENTRY_TYPES = [
        ("PLB", "PLB Adjustment"),
        ("REVERSAL", "PLB Reversal"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    batch = models.ForeignKey(
        Payment,
        on_delete=models.PROTECT,
        related_name="provider_ledger_entries",
    )

    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES)

    amount = models.DecimalField(max_digits=12, decimal_places=2)

    plb_reason_code = models.CharField(max_length=10)
    plb_identifier = models.CharField(max_length=50, null=True, blank=True)
    description = models.CharField(max_length=255, null=True, blank=True)

    posting_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.amount == 0:
            raise ValidationError("PLB amount cannot be zero.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
