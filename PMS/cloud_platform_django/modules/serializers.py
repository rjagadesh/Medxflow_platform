from rest_framework import serializers
from .models import *
from agentsapp.models import AgentTask
from django.db.models import Count, Max
from accounts.serializers import UserSerializer
from modules.models import App


class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = '__all__'
        read_only_fields = ['client']

class AppSerializer(serializers.ModelSerializer):
    module_name = serializers.CharField(source="module.module_name", read_only=True)
    class Meta:
        model = App
        fields = '__all__'
        read_only_fields = ['client']  # prevent client spoofing


class AppWithHideSerializer(serializers.ModelSerializer):
    module_name = serializers.CharField(source="module.module_name", read_only=True)
    is_hide_app = serializers.SerializerMethodField()

    class Meta:
        model = App
    class Meta:
        model = App
        fields = ["id", "app_name", "module", "is_active", "is_system","module_name", "is_hide_app"]
        read_only_fields = ['client']  # prevent client spoofing
        
    def get_is_hide_app(self, obj):
        return bool(getattr(obj, "filtered_hide_app", []))


class SubAgentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sub_apps
        fields = '__all__'

class ColumnSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppsColumnSetting
        fields = "__all__"
        read_only_fields = ['id', 'user']

# class ModuleSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Module
#         fields = ["id", "module_name", "is_system", "client"]

