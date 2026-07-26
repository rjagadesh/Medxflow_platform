from rest_framework import serializers
from .models import ClientApiUsage, ClientAIUsage


class ClientApiUsageSerializer(serializers.ModelSerializer):
    api_key = serializers.CharField(source="apikey.api_key", read_only=True)

    class Meta:
        model = ClientApiUsage
        fields = [
            "id",
            "api_key",
            "date",
            "count",
        ]

class ClientAIUsageSummarySerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.clientname', read_only=True)

    class Meta:
        model = ClientAIUsage
        fields = ['id', 'client', 'client_name', 'request_type', 'tokens_used', 'cost', 'created_at']