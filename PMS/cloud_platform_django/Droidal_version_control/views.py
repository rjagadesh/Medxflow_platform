from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import VersionControl
from .serializers import VersionControlSerializer
import os
from django.conf import settings
from urllib.parse import quote

class VersionCreateView(APIView):
    def post(self, request):
        serializer = VersionControlSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Version created successfully", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VersionUpdateView(APIView):
    def put(self, request, app_name):
        try:
            version = VersionControl.objects.get(app_name=app_name)
        except VersionControl.DoesNotExist:
            return Response({"error": "App not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = VersionControlSerializer(version, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Version updated successfully", "data": serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VersionRetrieveView(APIView):
    def get(self, request, app_name):
        try:
            version = VersionControl.objects.get(app_name=app_name)
        except VersionControl.DoesNotExist:
            return Response({"error": "App not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = VersionControlSerializer(version)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FileListView(APIView):
    def get(self, request):
        # Safe path using MEDIA_ROOT
        folder_path = os.path.join(settings.MEDIA_ROOT, "forms", "Agent Flow")

        if not os.path.exists(folder_path):
            return Response({"files": [], "message": "Folder not found"}, status=404)

        files = []
        for file in os.listdir(folder_path):
            file_path = os.path.join(folder_path, file)
            if os.path.isfile(file_path):
                encoded_file = quote(file)  # Encode space in file names
                public_url = request.build_absolute_uri(
                    f"{settings.MEDIA_URL}forms/Agent%20Flow/{encoded_file}"
                ).replace("http://", "https://")
                files.append({
                    "name": file,
                    "url": public_url
                })

        return Response({"files": files})