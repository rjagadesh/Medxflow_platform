from rest_framework import serializers
from .models import Queue, QueueRecord

class QueueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Queue
        fields = '__all__'

class QueueRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = QueueRecord
        fields = '__all__'