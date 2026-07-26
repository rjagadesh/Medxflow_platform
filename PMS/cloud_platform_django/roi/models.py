from django.db import models
from accounts.models import User
from modules.models import Module, App

class ProcessDatas(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="process_data")

    department = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="process_data")
    agent = models.ForeignKey(App, on_delete=models.CASCADE, related_name="process_data")

    head_count = models.IntegerField(blank=True, null=True)
    hours_spent = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    avg_time = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    invoice_value = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

    operational_model = models.CharField(max_length=50, null=True, blank=True)
    additional_load_cost = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

    onsite_head_count = models.IntegerField(blank=True, null=True)
    onsite_hours_spent = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    onsite_hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    onsite_additional_load_cost = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

    offshore_head_count = models.IntegerField(blank=True, null=True)
    offshore_hours_spent = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    offshore_hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    offshore_additional_load_cost = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.department} - {self.agent}"

    class Meta:
        managed = True
        db_table = 'roi_datas'
