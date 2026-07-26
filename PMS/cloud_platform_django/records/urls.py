from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import  AppRecordViewSet

router = DefaultRouter()
router.register(r'app-records', AppRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
