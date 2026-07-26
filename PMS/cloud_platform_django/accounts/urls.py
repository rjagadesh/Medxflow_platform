from django.urls import path,include
from .views import *
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# router.register(r"clients", ClientViewSet, basename="client")
router.register(r"users", UserViewSet, basename="user")
router.register(r"alerts/summary", SummaryAlertViewSet, basename="summary-alert")
router.register(r"alerts/invoice", InvoiceAlertViewSet, basename="invoice-alert")


urlpatterns = [
    path("user/", include(router.urls)),
    path("create-user/", UserCreateAPIView.as_view(), name="user-create"),
    path("client/users/", UserListAPIView.as_view(), name="user-list"),
    path("client/users/<int:pk>/", UserDetailAPIView.as_view(), name="user-detail"),
    path('ClientCreateView/', ClientCreateView.as_view(), name='ClientCreateView'),
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path("mail-verification/", mail_verification, name="login_and_send_verification"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path('metrics/', MetricsView.as_view(), name='metrics'),
    path('me/', LoggedInUserDetailsView.as_view(), name='user-details'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('users/', get_all_users, name='get_all_users'),
    path("forgot-password/", forgot_password, name="forgot-password"),
    path("reset-password/<uidb64>/<token>/", reset_password, name="reset-password"),
    path("api/register-client-user/", ClientUserCreateAPIView.as_view(), name="register-client-user"),
    path('api/register/', ClientRegisterAPIView.as_view(), name='register'),
    path('api/clients/', ClientListView.as_view(), name='client-list'),
    # path('api/validate-license/', ValidateLicenseView.as_view(), name='validate-license'),
    path("validate-license/", LicenseValidationAPIView.as_view(), name="validate-license"),
    path('api/deactivate-license/', deactivate_license, name='deactivate_license'),

    path('version/increase/<str:app_name>/', increase_version, name='increase-version'),
    path('version/<str:app_name>/', get_version, name='get-version'),
    path("search-user/", UserSearchAPIView.as_view(), name="search-user"),
    path("user-detail/", LicenseUsersDetails.as_view(), name="user-detail"),
    path('verify-email/<uidb64>/<token>/', verify_email, name='verify-email'),
    path("user-profile/", UserAPI.as_view(), name="user_profile"),
    path("client-license-overview/", ClientLicenseOverviewView.as_view(), name="client-license-overview"),
    path("mfa/", MFAView.as_view(), name="mfa"),
    path('mfa-verify/', MfaVerifyAPIView.as_view(), name='mfa-verify'),
    path('access-control/save-permissions/', AccessControlView.as_view(), name='save-permissions'),
    path('alerts/summary_send/',SummarySendNow.as_view(), name="summary_send"),
    path('analytics/license/', LicenseTierChartAPIView.as_view(), name='license-tier-chart'),
    path(
        "clients/<str:client_id>/voice-ai-license/",
        UpdateVoiceAILicenseAPIView.as_view(),
        name="update-voice-ai-license",
    ),
    path('license/<int:client_id>/view/', ViewLicensePDFAPIView.as_view(), name='view-license-pdf'),
    path('license/<int:client_id>/download/', DownloadLicensePDFAPIView.as_view(), name='download-license-pdf'),
]
