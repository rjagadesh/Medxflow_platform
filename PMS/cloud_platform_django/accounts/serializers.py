from rest_framework import serializers
from .models import User,Client,AppVersion, Role, Module
from modules.models import ModulePermission
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
import django.db.transaction as transaction
from rest_framework.exceptions import ValidationError

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'mobile', 'roles', 'mail',
            'tax_id', 'address', 'contact_name',
            'password', 'username'
        ]

    def validate_username(self, value):
        from accounts.models import Client
        # Case-insensitive check against client_name
        if Client.objects.filter(client_name__iexact=value).exists():
            raise serializers.ValidationError("This username is not allowed (already used as a client name).")
        return value

    def create(self, validated_data):
        from accounts.models import Client  # Import locally to avoid circular import

        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.roles = "client"  # ✅ Ensure role is set
        user.save()

        # ✅ Create associated free-trial client
        now = timezone.now()
        client = Client.objects.create(
            client_name=user.username,   # You can customize this logic
            license_tier="free trail",
            created_date=now,
            end_date=now + timedelta(days=30),
            has_emr_module=True,
            created_by=user  # Self-created
        )

        user.client = client  # Map user to client
        user.save()

        return user

    def to_representation(self, instance):
        refresh = RefreshToken.for_user(instance)
        return {
            'user_id': instance.id,
            'username': instance.username,
            'roles': instance.roles,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }


class LoginSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(first_name=attrs.get('first_name'), password=attrs.get('password'))
        if not user:
            raise serializers.ValidationError("Invalid login credentials.")
        refresh = RefreshToken.for_user(user)
        return {
            'user_id': user.id,
            'first_name': user.first_name,
            'roles': user.roles,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }

