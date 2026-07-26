from django.db import models
import uuid
from django.utils import timezone
from django.db.models import Max
from django.db import transaction

# Create your models here.

def generate_payment_id():
    last = (
        PaymentData.objects
        .select_for_update()
        .aggregate(max_num=Max("payment_id"))
        ["max_num"]
    )

    if not last:
        return "PYM-001"

    last_int = int(last.split("-")[1])
    next_int = last_int + 1

    return f"PYM-{str(next_int).zfill(3)}"


class PaymentData(models.Model):
    
    PAYMENT_TYPES = [("Check",'Check'),
                     ('Cash','Cash'),
                     ('Card','Card')]

    payment_id = models.CharField(primary_key=True, unique=True, editable=False)

    patient_id = models.ForeignKey('tenant_app.Patient',on_delete=models.CASCADE)

    appointment_id = models.ForeignKey('tenant_app.Appointment',on_delete=models.CASCADE)

    payment_type = models.CharField(max_length = 30,choices=PAYMENT_TYPES)
    payment_amount = models.DecimalField(max_digits = 10, decimal_places=2)
    check_number = models.CharField(max_length = 40,null=True,blank=True)

    payment_date = models.DateField(default=timezone.now)

    class Meta:
        db_table = "payment_data"

    def save(self, *args, **kwargs):
        if not self.payment_id:
            with transaction.atomic():
                self.payment_id = generate_payment_id()
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)