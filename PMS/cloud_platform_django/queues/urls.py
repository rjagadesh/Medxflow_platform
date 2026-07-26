from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QueueViewSet, QueueRecordViewSet

router = DefaultRouter()
router.register(r'queues', QueueViewSet)
router.register(r'queue-records', QueueRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