default_role_permission = permissions = [
    {
        "feature": "Monitoring Dashboard",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": True,
        "analyst": True,
        "botOperator": True,
        "viewer": True,
    },
    {
        "feature": "Create Custom DEPT/Agents",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": True,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Edit Department",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Agents - Remove/Edit",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Requests Table - View & Export",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": True,
        "analyst": True,
        "botOperator": True,
        "viewer": True,
    },
    {
        "feature": "Requests Table - Edit/Process/Delete",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": True,
        "viewer": False,
    },
    {
        "feature": "Analytics",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": True,
        "analyst": True,
        "botOperator": True,
        "viewer": True,
    },
    {
        "feature": "DroidStudio - Dashboard (View)",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": True,
        "analyst": True,
        "botOperator": True,
        "viewer": True,
    },
    {
        "feature": "Create/Edit Pods",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Create/Edit Machines",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Create/Edit Triggers",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Create/Edit Assets",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Start/Stop Agents",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": True,
        "viewer": False,
    },
    {
        "feature": "View Performance Metrics",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": True,
        "analyst": True,
        "botOperator": True,
        "viewer": True,
    },
    {
        "feature": "ROI – Estimated",
        "owner": True,
        "admin": True,
        "developer": False,
        "projectManager": True,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "ROI – Actual Savings",
        "owner": True,
        "admin": True,
        "developer": False,
        "projectManager": True,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "ROI – Modify Calculation Settings",
        "owner": True,
        "admin": True,
        "developer": False,
        "projectManager": True,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Roles & Users",
        "owner": True,
        "admin": True,
        "developer": False,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Module Permissions",
        "owner": True,
        "admin": True,
        "developer": False,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Column Settings",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": True,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Licensing & Subscription",
        "owner": True,
        "admin": True,
        "developer": False,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Audit Logs (View)",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": True,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Audit Logs (Export/Delete)",
        "owner": True,
        "admin": True,
        "developer": False,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Agent Secret Keys",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "AI API Keys",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Notifications",
        "owner": True,
        "admin": True,
        "developer": False,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Data Settings",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Developer Settings",
        "owner": True,
        "admin": True,
        "developer": True,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Billing View",
        "owner": True,
        "admin": True,
        "developer": False,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
    {
        "feature": "Payment Overview",
        "owner": True,
        "admin": True,
        "developer": False,
        "projectManager": False,
        "analyst": False,
        "botOperator": False,
        "viewer": False,
    },
]

import re
def slugify_feature(feature_name):
    """
    Convert feature name to module_code (e.g., 'Create Custom DEPT/Agents' -> 'create_custom_dept_agents').
    """
    slug = re.sub(r'\W+', '_', feature_name.lower()).strip('_')
    return slug

    
class UserDetailsSerializer(serializers.ModelSerializer):
    license_tier = serializers.SerializerMethodField()
    permission = serializers.SerializerMethodField()
    role_permission = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'mobile', 'mail', 
            'roles', 'client', 'tax_id', 'address', 'contact_name', 
            'is_active', 'license_tier', 'logo', 'permission', 'qr_code', 'mfa_enabled',
            'mfa_secret', 'role_permission'
        ]

    def get_permission(self, obj):
        """
        Returns the module permissions for the user from per-user overrides (ModulePermission model).
        If no overrides, returns empty list.
        """
        if not obj or not obj.is_active:
            return []

        permission = ModulePermission.objects.filter(user_id=obj.id).first()
        if not permission:
            return []  # No overrides: Fall back to role-based elsewhere

        return ModulePermissionSerializer(permission).data.get('module_permissions', [])

    def _build_role_permissions(self, obj):
        """
        Builds role-based permissions list for the user.
        FIXED: For 'client' roles, remap to 'owner' code for Role lookup (inherits owner permissions).
        Handles role matching, superuser full access, and fallback for missing Modules.
        """
        if not obj or not obj.is_active:
            return []

        # For superusers: Full access to all active modules
        if obj.is_superuser:
            permissions_list = []
            all_modules = Module.objects.filter(is_active=True)
            for module in all_modules:
                permissions_list.append({
                    "module_code": module.code,
                    "module_name": module.name,
                    "category": module.category,
                    "permissions": {
                        "view": True, "create": True, "edit": True, "delete": True, "export": True
                    }
                })
            return permissions_list

        if not obj.client:
            return []

        # FIXED: Map 'client' to 'owner' for Role query; otherwise use obj.roles
        role_code = 'owner' if obj.roles == 'client' else obj.roles
        print("test01")
        try:
            matched_role = Role.objects.filter(
                code=role_code,  # Uses 'owner' if client
                client=obj.client,
                is_active=True
            ).first() or Role.objects.filter(
                code=role_code,
                client__isnull=True,
                is_system_role=True,
                is_active=True
            ).first()
        except Role.DoesNotExist:
            print("test02")

            return []

        if not matched_role:
            result = []
            for feature in default_role_permission:
                result.append({
                    "module_code": slugify_feature(feature["feature"]),
                    "module_name": feature["feature"],
                    "permissions": {
                        "view": True,
                        "create": True,
                        "edit": True,
                        "delete": True,
                        "export": True,
                    } if feature.get("owner" if obj.roles == "client" else obj.roles) else {
                        "view": False,
                        "create": False,
                        "edit": False,
                        "delete": False,
                        "export": False,
                    },
                })
            return result

        role_perms = matched_role.permissions or {}
        permissions_list = []
        
        for module_code in role_perms.keys():
            module_perms = role_perms[module_code]
            try:
                module = Module.objects.get(code=module_code, is_active=True)
                permissions_list.append({
                    "module_code": module.code,
                    "module_name": module.name,
                    "category": module.category,
                    "permissions": module_perms
                })
            except Module.DoesNotExist:
                print("runningDoesNotExist")
                # Fallback: Don't skip; use code as name (title-cased) and unknown category
                module_name = module_code.replace('_', ' ').title()
                permissions_list.append({
                    "module_code": module_code,
                    "module_name": module_name,
                    "category": "unknown",
                    "permissions": module_perms
                })
        
        return permissions_list

    def get_role_permission(self, obj):
        request = self.context.get('request')
        print(f"Request121212: {request.user,request and request.user != obj}")
        if request and request.user != obj:
            print("User does not match request user")
            return []

        return self._build_role_permissions(obj)

    def get_license_tier(self, obj):
        """
        Returns the license tier only if the user's roles is 'client'.
        """
        if obj.roles == 'client':
            if obj.client:
                return obj.client.license_tier
            return None
        return None

    def get_logo(self, obj):
        """
        Returns the full URL for the logo field.
        """
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None

    def get_mfa_secret(self, obj):
        """
        Only expose mfa_secret if the user is the requester (security).
        """
        request = self.context.get('request')
        if request and request.user == obj:
            return obj.mfa_secret
        return None

