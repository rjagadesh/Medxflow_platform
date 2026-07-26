# pms/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from .analytics import BillingAnalyticsView

router = DefaultRouter()
router.register(r'encounters', EncounterViewSet, basename='encounter')
router.register(r'service-locations', ServiceLocationViewSet, basename='service-location')
router.register(
    r"encounters-status-change",
    EncounterstatusupdateViewSet,
    basename="encounter-status-change"
)

urlpatterns = [
    path('fee-schedule-list/', FeeScheduleListView.as_view(), name='fee-schedule-list'),
    path('encounter-form-data/<uuid:id>/', EncounterFormDataView.as_view(), name='encounter-form-data'),
    path('', include(router.urls)),

    # Optional extra endpoints if needed
    # path('encounters/by-patient/<uuid:patient_id>/', EncounterViewSet.as_view({'get': 'list'}), name='encounters-by-patient'),

    path ("appointment-autofill/",Autofill_appointment_APIView.as_view(),name="Autofill_appointment_APIView"),

    path("analytics/billing/", BillingAnalyticsView.as_view(), name="billing-analytics"),

]

