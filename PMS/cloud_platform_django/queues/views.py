from rest_framework import viewsets
from .models import Queue, QueueRecord
from .serializers import QueueSerializer, QueueRecordSerializer

class QueueViewSet(viewsets.ModelViewSet):
    queryset = Queue.objects.all()
    serializer_class = QueueSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Queue.objects.filter(project__tenant=user)

        return queryset

class QueueRecordViewSet(viewsets.ModelViewSet):
    queryset = QueueRecord.objects.all()
    serializer_class = QueueRecordSerializer
