"""
URL configuration for cloudproject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import cloudproject.urls_public          # ← ADD THIS LINE
import cloudproject.urls                 # ← AND THIS LINE
from django.contrib import admin
from django.urls import path,include
from django.urls import path, re_path
from rest_framework import permissions
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from middleware.urls import stedi_urls,api_url  # Import only the desired URLs
urlpatterns = [
    path("app/schema/", SpectacularAPIView.as_view(), name="schema"),   # JSON schema
    path("app/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("app/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path('app/admin/', admin.site.urls),
    path('app/account/', include('accounts.urls')),  # Include the app's URLs
    path('app/project/', include('projects.urls')),
    path('app/insurance/', include('insuranceapp.urls')),
    path('app/queue/', include('queues.urls')),
    path('app/moduleapp/', include('modules.urls')),
    path('app/license/', include('licenses.urls')),
    path('app/record/', include('records.urls')),
    path('app/billing/', include('billing.urls')),
    path('app/trigger/', include('trigger.urls')),
    path("app/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),  # login
    path("app/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path('app/adminapp/', include('adminapp.urls')),
    path('app/agentsapp/',include('agentsapp.urls')),
    path("app/stedi/", include((stedi_urls, "stedi"), namespace="stedi")),
    path("app/api/", include((api_url, "api"), namespace="api")),
    path('app/roi/', include('roi.urls')),  # <-- add your app urls here
    path('app/version/', include('Droidal_version_control.urls')),
    path('app/filemanager/', include('filemanager.urls')),
    path('app/agents/',include('agent_configuration.urls')), # <-- add your app urls here
    path('app/minutes-of-meeting/', include('minutesofmeetings.urls')),
    # In BOTH files (main urls.py and urls_public.py)
    path('app/patient/', include('tenant_app.urls')),
    path('app/meetings/', include('meetings.urls')),
    path('app/telehealth/', include('tenant_telehealth.urls')),
    path('app/encounter/', include('tenant_encounter.urls')),
    path('app/claims/', include('tenant_claim_submission.urls')),
    path('app/clinical-notes/', include('clinical_notes.urls')),
    path('app/practicesettings/', include('practicesettings.urls')),
    # payment
    path('app/payment/',include('payment_posting.urls')),

    # stripe payment
    path("app/payment-process/",include('stripe_payment.urls')),

    # Voice AI
    path("app/voice-ai/",include('voiceAI.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)