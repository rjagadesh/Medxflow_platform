from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MinutesOfMeetingsViewSet, view_mom_pdf, MailTemplateViewSet, SignatureViewSet, SendMailAPIView

router = DefaultRouter()
router.register(r"minutes", MinutesOfMeetingsViewSet, basename="minutes-of-meetings")
router.register(r"mail-templates", MailTemplateViewSet, basename="mail-templates")
router.register(r"signatures", SignatureViewSet, basename="signatures")

urlpatterns = [
    path("mom/pdf/<int:pk>/", view_mom_pdf, name="mom-pdf"),
    path("send-mail/", SendMailAPIView.as_view(), name="send-mail"),
    path("", include(router.urls)),
]
