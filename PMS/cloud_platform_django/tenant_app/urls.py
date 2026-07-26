# patient/urls.py  (create this file)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'documents-process', DocumentViewSet, basename='documents-process')

urlpatterns = [
    path('', include(router.urls)),
    path("minimal/patients/", MinimalPatientListView.as_view()),
    path("minimal/providers/", MinimalProviderListView.as_view()),
    
    path("patient/", PatientsView.as_view()),
    path("patient/<uuid:pk>/", PatientDetailView.as_view()),  # Patient PK is a UUID, not int

    path("provider/", ProvidersView.as_view()),
    path("provider/<int:pk>/", ProviderDetailView.as_view()),

    path("appointment/", AppointmentsView.as_view()),
    path("appointment/<int:pk>/", AppointmentDetailView.as_view()),
    path("appointment_multi/",AppointmentsView_pagination.as_view()),
    path('appointments/<int:appointment_id>/start-meeting/', StartAppointmentMeetingView.as_view(), name='start-appointment-meeting'),
    path("dashboard-analytics/", SchemaCountsView.as_view(), name="dashboard-analytics"),

    # Extra nice endpoint
    path('patients/<uuid:id>/encounters/', PatientViewSet.as_view({'get': 'list'}), name='patient-encounters'),
    path("patients-list/minimal/", PatientListMinimalAPIView.as_view()),
    path("providers-list/minimal/", ProviderListMinimalAPIView.as_view()),
    path("providers-availability/", ProviderAvailabilityAPIView.as_view()),
    path("appoinment-eligibility-check/", AppointmentEligibilityCheckView.as_view()),
    path("appointments/available-slots/",AvailableAppointmentSlotsAPIView.as_view(), name="available-appointment-slots"
    ),
    path("appointments/patient/<uuid:patient_id>/", PatientAppointmentsView.as_view()),
    path(
        "upload-documents/",
        EncounterDocumentUploadAPIView.as_view(),
        name="encounter-document-upload",
    ),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
