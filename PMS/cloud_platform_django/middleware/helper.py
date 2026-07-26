# apps/usage/stedi_client.py
import requests
from django.conf import settings
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import ClientApiUsage
from modules.models import Agent_API_SecretKeyss
from accounts.models import Client


class StediClient:
    def __init__(self):
        self.api_key = settings.STEDI_API_KEY

    def request(self, full_url, method, payload=None, api_key=None):
        print(self.api_key)
        if self.api_key == "DUMMY":
            return {"Status":"Please Use Beta"}
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json",
        }
        response = requests.request(method, full_url, headers=headers, json=payload)

        # Ensure apikey is provided
        if not api_key:
            raise ValidationError({"error": "apikey is required"})

        try:
            generated_api = Agent_API_SecretKeyss.objects.select_related("user", "sub_app").get(api_key=api_key)
        except Agent_API_SecretKeyss.DoesNotExist:
            raise ValidationError({"error": "Invalid apikey"})

        # ✅ Check if this user is linked to a valid client with license
        user = generated_api.user
        client = None

        # Case 1: One-to-one link (User → Client)
        if hasattr(user, "client"):
            client = user.client

        # Case 2: Client created_by = user
        if not client:
            client = Client.objects.filter(created_by=user).first()

        # Case 3: M2M relation (user belongs to client)
        if not client:
            client = Client.objects.filter(users=user).first()

        if not client or client.status != "active":  # 👈 adjust license check as per your model
            raise ValidationError({"error": "You don’t have a valid licence"})

        # ✅ Log usage (per day + apikey)
        today = timezone.now().date()
        usage, created = ClientApiUsage.objects.get_or_create(
            apikey=generated_api,
            date=today,
            defaults={"count": 1},
        )
        if not created:
            usage.count = F("count") + 1
            usage.save(update_fields=["count"])

        return response
