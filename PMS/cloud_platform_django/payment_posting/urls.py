from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import *

router = DefaultRouter()

# Core
router.register("payments", PaymentViewSet, basename="payments")
router.register("ledger/claim", PaymentLedgerViewSet, basename="claim-ledger")
router.register("ledger/provider", ProviderLedgerViewSet, basename="provider-ledger")

# Reference data
router.register("adjustment-codes", AdjustmentCodeViewSet, basename="adjustment-codes")

# EOB (read-only + normalized)
router.register("eob-adjustments", PaymentEOBAdjustmentViewSet, basename="eob-adjustments")
router.register("payment-eobs", PaymentEOBViewSet, basename="payment-eobs")

urlpatterns = [
    # Derived balances
    path("claims/<uuid:claim_id>/balance/", ClaimBalanceView.as_view()),

    # Aggregated EOB (claim + lines + CAS)
    path("eobs/<uuid:eob_id>/full/", PaymentEOBAggregatedView.as_view()),

    # Reversals (explicit, immutable)
    path("ledger/claim/<uuid:ledger_id>/reverse/", ReverseClaimLedgerEntry.as_view()),
    path("ledger/provider/<uuid:ledger_id>/reverse/", ReverseProviderLedgerEntry.as_view()),
    path("patient-search/",Payment_patient_search_APIView.as_view(),name="Payment_patient_search_APIView"),
    path("Patient-EOB-details/",Payment_Patient_EOB_details_APIView.as_view(),name="Payment_Patient_EOB_details_APIView"),
    path(
    "patients/<uuid:patient_id>/ledgers/",
    PatientLedgerView.as_view(),
    name="patient-ledgers",
)

]

urlpatterns += router.urls