class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "username", "password", "first_name", "last_name",
            "mobile", "mail", "roles"  # 'roles' is the input string (e.g., "admin")
        ]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)

        # Get client from context (passed from view)
        client = self.context["request"].user.client
        if not client:
            raise ValidationError("No client associated with the requesting user.")
        user.client = client

        # FIXED: Set the role FK based on 'roles' string (e.g., "admin" -> Role with code="admin")
        role_code = validated_data.get('roles')  # e.g., "admin", "viewer"
        if not role_code:
            raise ValidationError("Role must be specified.")

        # Find or create Role for this client and role_code
        role = self.get_or_create_role(client, role_code)

        # Set both fields: FK to Role instance and CharField for legacy/consistency
        user.role = role
        user.roles = role_code  # Mirror the input to the CharField

        with transaction.atomic():
            user.save()
        return user

    def get_or_create_role(self, client, role_code):
        """
        Find existing active Role for client and code, or create from system template.
        """
        # Try to find existing role for this client
        role = Role.objects.filter(
            client=client,
            code=role_code,
            is_active=True
        ).first()

        if role:
            return role

        # If not found, create from system template (or empty if no template)
        system_role = Role.objects.filter(
            client__isnull=True,
            code=role_code,
            is_system_role=True
        ).first()

        if not system_role:
            # No system template: Create basic empty role
            system_role = Role(
                name=f"{role_code.replace('_', ' ').title()} Role",
                code=role_code,
                description=f"Default permissions for {role_code} users",
                permissions={},  # Empty permissions
                is_system_role=False
            )

        # Create client-specific role
        role = Role.objects.create(
            name=f"{role_code.replace('_', ' ').title()} Role",
            code=role_code,
            description=f"Permissions for {role_code} users",
            client=client,
            permissions=dict(system_role.permissions) if hasattr(system_role, 'permissions') else {},  # Deep copy
            is_active=True
        )

        return role
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "last_name",
            "mobile", "mail", "roles", "client"
        ]
        read_only_fields = ["client"]
    
# class UserSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(write_only=True)  # Password is write-only

#     class Meta:
#         model = User
#         fields = ['first_name', 'last_name', 'mobile', 'mail', 'roles', 'password', 'tax_id', 'address', 'contact_name','username']
    
#     def validate(self, data):
#         if User.objects.filter(username=data['username']).exists():
#             raise serializers.ValidationError({"username": "Username already exists"})
#         return data
    
#     def create(self, validated_data):
#         password = validated_data.pop('password')
#         validated_data['password'] = make_password(password)  # Hash the password
#         return super().create(validated_data)
    
class ClientSerializer(serializers.ModelSerializer):
    tier_cost = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    # client_name = serializers.CharField(source='client_name.first_name')
    additional_cost = serializers.JSONField(
        required=False,
        default=dict,
        help_text="JSON object for discounts (discount_1, discount_2, discount_3)"
    )
    class Meta:
        model = Client
        fields = [
            'id', 
            'client_id', 
            'client_name', 
            'license_tier', 
            "tier_cost",
            'dev_count', 
            'prod_count', 
            'vm_count',
            'license_key', 
            'created_date', 
            'end_date', 
            'effective_date',
            'machine_ip', 
            'status', 
            'additional_cost'
        ]
    def get_additional_cost(self, obj):
        """
        Return the additional_cost JSON directly from the model.
        If it's missing, return a default dict.
        """
        return obj.additional_cost or {
            "discount_1": obj.discount_1,
            "discount_2": obj.discount_2,
            "discount_3": obj.discount_3,
        }
        
class AppVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppVersion
        fields = ["app_name", "version"]


class ClientgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ("license_key", "client_id", "created_at", "created_by")


