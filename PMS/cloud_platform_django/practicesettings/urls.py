from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from django.conf import settings
from django.conf.urls.static import static


router = DefaultRouter()
router.register(r'insurance-companies', InsuranceCompanyViewSet, basename='insurance-company')
router.register(r'insurance-plans', InsurancePlanViewSet, basename='insurance-plan')
router.register(r'insurance-policies', InsurancePolicyViewSet, basename='insurance-policy')

urlpatterns = [
    path('', include(router.urls)),
    path(
        "practice-information/",
        PracticeInformationView.as_view(),
        name="practice-information"
    ),

    # GET / UPDATE / DELETE
    path(
        "practice-information/<int:pk>/",
        PracticeInformationDetailView.as_view(),
        name="practice-information-detail"
    ),
    path(
        "scheduling-settings/",
        PracticeSchedulingSettingsView.as_view(),
        name="practice-scheduling-settings"
    ),

    # 🔹 Retrieve / Update / Delete
    path(
        "scheduling-settings/<int:pk>/",
        PracticeSchedulingSettingsDetailView.as_view(),
        name="practice-scheduling-settings-detail"
    ),

    path(
        "staff-schedules/",
        StaffScheduleView.as_view(),
        name="staff-schedule-list-create"
    ),
    path(
        "staff-schedules/<int:pk>/",
        StaffScheduleDetailView.as_view(),
        name="staff-schedule-detail"
    ),
    path(
        "staff-time-off/",
        StaffTimeOffView.as_view(),
        name="staff-time-off-list-create"
    ),
    path(
        "staff-time-off/<int:pk>/",
        StaffTimeOffDetailView.as_view(),
        name="staff-time-off-detail"
    ),

    path(
        "rooms/",
        RoomView.as_view(),
        name="room-list-create"
    ),
    path(
        "rooms/<int:pk>/",
        RoomDetailView.as_view(),
        name="room-detail"
    ),

    # 🔹 Equipment
    path(
        "equipment/",
        EquipmentView.as_view(),
        name="equipment-list-create"
    ),
    path(
        "equipment/<int:pk>/",
        EquipmentDetailView.as_view(),
        name="equipment-detail"
    ),
    path(
        "practice-holidays/",
        PracticeHolidayView.as_view(),
        name="practice-holiday-list-create"
    ),
    path(
        "practice-holidays/<int:pk>/",
        PracticeHolidayDetailView.as_view(),
        name="practice-holiday-detail"
    ),
    path(
        "provider-schedule-blocks/",
        ProviderScheduleBlockView.as_view(),
        name="provider-schedule-block-list-create"
    ),
    path(
        "provider-schedule-blocks/<int:pk>/",
        ProviderScheduleBlockDetailView.as_view(),
        name="provider-schedule-block-detail"
    ),
    path(
        "service-codes/",
        ServiceCodeView.as_view(),
        name="service-code-list-create"
    ),
    path(
        "service-codes/<int:pk>/",
        ServiceCodeDetailView.as_view(),
        name="service-code-detail"
    ),
    path(
        "visit-reasons/",
        VisitReasonView.as_view(),
        name="visit-reason-list-create"
    ),
    path(
        "visit-reasons/<int:pk>/",
        VisitReasonDetailView.as_view(),
        name="visit-reason-detail"
    ),
    path("fee-schedule-entries/", FeeScheduleEntryListCreateView.as_view(), name="entry-list-create"),

    # Detail: Retrieve, Update, Delete
    path("fee-schedule-entries/<int:pk>/", FeeScheduleEntryDetailView.as_view(), name="entry-detail"),

    # Bulk Upload
    path("fee-schedule-entries/bulk-upload/", BulkFeeScheduleUploadView.as_view(), name="bulk-upload"),

] 

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
