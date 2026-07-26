"""
Django settings for cloudproject project – FINAL WORKING VERSION FOR django-tenants
"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

STEDI_API_KEY = os.getenv("STEDI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_ACCOUNT_ID = os.getenv('AWS_ACCOUNT_ID')
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = os.getenv("DEBUG") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

# Behind the nginx TLS reverse proxy (pms.droidal.ai). Let Django know requests
# forwarded with X-Forwarded-Proto: https are secure, and trust the domain for CSRF.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
CSRF_TRUSTED_ORIGINS = [
    o for o in os.getenv("CSRF_TRUSTED_ORIGINS", "https://pms.droidal.ai").split(",") if o
]

# ──────────────────────────────────────────────────────────────
#  MULTI-TENANT CONFIGURATION – CORRECT & FINAL (2025)
# ──────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name} : {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',   # 🔥 THIS IS THE KEY
    },
}

INSTALLED_APPS = []  # we rebuild it below

SHARED_APPS = [
    'daphne',
    'django_tenants',                          # MUST BE FIRST
    'accounts',                                # ← your tenant model lives here
    'projects',
    'queues',
    'modules',
    'licenses',
    'records',
    'billing',
    'trigger',
    'insuranceapp',
    'agentsapp',
    'middleware',
    'roi',
    'Droidal_version_control',
    'filemanager',
    'agent_configuration',
    'minutesofmeetings',
    'adminapp',                               # if you have one

    # Django core apps that must be shared
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',              # ONLY HERE – NEVER in TENANT_APPS
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party shared
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'drf_spectacular_sidecar',
    'django_filters',
    'meetings',
    'voiceAI'
]

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}
ASGI_APPLICATION = 'cloudproject.asgi.application'
TENANT_APPS = [
    # DO NOT put django.contrib.contenttypes here
    'tenant_app',                                 # ← your EMR/PHR app (isolated)
    'tenant_encounter',
    'tenant_telehealth',
    'tenant_claim_submission',
    'clinical_notes',
    'practicesettings',
    'payment_posting',
    'stripe_payment',
    # add more PHI apps later: 'ems', 'phr', 'patients_details', etc.
]

# Final list
INSTALLED_APPS = SHARED_APPS + TENANT_APPS

# ────────────────────── REQUIRED TENANT SETTINGS ──────────────────────
TENANT_MODEL = "accounts.Client"
TENANT_DOMAIN_MODEL = None                    # ← THIS DISABLES DOMAIN LOOKUP

# Remove any PathTenantMiddleware — you don't want it
# Remove this line completely – it does nothing in django-tenants
# TENANT_SUBFOLDER_PREFIX = "tenants"

PUBLIC_SCHEMA_URLCONF = 'cloudproject.urls_public'   # optional but nice

# ────────────────────── DATABASE & ROUTER ──────────────────────

DATABASE_ROUTERS = ('django_tenants.routers.TenantSyncRouter',)


# ────────────────────── REST OF YOUR SETTINGS (unchanged) ──────────────────────
ROOT_URLCONF = 'cloudproject.urls'

AUTH_USER_MODEL = 'accounts.User'

# ... all your JWT, CORS, Stripe, etc. settings stay exactly the same ...
# (no need to touch anything below this line)

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.TokenAuthentication',
        'tenant_telehealth.auth_utils.GuestTokenAuthentication',
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",  # 👈 this gives you the UI
    ),
}


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer', 'Token'),  # Support both Bearer and Token
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}


MIDDLEWARE = [
    'accounts.middleware.TenantFromUserMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'accounts.middleware.TenantFromUserMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    "middleware.middlewareview.ClientIDMiddleware",
    # MUST BE ABSOLUTELY LAST
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cloudproject.wsgi.application'
WEBSOCKET_HOST = os.environ.get('WEBSOCKET_HOST', 'localhost:8000')
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173", "https://droidal.ai"
]
CHIME_RECORDINGS_BUCKET = 'droidal-prod-chime-recordings'
# USE_MOCK_TRANSCRIPTION = True
CHIME_MEETING_FEATURES = {
    'Audio': {
        'EchoReduction': 'AVAILABLE'
    },
    'Video': {
        'MaxResolution': 'HD'  # Options: None, HD, FHD
    },
    'Content': {
        'MaxResolution': 'FHD'  # For screen sharing
    }
}

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_HEADERS = ["*"] # to allow X-API-KEY header

# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases



DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': os.getenv("DATABASE_NAME"),
        'USER': os.getenv("DATABASE_USER"),
        'PASSWORD': os.getenv("DATABASE_PASSWORD"),
        'HOST': os.getenv("DATABASE_HOST"),
        'PORT': os.getenv("DATABASE_PORT"),
    }
}

DATABASE_ROUTERS = ('django_tenants.routers.TenantSyncRouter',)
DATA_UPLOAD_MAX_MEMORY_SIZE = 1073741824   # 100 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 1073741824   # 100 MB
# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

EMAIL_BACKEND = os.getenv("EMAIL_BACKEND")
EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = os.getenv("EMAIL_PORT")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS")
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', 30))

SPECTACULAR_SETTINGS = {
    "TITLE": "My Project API",
    "DESCRIPTION": "API documentation for Users, Clients, Modules, Apps, and Billing",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://dev-cloud.droidal.com")

DROID_METRIX_API_URL = "http://droidmetrix.droidal.com/get_client_trans_count"
HEADERS_BASE = os.getenv("DROID_METRIX_BASIC_AUTH", "")



# Celery Configuration
CELERY_BROKER_URL = 'redis://localhost:6379/0'  # Use Redis as message broker
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_ENABLE_UTC = True

# twilio Configuration

TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
STEDI_API_KEY = os.getenv("STEDI_API_KEY")
TWILIO_SIP_USERNAME=os.getenv("TWILIO_SIP_USERNAME")      # droidaltrunk
TWILIO_SIP_PASSWORD=os.getenv("TWILIO_SIP_PASSWORD")      # Welcome@12345
TWILIO_ELASTIC_TRUNK_SID=os.getenv("TWILIO_ELASTIC_TRUNK_SID") # TKxxx... from Twilio console
LIVEKIT_SIP_INBOUND_TRUNK_ID=os.getenv("LIVEKIT_SIP_INBOUND_TRUNK_ID") # TKxxx... from Twilio console
LIVEKIT_SIP_DOMAIN=os.getenv("LIVEKIT_SIP_DOMAIN")       # abc123.sip.livekit.cloud
LIVEKIT_URL=os.getenv("LIVEKIT_URL")
LIVEKIT_API_URL=os.getenv("LIVEKIT_API_URL")
LIVEKIT_API_KEY=os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET=os.getenv("LIVEKIT_API_SECRET")
AWS_S3_REGION_NAME=os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID=os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_ACCOUNT_ID=os.getenv("AWS_ACCOUNT_ID")
AWS_STORAGE_BUCKET_NAME=os.getenv("S3_BUCKET_NAME")
BASE_URL = "https://dev-cloud.droidal.com"   # no trailing slash