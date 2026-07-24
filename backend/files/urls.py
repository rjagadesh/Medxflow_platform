"""API routes for the File Manager."""
from django.urls import path

from .views import (
    BrowseView,
    FileDeleteView,
    FileUploadView,
    FolderCreateView,
    FolderDeleteView,
)

urlpatterns = [
    path("files/browse/", BrowseView.as_view(), name="files-browse"),
    path("files/folders/", FolderCreateView.as_view(), name="folder-create"),
    path("files/folders/<int:pk>/", FolderDeleteView.as_view(), name="folder-delete"),
    path("files/", FileUploadView.as_view(), name="file-upload"),
    path("files/<int:pk>/", FileDeleteView.as_view(), name="file-delete"),
]
