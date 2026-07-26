from django.db import models
from modules.models import App   # adjust import path
from accounts.models import User
class Insurance(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILURE', 'Failure'),
    )

    apikey = models.ForeignKey(
        App,
        to_field="api_key",   # <-- references App.apikey instead of id
        db_column="apikey",  # optional: ensures column name is `apikey`
        on_delete=models.CASCADE,
        related_name='insurances'
    )
    tenant = models.ForeignKey(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50, blank=True)
    date_of_birth = models.DateField()
    address = models.TextField()
    insurance_provider = models.CharField(max_length=100)
    member_id = models.CharField(max_length=50, unique=True)
    provider = models.CharField(max_length=100)
    fax_number = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.member_id}"

    class Meta:
        db_table = 'insurance'
        verbose_name = 'Insurance'
        verbose_name_plural = 'Insurances'
        ordering = ['last_name', 'first_name']




role= ['admin', 'agent', 'partner']
status=['active', 'inactive']

