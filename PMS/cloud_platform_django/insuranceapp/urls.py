from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InsuranceViewSet,PendingInsuranceAPIView,InsuranceStatusUpdateAPIView

router = DefaultRouter()
router.register(r'insurances', InsuranceViewSet, basename='insurance')

urlpatterns = [
    path('', include(router.urls)),
    path("pending/", PendingInsuranceAPIView.as_view(), name="pending_insurances"),
    path("<int:pk>/update-status/", InsuranceStatusUpdateAPIView.as_view(), name="insurance_update_status"),
]
