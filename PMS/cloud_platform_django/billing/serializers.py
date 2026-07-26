from rest_framework import serializers
from .models import Billing, PaymentMethod
from agentsapp.models import AgentTask
class BillingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Billing
        fields = '__all__'

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = '__all__'



class AgentTaskSerializer(serializers.ModelSerializer):
    # Get client info from user->client relationship  
    client_name = serializers.CharField(source='user.client.client_name', read_only=True)
    client_id = serializers.CharField(source='user.client.client_id', read_only=True)
    
    # Get app and module info from apikey
    module_name = serializers.CharField(source='apikey.module.module_name', read_only=True)
    app_name = serializers.CharField(source='apikey.app_name', read_only=True)
    # api_key = serializers.CharField(source='apikey.api_key', read_only=True)
    
    # Format dates for graph display
    created_date = serializers.SerializerMethodField()
    created_time = serializers.SerializerMethodField()
    
    # Cost calculation field - this is where the magic happens
    cost = serializers.SerializerMethodField()

    def get_created_date(self, obj):
        return obj.created_at.date().isoformat()

    def get_created_time(self, obj):
        return obj.created_at.time().isoformat()
    
    class Meta:
        model = AgentTask
        fields = [
            'id', 'status', 'created_at', 'status_changed_at',
            'created_date', 'created_time',
            'client_name', 'client_id', 'module_name', 'app_name',
            'cost'  # Include the calculated cost field
        ]

    def get_cost(self, obj):
        license_tier = getattr(obj.user.client, 'license_tier', 'standard') if obj.user and obj.user.client else 'standard'
        
        transaction_counts = self.context.get('transaction_counts', {})
        days_in_month = self.context.get('days_in_month', 30)  # safe fallback
        
        date_key = obj.created_at.date().isoformat()
        txn_count = transaction_counts.get(date_key, 0)

        base_map = {
            "standard": 3500,
            "pro": 10500,
            "enterprise": 22500,
        }
        base_fee = base_map.get(license_tier, 0)
        daily_base = base_fee / days_in_month

        cost = 0
        if license_tier == "standard":
            if txn_count > 50000:
                cost = daily_base + 0.06 * (txn_count - 50000)
            elif txn_count > 25000:
                cost = daily_base + 0.07 * (txn_count - 25000)
            elif txn_count > 0:
                cost = daily_base
        elif license_tier == "pro":
            if txn_count > 250000:
                cost = daily_base + 0.04 * (txn_count - 250000)
            elif txn_count > 70000:
                cost = daily_base + 0.05 * (txn_count - 70000)
            elif txn_count > 0:
                cost = daily_base
        elif license_tier == "enterprise":
            if txn_count > 250000:
                cost = daily_base + 0.04 * (txn_count - 250000)
            elif txn_count > 0:
                cost = daily_base

        return round(cost, 2)


# class AgentTaskSerializer(serializers.ModelSerializer):
#     # Additional fields for graph display
#     client_name = serializers.CharField(source='apikey.client.client_name', read_only=True)
#     client_id = serializers.CharField(source='apikey.client.client_id', read_only=True)
#     module_name = serializers.CharField(source='apikey.module.module_name', read_only=True)
#     app_name = serializers.CharField(source='apikey.app_name', read_only=True)
#     api_key = serializers.CharField(source='apikey.api_key', read_only=True)
    
#     # Format dates for graph consumption
#     created_date = serializers.DateField(source='created_at', read_only=True)
#     created_time = serializers.TimeField(source='created_at', read_only=True)
    
#     class Meta:
#         model = AgentTask
#         fields = [
#             'id', 'status', 'data', 'created_at', 'status_changed_at',
#             'client_name', 'client_id', 'module_name', 'app_name',
#             # 'api_key',
#             'created_date', 'created_time'  # Separate date/time for graph plotting
#         ]

from rest_framework import serializers
from .models import Billing, PaymentMethod, Client
from agentsapp.models import AgentTask
from accounts.models import User
 
class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['client_name', 'license_tier']
 
 
class UserSerializer(serializers.Serializer):
    username = serializers.CharField()

class ClientUsernameSerializer(serializers.ModelSerializer):
    client_id = serializers.SerializerMethodField()
    client_pk_id = serializers.IntegerField(source='client.id', read_only=True)

    class Meta:
        model = User
        fields = ['username', 'client_id', 'id', 'client_pk_id']

    def get_client_id(self, obj):
        return obj.client.client_id if obj.client else None