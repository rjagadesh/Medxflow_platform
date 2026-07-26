from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import UserAPIKey

class APIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get("X-API-KEY")

        if not api_key:
            return None  # allow other auth methods if needed

        try:
            key_obj = UserAPIKey.objects.select_related("user").get(
                key=api_key,
                is_active=True
            )
        except UserAPIKey.DoesNotExist:
            raise AuthenticationFailed("Invalid API Key")

        return (key_obj.user, None)