class UsergetSerializer(serializers.ModelSerializer):
    client = ClientgetSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        source="client",
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = User
        fields = "__all__"

class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "mail"]


class ClientRegisterSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True, required=True, help_text="User ID to map to this client")
    
    additional_cost = serializers.JSONField(
        required=False,
        default=dict,
        help_text="JSON object for discounts (discount_1, discount_2, discount_3)"
    )

    client_vm_cost = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False, 
        allow_null=True,
        default=None,
        help_text="Custom cost for Client VM licenses. Null means use SOP pricing."
    )
    
    cost_of_vm = serializers.ChoiceField(
        choices=['actual', 'sop'],
        required=False,
        default='sop',
        help_text="Cost type for VM licenses: 'actual' for custom cost, 'sop' for standard pricing"
    )
    
    class Meta:
        model = Client
        fields = [
            "client_name",
            "license_tier",
            "tier_cost",  
            "dev_count",
            "prod_count",
            "vm_count",
            "client_vm_count",
            "client_vm_cost",
            "cost_of_vm",
            "created_date",
            "end_date",
            "effective_date",
            "machine_ip",
            "user_id",
            "additional_cost",
        ]
        read_only_fields = ["client_id", "license_key", "status", "created_by"]
        extra_kwargs = {
            'client_name': {'validators': []},
        }

    def validate(self, data):
        """
        Validate cost logic:
        - If cost_of_vm is 'actual' and client_vm_count > 0, set client_vm_cost = 300.00
        - If cost_of_vm is 'sop' and client_vm_count > 0, set client_vm_cost = 0.00
        - If client_vm_count = 0, set client_vm_cost = None
        """
        cost_of_vm = data.get('cost_of_vm', 'sop')
        client_vm_count = data.get('client_vm_count', 0)
        
        if client_vm_count > 0:
            if cost_of_vm == 'actual':
                # For actual cost, set client_vm_cost to 300.00
                data['client_vm_cost'] = 300.00
            elif cost_of_vm == 'sop':
                # For SOP cost, set client_vm_cost to 0.00
                data['client_vm_cost'] = 0.00
        else:
            # If no client VM licenses, set cost to None
            data['client_vm_cost'] = None
        
        return data

    def validate_client_name(self, value):
        user_id = self.initial_data.get('user_id')
        if user_id:
            try:
                user_to_map = User.objects.get(id=user_id)
                if hasattr(user_to_map, 'client') and user_to_map.client is not None:
                    existing_client = user_to_map.client
                    if Client.objects.filter(client_name=value).exclude(id=existing_client.id).exists():
                        raise serializers.ValidationError("Client with this name already exists.")
                else:
                    if Client.objects.filter(client_name=value).exists():
                        raise serializers.ValidationError("Client with this name already exists.")
            except User.DoesNotExist:
                pass
        return value

    def create(self, validated_data):
        print("DEBUG validated_data:", validated_data)
        request_user = self.context['request'].user
        
        if request_user.roles != "admin":
            raise serializers.ValidationError({"detail": "Only admin can create a client."})

        user_id = validated_data.pop("user_id")
        
        try:
            user_to_map = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user_id": "User not found."})

        if user_to_map.roles not in ["default_user", "client", "user"]:
            raise serializers.ValidationError({"user_id": "Only users with role 'default_user', 'client', or 'user' can be mapped."})

        if hasattr(user_to_map, 'client') and user_to_map.client is not None:
            return self._update_existing_client(user_to_map.client, validated_data)
        else:
            return self._create_new_client(user_to_map, validated_data, request_user)

    def _update_existing_client(self, existing_client, validated_data):
        """Update existing client with new data"""
        for field, value in validated_data.items():
            setattr(existing_client, field, value)
        
        existing_client.save()
        return existing_client

    def _create_new_client(self, user_to_map, validated_data, request_user):
        """Create new client and map user"""
        if user_to_map.roles in ["default_user", "user"]:
            user_to_map.roles = "client"
            user_to_map.save()

        client = Client.objects.create(created_by=request_user, **validated_data)
        user_to_map.client = client
        user_to_map.save()
        return client
    

