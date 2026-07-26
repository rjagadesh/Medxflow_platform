from rest_framework import serializers
from .models import AppRecord

class AppRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppRecord
        fields = '__all__'