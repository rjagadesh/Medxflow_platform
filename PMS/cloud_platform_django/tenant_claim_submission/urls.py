from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r"claims-api", ClaimViewSet, basename="claims")
# router.register(r"claim-lines", ClaimServiceLineViewSet, basename="claim-lines")
router.register(
    r"encounter-service-lines",
    EncounterServiceLineViewSet,
    basename="encounter-service-line"
)

urlpatterns = [
    # Router endpoints (ViewSets)
    path("", include(router.urls)),

    # Custom APIs
    path("submit-claim/", submit_claims_bulk, name="submit-claims-bulk"),
    path(
        "claims/<int:claim_id>/status/",
        update_claim_status,
        name="update-claim-status"
    ),
    path(
        "claims/<int:claim_id>/status_new/",
        update_new_claim_status,
        name="update-claim-status-new"
    ),
    path("get-837-file/", get_837_file, name = 'get_837_file'),
    path("get-837-data/",get_837_data,name="get_837_data"),
    path("get-835-file/",get_835_file,name=  "get_835_file"),

    path("settings/sftp/",SFTPConfigurationAPIView.as_view(), name="sftp-config-settings"),
    path("settings/sftp/<int:pk>/", SFTPConfigurationDetailAPIView.as_view()),
]
