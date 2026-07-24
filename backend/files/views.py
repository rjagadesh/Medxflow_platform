"""
File Manager API — tenant-scoped folders + files.

  GET  /api/files/browse/?folder=<id>  -> { folder, breadcrumb, folders, files }
  POST /api/files/folders/             -> create folder {name, parent}
  DELETE /api/files/folders/<id>/      -> delete folder (cascades)
  POST /api/files/                     -> upload a file (multipart: file, folder)
  DELETE /api/files/<id>/              -> delete a file
"""
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role

from .models import FileFolder, StoredFile
from .serializers import FileFolderSerializer, StoredFileSerializer


def _folders(user):
    qs = FileFolder.objects.all()
    return qs if user.role == Role.SUPER_ADMIN else qs.filter(tenant=user.tenant)


def _files(user):
    qs = StoredFile.objects.all()
    return qs if user.role == Role.SUPER_ADMIN else qs.filter(tenant=user.tenant)


def _require_tenant(user):
    if user.tenant is None:
        raise ValidationError("Sign in as a tenant user to manage files.")


class BrowseView(APIView):
    """Return the contents of a folder (or the root) plus a breadcrumb trail."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        folder_id = request.query_params.get("folder")
        current = None
        if folder_id:
            current = _folders(user).filter(pk=folder_id).first()
            if not current:
                return Response({"detail": "Folder not found."}, status=404)

        folders = _folders(user).filter(parent=current)
        files = _files(user).filter(folder=current)

        # Build breadcrumb from the current folder up to the root.
        crumbs, node = [], current
        while node:
            crumbs.insert(0, {"id": node.id, "name": node.name})
            node = node.parent

        return Response({
            "folder": current.id if current else None,
            "breadcrumb": crumbs,
            "folders": FileFolderSerializer(folders, many=True).data,
            "files": StoredFileSerializer(files, many=True, context={"request": request}).data,
        })


class FolderCreateView(generics.CreateAPIView):
    serializer_class = FileFolderSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        _require_tenant(self.request.user)
        parent = serializer.validated_data.get("parent")
        if parent and parent.tenant_id != self.request.user.tenant_id:
            raise ValidationError("Invalid parent folder.")
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)


class FolderDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _folders(self.request.user)


class FileUploadView(generics.CreateAPIView):
    serializer_class = StoredFileSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        _require_tenant(user)
        upload = self.request.data.get("file")
        if not upload:
            raise ValidationError({"file": "No file provided."})
        folder = serializer.validated_data.get("folder")
        if folder and folder.tenant_id != user.tenant_id:
            raise ValidationError("Invalid folder.")
        serializer.save(
            tenant=user.tenant,
            uploaded_by=user,
            name=upload.name,
            size=getattr(upload, "size", 0),
            content_type=getattr(upload, "content_type", ""),
        )


class FileDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _files(self.request.user)
