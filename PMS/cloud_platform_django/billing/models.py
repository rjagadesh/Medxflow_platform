from django.db import models
from accounts.models import User, Client
class Billing(models.Model):
    # 👇 Map to Client instead of User
    client = models.ForeignKey(
        Client, on_delete=models.CASCADE, related_name="billings"
    )
    data = models.JSONField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_count = models.IntegerField()
    month = models.DateField()

    def __str__(self):
        return f"Billing {self.id} for {self.client.client_name}"

    class Meta:
        db_table = "billing"
        unique_together = ("client", "month")  # ✅ one bill per client per month
        
class PaymentMethod(models.Model):
    billing = models.ForeignKey(Billing, on_delete=models.CASCADE)
    tenant = models.ForeignKey(User, on_delete=models.CASCADE)
    payment_type = models.CharField(max_length=50)
    monthly_bill = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField()

    def __str__(self):
        return self.payment_type
    class Meta:
        db_table = "payment_method"


class AzureMachine(models.Model):
    client = models.ForeignKey(
        'accounts.Client',
        on_delete=models.CASCADE,
        related_name='azure_machines',
        null=True,
        blank=True
    )
    environment = models.CharField(
        max_length=10,
        choices=[("DEV", "Development"), ("PROD", "Production")],
        null=True
    )

    disk_name = models.CharField(max_length=255, null=True, blank=True, default="")
    disk_size_gb = models.PositiveIntegerField(null=True, blank=True, default=0)
    disk_type = models.CharField(max_length=50, null=True, blank=True, default="")

    # Unique tag like AM00, AM01... per machine
    tag = models.CharField(max_length=50, null=True, blank=True, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def tab_name(self):
        if self.client and self.environment:
            return f"AM_{self.environment}_00{self.client.id}".upper()
        return None

    class Meta:
        db_table = "azure_machines"
        ordering = ["client_id", "tag"]

    def __str__(self):
        return f"{self.tag or 'MACHINE'} - {self.client.client_name if self.client else 'No Client'}"

    def save(self, *args, **kwargs):
        if not self.tag and self.client:
            # Count how many machines already exist for this client
            count = AzureMachine.objects.filter(client=self.client).count()
            # Generate tag like AM00, AM01, ...
            self.tag = f"AM{count:02d}"
        super().save(*args, **kwargs)


class AzureBilling(models.Model):
    machine = models.ForeignKey(
        AzureMachine,
        on_delete=models.CASCADE,
        related_name="billings"
    )
    vm_cost = models.DecimalField(max_digits=10, decimal_places=2)
    disk_cost = models.DecimalField(max_digits=10, decimal_places=2)
    ip_cost = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)

    month = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    billing_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "azure_billing"
        unique_together = ("machine", "month")  # one billing entry per machine per month