class ClientUserCreateSerializer(serializers.Serializer):
    # Client fields
    client_name = serializers.CharField()
    additional_cost = serializers.JSONField(
        required=False,
        default=dict,
        help_text="JSON object for discounts (discount_1, discount_2, discount_3)"
    )
    license_tier = serializers.ChoiceField(choices=[
        ("standard","STANDARD"),
        ("pro","PRO"),
        ("enterprise","ENTERPRISE"),
        ("lite", "LITE"),
        ("free trail", "FREE TRAIL")
    ])
    dev_count = serializers.IntegerField(default=0)
    prod_count = serializers.IntegerField(default=0)
    vm_count = serializers.IntegerField(default=0)
    client_vm_count = serializers.IntegerField(default=0)
    client_vm_cost = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False, 
        allow_null=True,
        default=None,
        help_text="Custom cost for Client VM licenses. Null means use SOP pricing."
    )
    cost_of_vm = serializers.ChoiceField(
        choices=['actual', 'sop'],
        required=False,
        default='sop',
        help_text="Cost type for VM licenses: 'actual' for custom cost, 'sop' for standard pricing"
    )
    machine_ip = serializers.CharField(required=False, allow_blank=True)
    created_date = serializers.DateTimeField(required=False, allow_null=True)
    end_date = serializers.DateTimeField(required=False, allow_null=True)
    effective_date = serializers.DateTimeField(required=False, allow_null=True)
    tier_cost = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False, 
        allow_null=True
    )

    # User fields
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    mail = serializers.EmailField()
    mobile = serializers.CharField()
    roles = serializers.ChoiceField(choices=[("client","Client"),("user","User")], default="client")
    client_id = serializers.CharField(required=False, help_text="Required if user role is 'user'")

    def validate(self, data):
        """
        Validate cost logic:
        - If cost_of_vm is 'actual' and client_vm_count > 0, set client_vm_cost = 300.00
        - If cost_of_vm is 'sop' and client_vm_count > 0, set client_vm_cost = 0.00
        - If client_vm_count = 0, set client_vm_cost = None
        """
        cost_of_vm = data.get('cost_of_vm', 'sop')
        client_vm_count = data.get('client_vm_count', 0)
        
        if client_vm_count > 0:
            if cost_of_vm == 'actual':
                # For actual cost, set client_vm_cost to 300.00
                data['client_vm_cost'] = 300.00
            elif cost_of_vm == 'sop':
                # For SOP cost, set client_vm_cost to 0.00
                data['client_vm_cost'] = 0.00
        else:
            # If no client VM licenses, set cost to None
            data['client_vm_cost'] = None
        
        return data

    def validate_client_name(self, value):
        if Client.objects.filter(client_name=value).exists():
            raise serializers.ValidationError("Client name must be unique.")
        return value

    def create(self, validated_data):
        request_user = self.context.get('request').user
        if not request_user or request_user.roles != "admin":
            raise serializers.ValidationError({"detail": "Only admin can create a client and user."})

        user_data = {
            "username": validated_data.pop("username"),
            "password": validated_data.pop("password"),
            "first_name": validated_data.pop("first_name"),
            "last_name": validated_data.pop("last_name"),
            "mail": validated_data.pop("mail"),
            "mobile": validated_data.pop("mobile"),
            "roles": validated_data.pop("roles", "client")
        }

        role = user_data["roles"]

        if role == "user":
            client_id_input = validated_data.get("client_id")
            if not client_id_input:
                raise serializers.ValidationError({"client_id": "Client ID is required when role is 'user'."})
            try:
                client = Client.objects.get(client_id=client_id_input)
            except Client.DoesNotExist:
                raise serializers.ValidationError({"client_id": "Client does not exist."})
        else:
            if "additional_cost" not in validated_data:
                validated_data["additional_cost"] = {
                    "discount_1": None,
                    "discount_2": None,
                    "discount_3": None
                }

            if "vm_count" not in validated_data:
                validated_data["vm_count"] = 0
            if "effective_date" not in validated_data:
                validated_data["effective_date"] = timezone.now()

            # Create the client
            client = Client.objects.create(
                created_by=request_user,
                **validated_data
            )

        user = User.objects.create(
            client=client,
            **{k:v for k,v in user_data.items() if k != "password"}
        )
        user.set_password(user_data["password"])
        user.save()

        return {"client": client, "user": user}
    
