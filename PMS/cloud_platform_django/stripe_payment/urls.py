from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from django.conf import settings
from django.conf.urls.static import static



urlpatterns = [
    path('collect-payment/', Payment_PostingAPIView.as_view(), name='collect_payment')
]
