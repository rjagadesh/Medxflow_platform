from rest_framework import viewsets
from .models import *
from .serializers import *
import os
from rest_framework.views import APIView
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics, permissions
from .permissions import IsOwnerOrReadOnly   # 👈 import from your app
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

MEDIA_SUBFOLDER = "uploads"

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user) 

    def get_queryset(self):
        user = self.request.user
        queryset = Project.objects.filter(tenant=user)

        return queryset
 


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.GET.get("project_id")
        if not project_id:
            return Task.objects.none()
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Task.objects.none()
        return Task.objects.filter(project=project)

    # ✅ Custom endpoint to update API key
    @action(detail=True, methods=["post"], url_path="update-apikey")
    def update_apikey(self, request, pk=None):
        """
        Update the API key for this task.
        Example:
            POST /tasks/5/update-apikey/
            Body: {"apikey": "your-new-api-key"}
        """
        try:
            task = self.get_object()
            new_apikey = request.data.get("apikey")

            if not new_apikey:
                return Response({"error": "apikey is required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                api_obj = GeneratedAPI.objects.get(api_key=new_apikey)
            except GeneratedAPI.DoesNotExist:
                return Response({"error": "Invalid apikey"}, status=status.HTTP_404_NOT_FOUND)

            task.apikey = api_obj
            task.save(update_fields=["apikey", "updated_at"])
            return Response({"message": "API key updated successfully"}, status=status.HTTP_200_OK)

        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)



class AssetViewSet(viewsets.ModelViewSet):
    queryset = AssetDetails.objects.all()
    serializer_class = AssetDetailsSerializer
    permission_classes = [IsAuthenticated]


    def perform_create(self, serializer):
        serializer.save(user=self.request.user) 

    def get_queryset(self):
        user = self.request.user
        queryset = AssetDetails.objects.filter(user=user)

        return queryset

@api_view(['GET'])
def get_asset_by_user_and_name(request, user_id, asset_name):
    """
    Get a single asset by user ID and asset name, with username included.
    """
    asset = get_object_or_404(
        AssetDetails.objects.select_related('user'),
        user_id=user_id,
        name=asset_name
    )

    data = {
        "asset_id": asset.asset_id,
        "asset_name": asset.name,
        "description": asset.description,
        "asset_type": asset.asset_type,
        "label": asset.label,
        "created_at": asset.created_at,
        "value": asset.value,
    }

    return Response(data)

@api_view(["POST"])
def upload_files(request):
    task_id = request.data.get("task_id")
    uploaded_files = request.FILES.getlist("files")  # <--- Multiple files

    if not all([task_id]) or not uploaded_files:
        return Response(
            {"error": "user_id, task_id, project_id and files are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    task_folder = os.path.join(settings.MEDIA_ROOT, MEDIA_SUBFOLDER, str(task_id))
    os.makedirs(task_folder, exist_ok=True)

    saved_files = []
    for uploaded_file in uploaded_files:
        file_path = os.path.join(task_folder, uploaded_file.name)
        with open(file_path, "wb+") as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        saved_files.append(os.path.join(MEDIA_SUBFOLDER, str(task_id), uploaded_file.name))

    return Response(
        {
            "message": f"{len(saved_files)} files uploaded successfully",
            "files": saved_files,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def get_task_files(request, task_id):
    # Path for the specific task
    task_folder = os.path.join(settings.MEDIA_ROOT, MEDIA_SUBFOLDER, str(task_id))
    if not os.path.exists(task_folder):
        return Response({"files": []}, status=status.HTTP_200_OK)

    base_url = request.build_absolute_uri(settings.MEDIA_URL)  # full media URL
    base_url = base_url.replace("http://", "https://")
    file_list = []
    for file_name in os.listdir(task_folder):
        file_url = f"{base_url}{MEDIA_SUBFOLDER}/{task_id}/{file_name}"
        file_list.append({"file_name": file_name, "file_url": file_url})

    return Response({"files": file_list}, status=status.HTTP_200_OK)

@api_view(["GET"])
def get_execution_file(request, task_id):
    """
    Return the direct URL of the Python file for a given task_id.
    """
    task_folder = os.path.join(settings.MEDIA_ROOT, MEDIA_SUBFOLDER, str(task_id))
    
    if not os.path.exists(task_folder):
        return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

    # Look for a .py file in the folder
    py_files = [f for f in os.listdir(task_folder) if f.endswith(".py")]
    if not py_files:
        return Response({"error": "No Python file found for this task"}, status=status.HTTP_404_NOT_FOUND)

    # Take the first .py file (or adapt if multiple allowed)
    py_file = py_files[0]

    base_url = request.build_absolute_uri(settings.MEDIA_URL)
    file_url = f"{base_url}{MEDIA_SUBFOLDER}/{task_id}/{py_file}"

    return Response({"file_url": file_url}, status=status.HTTP_200_OK)

@api_view(["GET"])
def get_user_projects(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    projects = Project.objects.filter(tenant=user)
    project_list = [
        {"id": p.id, "project_name": p.project_name, "description": p.description}
        for p in projects
    ]
    return Response({"projects": project_list}, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_project_tasks(request, project_id):
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    tasks = Task.objects.filter(project=project)
    task_list = [
        {"id": t.id, "task_name": t.task_name, "description": t.description}
        for t in tasks
    ]
    return Response({"tasks": task_list}, status=status.HTTP_200_OK)

class TaskDataUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskJsonSerializer
    authentication_classes = []  # important
    permission_classes = [AllowAny]

class TaskCodeUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskCodeSerializer
    permission_classes = [IsAuthenticated]


from rest_framework.decorators import api_view, permission_classes, authentication_classes
from .utils import generate_api_key
from .authentication import APIKeyAuthentication
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_api_key_api(request):
    """
    Generate a new API key for the authenticated user
    """
    user = request.user

    api_key = UserAPIKey.objects.create(
        user=user,
        key=generate_api_key()
    )

    return Response(
        {
            "message": "API key generated successfully",
            "api_key": api_key.key,
            "created_at": api_key.created_at
        },
        status=status.HTTP_201_CREATED
    )

@api_view(['GET'])
@authentication_classes([APIKeyAuthentication])
@permission_classes([AllowAny])
def get_asset_by_api_key(request, asset_name):
    """
    Get asset using API key instead of user_id
    """
    user = request.user  # resolved from API key

    asset = get_object_or_404(
        AssetDetails,
        user=user,
        name=asset_name
    )

    data = {
        "asset_id": asset.asset_id,
        "asset_name": asset.name,
        "description": asset.description,
        "asset_type": asset.asset_type,
        "label": asset.label,
        "created_at": asset.created_at,
        "value": asset.value,
    }

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_api_keys(request):
    """
    Get all API keys for the authenticated user
    """
    api_keys = UserAPIKey.objects.filter(user=request.user)

    serializer = UserAPIKeySerializer(api_keys, many=True)
    return Response(serializer.data)


User = get_user_model()

class AssetListByUsernameView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get("username")

        if not username:
            return Response(
                {"error": "username is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        assets = AssetDetails.objects.filter(user=user)
        serializer = AssetDetailsSerializer(assets, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)