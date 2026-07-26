# accounts/middleware.py — FINAL WORKING VERSION
from django.db import connection
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
class TenantFromUserMiddleware(MiddlewareMixin):

    def process_request(self, request):
        # Always start with public schema
        connection.set_schema_to_public()

        # Try to decode JWT before DRF handles authentication
        try:
            user_auth = JWTAuthentication().authenticate(request)
            if user_auth is None:
                return

            user, token = user_auth  # authenticated user
            request.user = user

            client = user.client
            if client and client.schema_name:
                connection.set_tenant(client)
                request.tenant = client
        except Exception:
            pass
