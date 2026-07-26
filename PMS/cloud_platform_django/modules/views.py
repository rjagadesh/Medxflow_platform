from rest_framework import viewsets
from rest_framework import generics, permissions
from .models import *
from .serializers import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError  # ✅ for API-friendly errors
from django.db.models import Q
from django.http import JsonResponse
from rest_framework import status
from .serializers import CustomColumnSerializer
from agentsapp.models import AgentTask
from rest_framework.generics import RetrieveAPIView
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
import json


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        client = getattr(self.request.user, "client", None)
        if not client:
            raise ValidationError("This user does not belong to a client")

        module = serializer.save(client=client)
 
        # Log creation in LogRecords
        LogRecords.objects.create(
            user=self.request.user,
            log_type="modules",
            log_status="success",
            description=f"User {self.request.user.username} created module '{module.module_name}' with ID {module.id}"
        )

    def get_queryset(self):
        """Restrict list to modules this user can access"""
        qs = super().get_queryset()
        client = getattr(self.request.user, "client", None)

        if self.request.user.is_authenticated:
            if client:
                return qs.filter(Q(is_system=True) | Q(client=client))
            else:
                return qs.filter(is_system=True)  # fallback: only system-wide
        return qs.none()

class AppViewSet(viewsets.ModelViewSet):
    queryset = App.objects.all()
    serializer_class = AppSerializer
    permission_classes = [IsAuthenticated]  # only logged-in users

    def perform_create(self, serializer):
        # get client from request.user
        client = getattr(self.request.user, "client", None)
        if not client:
            raise ValidationError("This user does not belong to a client")

        # save app with client attached
        app = serializer.save(client=client)
 
        # log creation in LogRecords
        LogRecords.objects.create(
            user=self.request.user,
            log_type="agent",  # as per your requirement
            log_status="success",
            description=f"User {self.request.user.username} created app '{app.app_name}' with ID {app.id}"
        )
        
    def get_queryset(self):
        qs = super().get_queryset()
        client = getattr(self.request.user, "client", None)

        if self.request.user.is_authenticated:
            if client:
                return qs.filter(Q(is_system=True) | Q(client=client, is_system=False)).distinct()
            else:
                return qs.filter(is_system=True)  # fallback: only system-wide
        return qs.none()
    


class GeneratedAPIViewSet(viewsets.ModelViewSet):
    """Create & get generated APIs"""
    queryset = GeneratedAPI.objects.all()
    serializer_class = GeneratedAPISerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_authenticated:
            raise ValidationError({"user": "User is not authenticated."})

        # You can get max_retries from request data or set a default value
        max_retries = self.request.data.get("max_retries", 1)
        try:
            max_retries = int(max_retries)
        except ValueError:
            max_retries = 1

        generated_api = serializer.save(user=user, max_retries=max_retries)
 
        # ✅ Log the creation in LogRecords
        LogRecords.objects.create(
            user=user,
            log_type="api_key",
            log_status="success",
            description=f"User {user.username} generated a new API key: {generated_api.api_key}",
        )

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "client") and user.client:
            client_user_ids = list(user.client.users.values_list("id", flat=True))
        else:
            client_user_ids = [user.id]
        return GeneratedAPI.objects.filter(user__in=client_user_ids)


class ColumnSettingUpsertViewSet(viewsets.ModelViewSet):
    serializer_class = ColumnSettingSerializer
    queryset = AppsColumnSetting.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "client") and user.client:
            client_user_ids = list(user.client.users.values_list("id", flat=True))
        else:
            client_user_ids = [user.id]
        queryset = AppsColumnSetting.objects.filter(user__in=client_user_ids)
        app_name = self.request.query_params.get("app_name")
        if app_name:
            queryset = queryset.filter(app_name=app_name)
        return queryset

    def create(self, request, *args, **kwargs):
        user = request.user
        app_name = request.data.get("app_name")
        if not app_name:
            raise ValidationError({"app_name": "This field is required."})

        instance = AppsColumnSetting.objects.filter(user=user, app_name=app_name).first()

        serializer = self.get_serializer(instance, data=request.data, partial=bool(instance))
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK if instance else status.HTTP_201_CREATED
        )

    def perform_update(self, serializer):
        """
        Make sure PUT/PATCH does not break unique constraint
        """
        user = self.request.user
        app_name = serializer.validated_data.get("app_name")
        if app_name:
            conflict = AppsColumnSetting.objects.filter(user=user, app_name=app_name)\
                .exclude(pk=self.get_object().pk)\
                .first()
            if conflict:
                raise ValidationError({"app_name": "Column settings for this app already exist."})
        serializer.save(user=user)


class ModuleListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, "client") or user.client is None:
            return Response({"error": "User has no client assigned"}, status=400)

        is_system = request.query_params.get("is_system", None)

        queryset = Module.objects.all()

        if is_system is not None:
            if is_system.lower() == "true":
                queryset = queryset.filter(is_system=True)
            elif is_system.lower() == "false":
                # Instead of client_id param, use user's client
                queryset = queryset.filter(is_system=False, client=user.client)
            else:
                return Response({"error": "is_system must be 'true' or 'false'"}, status=400)
        else:
            # Return system modules or modules for user's client
            queryset = queryset.filter(Q(is_system=True) | Q(client=user.client)).distinct().order_by('id')

        serializer = ModuleSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=200)
    
class AppListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_system = request.query_params.get("is_system", None)
        module_id = request.query_params.get("module_id", None)

        client = getattr(request.user, "client", None)
        if not client:
            return Response(
                {"error": "No client associated with this user"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hide_app_prefetch = Prefetch(
            "hide_app",
            queryset=Client.objects.filter(pk=client.id),
            to_attr="filtered_hide_app"
        )

        queryset = App.objects.all().select_related("module").prefetch_related(hide_app_prefetch)

        if is_system is not None:
            if is_system.lower() == "true":
                queryset = queryset.filter(is_system=True, module__id=module_id)
            elif is_system.lower() == "false":
                queryset = queryset.filter(is_system=False, client=client, module__id=module_id)
            else:
                return Response(
                    {"error": "is_system must be 'true' or 'false'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # both system + client apps for this user
            queryset = queryset.filter(
                module__id=module_id
            ).filter(
                Q(is_system=True) | Q(client=client, is_system=False)
            ).distinct()

        serializer = AppAPISerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SubAgentsViewSet(viewsets.ModelViewSet):
    queryset = Sub_apps.objects.all()
    serializer_class = SubAgentsSerializer


class Sub_Agent_APIViewSet(viewsets.ModelViewSet):
    queryset = Agent_API_SecretKeyss.objects.all()
    serializer_class = SubAgentAPISerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_authenticated:
            raise ValidationError({"user": "User is not authenticated."})
        serializer.save(user=user)

    def get_queryset(self):
        user = self.request.user
        return Agent_API_SecretKeyss.objects.filter(user=user)

class SubAgentListAPIView(APIView):
    def get(self, request):
        app_id = request.query_params.get("app_id", None)
        subApps = Sub_apps.objects.filter(parent_app=app_id)
 
        serializer = SubAgentsSerializer(subApps, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class GetApiKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user  # extracted from access token
        agent_id = request.query_params.get("agent_id")

        if not agent_id:
            return Response({"error": "agent_id is required"}, status=400)
        
        if hasattr(user, "client") and user.client:
            client_user_ids = list(user.client.users.values_list("id", flat=True))
        else:
            client_user_ids = [user.id]

        try:
            app = App.objects.get(id=agent_id)  # ✅ correct field
            generated_api = GeneratedAPI.objects.get(user__in=client_user_ids, apps=app)
        except App.DoesNotExist:
            return Response({"error": "App not found"}, status=404)
        except GeneratedAPI.DoesNotExist:
            return Response({"error": "API key not found"}, status=404)

        return Response({"api_key": generated_api.api_key})
    
    
class CustomColumnViewSet(viewsets.ModelViewSet):
    queryset = CustomColumn.objects.all()
    serializer_class = CustomColumnSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_authenticated:
            raise ValidationError({"user": "User is not authenticated."})
        app_column_settings = serializer.validated_data.get("app_column_settings")
        if hasattr(user, "client") and user.client:
            client_user_ids = list(user.client.users.values_list("id", flat=True))
        else:
            client_user_ids = [user.id]
        # check if record already exists
        instance = CustomColumn.objects.filter(
            user=user,
            app_column_settings=app_column_settings
        ).first()

        if instance:
            # Update existing record
            serializer.update(instance, serializer.validated_data)
        else:
            # Create new record
            serializer.save(user=user)

    
    



from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# apps/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import AppsColumnSetting, CustomColumn
from .serializers import AppsColumnSettingSerializer

@api_view(['GET'])
def get_app_columns(request):
    app_name = request.GET.get('app_name')
    user = request.user

    if not app_name:
        return Response({'error': 'app_name is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if hasattr(user, "client") and user.client:
            client_user_ids = list(user.client.users.values_list("id", flat=True))
    else:
        client_user_ids = [user.id]
    try:
        app_obj = AppsColumnSetting.objects.get(app_name=app_name, user__in=client_user_ids)

        # Serialize the base object
        serializer = AppsColumnSettingSerializer(app_obj)
        app_data = serializer.data

        # Merge default + custom columns
        base_columns = app_data.get("columns", [])
        custom_column_values = []

        for cc in app_data["custom_columns"]:
            if isinstance(cc["column_names"], list):
                custom_column_values.extend(cc["column_names"])
            else:
                custom_column_values.append(cc["column_names"])

        seen = {col["id"] if isinstance(col, dict) else col for col in base_columns}
        merged_columns = base_columns.copy()

        for col in custom_column_values:
            col_id = col["id"] if isinstance(col, dict) else col
            if col_id not in seen:
                seen.add(col_id)
                merged_columns.append(col)

        return Response({
            "id": app_data["id"],
            "app_name": app_data["app_name"],
            "app_data": app_data["app_data"],
            "columns": merged_columns,
            "user": app_data["user"]
        }, status=status.HTTP_200_OK)

    except AppsColumnSetting.DoesNotExist:
        return Response({'error': 'App not found for given app_name and user.'}, status=status.HTTP_404_NOT_FOUND)



@api_view(['GET'])
def get_department_status(request, department_id):
    client_id = request.user.client_id
    
    modules = Module.objects.filter(id=department_id).filter(
        Q(is_system=True) | Q(client__id=client_id, is_system=False)
    ).distinct()

    if not modules.exists():
        return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)

    result = []
    user = request.user
    if hasattr(user, "client") and user.client:
            client_user_ids = list(user.client.users.values_list("id", flat=True))
    else:
        client_user_ids = [user.id]
    for module in modules:
        apps = App.objects.filter(module=module).filter(
            Q(client__id=client_id) | Q(client__isnull=True)
        )

        # ✅ Single query: check if ANY AgentTask exists for these apps
        is_have_record = AgentTask.objects.filter(
            apikey__in=apps,
            user__in=client_user_ids
        ).exists()

        result.append({
            "name": module.module_name,
            "is_have_record": is_have_record
        })
    
    return Response(result, status=status.HTTP_200_OK)


class UserGeneratedAppsMinimalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        generated = (
            GeneratedAPI.objects.filter(user=user)
            .select_related("apps")
            .order_by("apps__app_name")   # ascending order by app_name
        )
        serializer = GeneratedAPIMinimalSerializer(generated, many=True)
        return Response(serializer.data)


class AppSearchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get("search", "")
        module_id = request.query_params.get("module_id", None)

        user_client = getattr(request.user, "client", None)

        # Default apps (client is null) + User apps (client = user_client)
        queryset = App.objects.filter(
            Q(client__isnull=True) | Q(client=user_client)
        )

        # Filter by module if provided
        if module_id:
            queryset = queryset.filter(module_id=module_id)

        # Apply search filter
        if search:
            queryset = queryset.filter(app_name__icontains=search)

        queryset = queryset.order_by("app_name")  # optional sort

        serializer = AppSerializer_search(queryset, many=True)
        return Response(serializer.data)
    
class GeneratedAPIKeyDetailView(RetrieveAPIView):
    serializer_class = GeneratedAPIKeySerializer
    queryset = GeneratedAPI.objects.all()

class UpdateMaxRetriesView(generics.UpdateAPIView):
    queryset = GeneratedAPI.objects.all()
    serializer_class = MaxRetriesUpdateSerializer
    permission_classes = [IsAuthenticated]  # optional, for auth control
    lookup_field = "id"  # you can also use api_key if you prefer


class ModulePermissionViewSet(viewsets.ModelViewSet):
    queryset = ModulePermission.objects.all()
    serializer_class = ModulePermissionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.roles not in ["owner", "client"]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not allowed to create module permissions.")
        serializer.save()

    def get_queryset(self):
        return ModulePermission.objects.filter(user__client=self.request.user.client)
    
class LogRecordsListAPIView(generics.ListAPIView):
    serializer_class = LogRecordsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user__client=self.request.user.client
        print("USER",user__client)
        if user__client:
            return LogRecords.objects.filter(client_id=user__client.id).order_by('-created_at')
        return LogRecords.objects.none()


class AppHidePagination(PageNumberPagination):
    page_size = 10  # default items per page
    page_size_query_param = 'page_size'  # allow ?page_size=20
    max_page_size = 100


class AppHideListView(generics.ListAPIView):
    serializer_class = AppWithHideSerializer
    pagination_class = AppHidePagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        client = getattr(user, "client", None)
        client_id = client.id if client else None


        # Base queryset with optimized prefetch and select
        hide_app_prefetch = Prefetch(
            "hide_app",
            queryset=Client.objects.filter(pk=client_id),
            to_attr="filtered_hide_app"
        )

        queryset = App.objects.all().select_related("module").prefetch_related(hide_app_prefetch)

        queryset = queryset.filter(
            Q(is_system=True) | Q(client=client, is_system=False)
        ).distinct().order_by("id")

        return queryset

class AppHideToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        data = request.data
        app_id = data.get("app_id")
        hide = data.get("hide")

        if app_id is None or hide is None:
            return Response(
                {"detail": "Both 'app_id' and 'hide' are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch client from the user
        user = request.user
        client = getattr(user, "client", None)
        if not client:
            return Response(
                {"detail": "User is not associated with any client."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch app and update hide_app M2M field
        app = App.objects.get(id=app_id)

        if hide:
            app.hide_app.add(client)
        else:
            app.hide_app.remove(client)

        app.refresh_from_db()

        return Response({
            "app_id": app.id,
            "hide": hide,
            "module_id": app.module_id,
            "message": f"App {'hidden' if hide else 'unhidden'} successfully."
        }, status=status.HTTP_200_OK)