class ModuleSerializer(serializers.ModelSerializer):
    agents_count = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ["id", "module_name", "is_system", "client", "agents_count"]

    def get_agents_count(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return 0

        # Filter apps belonging to this module
        apps_qs = App.objects.filter(module=obj)

        # Restrict to user's client if not a system module
        if not obj.is_system and hasattr(user, "client") and user.client:
            apps_qs = apps_qs.filter(client=user.client)

        if not apps_qs.exists():
            return 0

        # ✅ Fetch all users under this client
        if user.client:
            client_user_ids = list(user.client.users.values_list("id", flat=True))
        else:
            client_user_ids = [user.id]

        # ✅ Get all GeneratedAPIs for those users and apps
        generated_api_qs = GeneratedAPI.objects.filter(apps__in=apps_qs, user__in=client_user_ids)

        if not generated_api_qs.exists():
            return 0

        api_keys = generated_api_qs.values_list("apps__api_key", flat=True).distinct()

        # ✅ Count distinct AgentTasks across all client users
        agents_count = (
            AgentTask.objects.filter(apikey__in=api_keys, user__in=client_user_ids)
            .values("apikey")
            .distinct()
            .count()
        )

        return agents_count
   

class AppAPISerializer(serializers.ModelSerializer):
    task_status = serializers.SerializerMethodField()
    G_api_key = serializers.SerializerMethodField()
    is_hide_app = serializers.SerializerMethodField()

    class Meta:
        model = App
        fields = [
            "id",
            "app_name",
            "is_hide_app",
            "is_system",
            "client",
            "G_api_key",
            "api_key",
            "module",
            "task_status",
        ]

    def get_is_hide_app(self, obj):
        return bool(getattr(obj, "filtered_hide_app", []))

    def get_G_api_key(self, obj):
        """
        Return the GeneratedAPI key(s) for the user's client and app.
        Do NOT create new keys automatically.
        """
        request = self.context.get("request")
        if not request:
            return None

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return None

        # ✅ Handle both system user and client user cases
        if hasattr(user, "client") and user.client:
            client_user_ids = list(user.client.users.values_list("id", flat=True))
        else:
            client_user_ids = [user.id]

        api = (
            GeneratedAPI.objects.filter(user__in=client_user_ids, apps=obj)
            .values_list("api_key", flat=True)
            .first()
        )

        return api or None

    def get_task_status(self, obj):
        request = self.context.get("request", None)
        if not request and hasattr(self, "_context") and "view" in self._context:
            request = getattr(self._context["view"], "request", None)

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return {
                "status": "pending",
                "counts": {},
                "total": 0,
                "last_updated": None,
            }

        # ✅ Handle client users
        if hasattr(user, "client") and user.client:
            client_user_ids = list(user.client.users.values_list("id", flat=True))
        else:
            client_user_ids = [user.id]

        generated_api = GeneratedAPI.objects.filter(user__in=client_user_ids, apps=obj).first()
        stat = "pending"
        if generated_api and generated_api.task_status and generated_api.task_status not in ["pending", ""]:
            stat = generated_api.task_status
        elif generated_api:
            stat = "ready"

        # ✅ Tasks for all users under this client
        tasks = AgentTask.objects.filter(apikey=obj.api_key, user__in=client_user_ids)

        if not tasks.exists():
            return {
                "status": stat,
                "counts": {},
                "total": 0,
                "last_updated": None,
            }

        # ✅ Aggregate task stats
        counts = tasks.values("status").annotate(count=Count("status"))
        counts_dict = {c["status"]: c["count"] for c in counts}

        total_count = tasks.count()
        last_updated = tasks.aggregate(last=Max("status_changed_at"))["last"]

        return {
            "status": stat,
            "counts": counts_dict,
            "total": total_count,
            "last_updated": last_updated,
        }


    
class GeneratedAPISerializer(serializers.ModelSerializer):
    apps_data = AppAPISerializer(read_only=True,source="apps")
    
    class Meta:
        model = GeneratedAPI
        fields = ["id", "api_key", "apps_data", "user", "apps",'max_retries']

class SubAgentsSerializer(serializers.ModelSerializer):
    app_name = serializers.CharField(source="parent_app.app_name", read_only=True)
    class Meta:
        model = Sub_apps
        fields = ["id", "sub_app_name", "parent_app", "app_name"]


class SubAgentAPISerializer(serializers.ModelSerializer):
    sub_app_data = SubAgentsSerializer(read_only=True,source="sub_app")

    class Meta:
        model = Agent_API_SecretKeyss
        fields = ["id", "api_key",'sub_app_data', "sub_app"]


from rest_framework import serializers
from .models import AppsColumnSetting, CustomColumn


class CustomColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomColumn
        fields = "__all__"

# apps/serializers.py
from rest_framework import serializers
from .models import AppsColumnSetting, CustomColumn

class CustomColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomColumn
        fields = "__all__"

class AppsColumnSettingSerializer(serializers.ModelSerializer):
    custom_columns = CustomColumnSerializer(many=True, read_only=True, source="customcolumn_set")
    app_data = AppAPISerializer(read_only=True,source="app_name")
    class Meta:
        model = AppsColumnSetting
        fields = ["id", "app_name", "columns", "user", "custom_columns", "app_data"]


class GeneratedAPIMinimalSerializer(serializers.ModelSerializer):
    app_id = serializers.IntegerField(source="apps.id", read_only=True)
    generated_api_id = serializers.IntegerField(source="id", read_only=True)  # GeneratedAPI.pk
    app_name = serializers.CharField(source="apps.app_name", read_only=True)

    class Meta:
        model = GeneratedAPI
        fields = ["generated_api_id", "app_id", "app_name"]

class AppSerializer_search(serializers.ModelSerializer):
    module_name = serializers.CharField(source="module.module_name", read_only=True)
    class Meta:
        model = App
        fields = ["id", "app_name", "module", "module_name", "is_active", "is_system", "client", "api_key"]

class GeneratedAPIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedAPI
        fields = ["id", "api_key"]

class MaxRetriesUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedAPI
        fields = ["max_retries"]

    def validate_max_retries(self, value):
        if value < 1 or value > 3:
            raise serializers.ValidationError("max_retries must be between 1 and 3.")
        return value
    
class ModulePermissionSerializer(serializers.ModelSerializer):
    user_data = UserSerializer(read_only=True,source="user")
    module_permissions = serializers.JSONField()

    class Meta:
        model = ModulePermission
        fields = ["id", "user", "module_permissions", "created_at", "updated_at", "user_data"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Reuse your enrichment logic for GET responses
        permissions = instance.module_permissions or []
        app_ids = [p.get("module") for p in permissions if p.get("module") and isinstance(p.get("module"), int)]

        apps = {m.id: AppSerializer(m).data for m in App.objects.filter(id__in=app_ids)}

        enriched = []
        for perm in permissions:
            app_id = perm.get("module")
            perm_copy = perm.copy()
            perm_copy["module_data"] = apps.get(app_id, {})
            enriched.append(perm_copy)

        data["module_permissions"] = enriched
        return data

class LogRecordsSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # Returns user.username
 
    class Meta:
        model = LogRecords
        fields = ["id", "user", "log_type", "log_status", "description", "created_at", "updated_at","user_id","client_id"]


# apps/serializers.py
from rest_framework import serializers

class AppHideToggleSerializer(serializers.Serializer):
    app_id = serializers.IntegerField()
    hide = serializers.BooleanField()
