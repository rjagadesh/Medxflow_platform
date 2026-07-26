from django.urls import path
from .views import (
    AllergyView,
    AllergyDetailView,
    PatientAllergyProfileView,
    PatientAllergiesView,
    ProblemView,
    ProblemDetailView,
    PatientProblemsView,
    MedicationsView,
    MedicationDetailView,
    MedicationMarkAsErrorView,
    PatientMedicationsView,
    PatientVitalsView,
    PatientVitalsDetailView,
    PatientVitalsByPatientView,
    ClinicalNoteView,
    ClinicalNoteDetailView,
    ClinicalNoteByAppointmentView,
    ClinicalNoteSignOffView,
    ClinicalNoteByPatientView,
    LabOrderView,
    LabOrderDetailView,
    PatientLabOrdersView,
    PatientHistoryView,
    PatientHistoryDetailView,
    PatientHistoryByPatientView,
)

urlpatterns = [
    # 🔹 Clinical Notes
    path("clinical-notes/", ClinicalNoteView.as_view(), name="clinical-note-list-create"),
    path("clinical-notes/<int:pk>/", ClinicalNoteDetailView.as_view(), name="clinical-note-detail"),
    path("clinical-notes/<int:pk>/sign-off/", ClinicalNoteSignOffView.as_view(), name="clinical-note-sign-off"),
    path(
        "clinical-notes/appointment/<str:appointment_id>/patient/<str:patient_id>/",
        ClinicalNoteByAppointmentView.as_view(),
        name="clinical-note-by-appointment"
    ),

    # 🔹 Patient Clinical Notes
    path(
        "patients/<str:patient_id>/clinical-notes/",
        ClinicalNoteByPatientView.as_view(),
        name="patient-clinical-notes-list"
    ),

    # 🔹 Allergies
    path("allergies/", AllergyView.as_view(), name="allergy-list-create"),
    path("allergies/<int:pk>/", AllergyDetailView.as_view(), name="allergy-detail"),

    # 🔹 Patient Allergies
    path(
        "patients/<str:patient_id>/allergies/",
        PatientAllergiesView.as_view(),
        name="patient-allergies-list"
    ),

    # 🔹 Problems
    path("problems/", ProblemView.as_view(), name="problem-list-create"),
    path("problems/<int:pk>/", ProblemDetailView.as_view(), name="problem-detail"),

    # 🔹 Patient Problems
    path(
        "patients/<str:patient_id>/problems/",
        PatientProblemsView.as_view(),
        name="patient-problems-list"
    ),

    # 🔹 Patient Allergy Profile
    path(
        "patients/<str:patient_id>/allergy-profile/",
        PatientAllergyProfileView.as_view(),
        name="patient-allergy-profile"
    ),

    # 🔹 Medications
    path("medications/", MedicationsView.as_view(), name="medication-list-create"),
    path("medications/<int:pk>/", MedicationDetailView.as_view(), name="medication-detail"),
    path("medications/<int:pk>/mark-error/", MedicationMarkAsErrorView.as_view(), name="medication-mark-error"),

    # 🔹 Patient Medications
    path(
        "patients/<str:patient_id>/medications/",
        PatientMedicationsView.as_view(),
        name="patient-medications-list"
    ),

    # 🔹 Vitals
    path("vitals/", PatientVitalsView.as_view(), name="vitals-list-create"),
    path("vitals/<int:pk>/", PatientVitalsDetailView.as_view(), name="vitals-detail"),

    # 🔹 Patient Vitals
    path(
        "patients/<str:patient_id>/vitals/",
        PatientVitalsByPatientView.as_view(),
        name="patient-vitals-list"
    ),

    # 🔹 Labs / Studies Orders
    path("lab-orders/", LabOrderView.as_view(), name="lab-order-list-create"),
    path("lab-orders/<int:pk>/", LabOrderDetailView.as_view(), name="lab-order-detail"),
    path(
        "patients/<str:patient_id>/lab-orders/",
        PatientLabOrdersView.as_view(),
        name="patient-lab-orders-list"
    ),

    # 🔹 Past Medical / Surgical History
    path("history/", PatientHistoryView.as_view(), name="history-list-create"),
    path("history/<int:pk>/", PatientHistoryDetailView.as_view(), name="history-detail"),
    path(
        "patients/<str:patient_id>/history/",
        PatientHistoryByPatientView.as_view(),
        name="patient-history-list"
    ),
]
