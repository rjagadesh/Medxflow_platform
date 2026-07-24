"""Root URL configuration for the MedXFlow project."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("licensing.urls")),
    path("api/", include("voiceai.urls")),
    path("api/", include("connectors.urls")),
    path("api/", include("skills.urls")),
    path("api/", include("rbac.urls")),
    path("api/", include("assistant.urls")),
    path("api/", include("files.urls")),
    path("api/", include("vault.urls")),
    path("api/", include("orchestration.urls")),
    path("api/", include("audit.urls")),
    path("api/", include("dashboards.urls")),
    path("api/", include("insights.urls")),
    path("api/", include("eligibility.urls")),
    path("api/", include("kiosk.urls")),
]

# Serve uploaded media (avatars) from the dev server.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
