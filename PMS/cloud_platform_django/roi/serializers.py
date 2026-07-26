from rest_framework import serializers
from .models import ProcessDatas

class ProcessDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessDatas
        fields = "__all__"
        read_only_fields = ['user']