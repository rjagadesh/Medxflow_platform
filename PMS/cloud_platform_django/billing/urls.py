from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'billings', BillingViewSet)
router.register(r'payment-methods', PaymentMethodViewSet) 

urlpatterns = [
    path('', include(router.urls)),
    path('agent-tasks/', ClientAgentTasksAPIView.as_view(), name='client-agent-tasks'),
    path('generate-invoice/', GenerateInvoiceView.as_view(), name='generate-invoice'),
    path('agents/', AgentNamesAPIView.as_view(), name='agent-names'),  
    path("create-checkout-session/", CreateCheckoutSessionView.as_view(), name="create_checkout_session"),
    path("webhook/", StripeWebhookView.as_view(), name="stripe_webhook"),
    path("transactions/", TransactionHistoryView.as_view(), name="transaction_history"),
    path('clients/', ClientListAPIView.as_view(), name='client-list'),
    path('users-apikeys/', UserWithApiKeyListAPIView.as_view(), name='users-apikeys'),
    path('client-users/', ClientUsersListAPIView.as_view(), name='client-users'),
    path('get-overall/billing/', ClientBillingDataAPIView.as_view(), name='overall-billing-info'),
    path('get-invoice-preview/', GenerateInvoicePreviewView.as_view(), name='get-invoice-preview'),
    path('update-invoice-preview/', UpdateClientPricesView.as_view(), name='get-invoice-preview'),
 
]