class LicenseUsersDetailsSerializer(serializers.ModelSerializer):
    voice_ai_license = serializers.SerializerMethodField()
    client = ClientSerializer(read_only=True)

    def get_voice_ai_license(self, obj):
        if obj.client:
            return obj.client.voice_ai_license
        return False
    class Meta:
        model = User
        fields = ["id", 'first_name', 'last_name', 'mail', 'password', 'username', 'client', 'voice_ai_license']



class LicenseValidationSerializer(serializers.Serializer):
    license_key = serializers.CharField()
    user_id = serializers.IntegerField()
    machine_ip = serializers.CharField()

    def validate(self, data):
        license_key = data["license_key"]
        user_id = data["user_id"]

        # check user
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user_id": "Invalid user ID"})

        # check client
        try:
            client = Client.objects.get(license_key=license_key)
        except Client.DoesNotExist:
            raise serializers.ValidationError({"license_key": "Invalid license key"})

        # verify user belongs to same client
        if user.client_id != client.id:
            raise serializers.ValidationError({"detail": "User does not belong to this client"})

        data["client"] = client
        data["user"] = user
        return data

    def save(self, **kwargs):
        client = self.validated_data["client"]
        machine_ip = self.validated_data["machine_ip"]

        # update machine_ip
        client.machine_ip = machine_ip
        client.save(update_fields=["machine_ip"])
        return client
class UserFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "mail", "mobile", "logo"]

    def validate_username(self, value):
        user = self.instance  # current user being updated
        if User.objects.filter(username=value).exclude(pk=user.pk if user else None).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_mail(self, value):
        user = self.instance  # current user being updated
        if User.objects.filter(mail=value).exclude(pk=user.pk if user else None).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo:
            request = self.context.get("request")
            if request:
                url = request.build_absolute_uri(instance.logo.url)
            else:
                url = f"{settings.MEDIA_URL}{instance.logo.name}"
            if not url.endswith("/"):
                url += "/"
            data["logo"] = url
        else:
            data["logo"] = None
        return data
    
class ClientLicenseOverviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'license_tier',
            'dev_count',
            'prod_count',
            'created_date',
            'end_date',
            'client_name',
            'client_id',
            'status',
        ]
       
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if representation['created_date']:
            representation['created_date'] = instance.created_date.isoformat()
        if representation['end_date']:
            representation['end_date'] = instance.end_date.isoformat()
        return representation
    
class ModulePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModulePermission
        fields = ["id", "user", "module_permissions", "created_at", "updated_at"]


class PermissionsRowSerializer(serializers.Serializer):
    feature = serializers.CharField(max_length=255)
    owner = serializers.BooleanField()
    admin = serializers.BooleanField()
    developer = serializers.BooleanField()
    projectManager = serializers.BooleanField()
    analyst = serializers.BooleanField()
    botOperator = serializers.BooleanField()
    viewer = serializers.BooleanField()

class PermissionsUpdateSerializer(serializers.Serializer):
    permissions = serializers.ListField(
        child=PermissionsRowSerializer(),
        min_length=1,
        help_text="List of features with boolean access per role"
    )

    def validate_permissions(self, value):
        # Ensure all rows have the same roles structure if needed
        if not value:
            raise serializers.ValidationError("Permissions list cannot be empty.")
        return value


from .models import SummaryReportAlert, InvoiceAlert, Client

class SummaryReportAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = SummaryReportAlert
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "client"]

    def validate_emails(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Emails must be a list of strings")
        for e in value:
            if not isinstance(e, str) or "@" not in e:
                raise serializers.ValidationError(f"Invalid email: {e}")
        return value


class InvoiceAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceAlert
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "client"]

    def validate_emails(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Emails must be a list of strings")
        for e in value:
            if not isinstance(e, str) or "@" not in e:
                raise serializers.ValidationError(f"Invalid email: {e}")
        return value
