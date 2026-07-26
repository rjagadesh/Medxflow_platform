from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, FAQViewSet, stream_faq_video

router = DefaultRouter()
router.register(r'documents', DocumentViewSet)
router.register(r'faqs', FAQViewSet, basename='faq')


urlpatterns = [
    path('', include(router.urls)),
    path('faq/<int:pk>/video/', stream_faq_video, name='faq_video')
]
