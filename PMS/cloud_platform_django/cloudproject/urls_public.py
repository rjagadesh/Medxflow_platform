# cloudproject/urls_public.py
# This file is used ONLY for the public schema (localhost:8000, yourdomain.com, etc.)

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# Import your custom URL modules (same as main urls.py)
from middleware.urls import stedi_urls, api_url

def home(request):
    return HttpResponse("<h1>Welcome to Droidal Cloud – Public Portal</h1><p>Use /app/account/ to register/login</p>")

urlpatterns = [
    path("", home, name="public-home"),
    
    # Core public endpoints
    path('app/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('app/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("app/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("app/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("app/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    
    path('app/admin/', admin.site.urls),
    path('app/account/', include('accounts.urls')),           # ← REGISTER & LOGIN
    path('app/project/', include('projects.urls')),
    path('app/insurance/', include('insuranceapp.urls')),
    path('app/queue/', include('queues.urls')),
    path('app/moduleapp/', include('modules.urls')),
    path('app/license/', include('licenses.urls')),
    path('app/record/', include('records.urls')),
    path('app/billing/', include('billing.urls')),
    path('app/trigger/', include('trigger.urls')),
    path('app/adminapp/', include('adminapp.urls')),
    path('app/agentsapp/', include('agentsapp.urls')),
    path("app/stedi/", include((stedi_urls, "stedi"), namespace="stedi")),
    path("app/api/", include((api_url, "api"), namespace="api")),
    path('app/roi/', include('roi.urls')),
    path('app/version/', include('Droidal_version_control.urls')),
    path('app/filemanager/', include('filemanager.urls')),
    path('app/agents/', include('agent_configuration.urls')),
    path('app/minutes-of-meeting/', include('minutesofmeetings.urls')),
    # In BOTH files (main urls.py and urls_public.py)
    path('app/patient/', include('tenant_app.urls')),
    path('app/meetings/', include('meetings.urls')),
    path('app/telehealth/', include('tenant_telehealth.urls')),
    path('app/encounter/', include('tenant_encounter.urls')),
]

# Serve media in development (same as main urls.py)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)