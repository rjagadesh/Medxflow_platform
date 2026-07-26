from rest_framework import serializers
from .models import Insurance

class InsuranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insurance
        fields = "__all__"
        read_only_fields = ("tenant", "apikey")  # don’t require these from client
