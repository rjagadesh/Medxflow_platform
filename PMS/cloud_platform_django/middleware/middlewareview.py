# apps/usage/middleware.py
from django.utils.deprecation import MiddlewareMixin

class ClientIDMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.client_id = request.headers.get("Client-ID", "unknown")
        request.api_key = request.headers.get("API-Key", "unknown")
