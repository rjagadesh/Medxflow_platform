from rest_framework import viewsets
from .models import Machine, AppApiKey
from .serializers import LicenseSerializer, AppApiKeySerializer
from rest_framework.permissions import IsAuthenticated

class LicenseViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all()
    serializer_class = LicenseSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user) 

    def get_queryset(self):
        user = self.request.user
        queryset = Machine.objects.filter(client=user)

        return queryset

class AppApiKeyViewSet(viewsets.ModelViewSet):
    queryset = AppApiKey.objects.all()
    serializer_class = AppApiKeySerializer
