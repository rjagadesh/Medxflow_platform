from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AppRecord
from .serializers import AppRecordSerializer

class AppRecordViewSet(viewsets.ModelViewSet):
    queryset = AppRecord.objects.all()
    serializer_class = AppRecordSerializer
    permission_classes = [IsAuthenticated]
