from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()

urlpatterns = [
    path("upload/", FileManagerUpload.as_view(), name="file_upload"),
    path("", FileManagerList.as_view(), name="file_list"),
    path("<int:file_id>/", FileManagerDelete.as_view(), name="file_delete"),
    path("download/", FileManagerDownload.as_view(), name="file_download"),
    path("create-folder/", FileManagerCreateFolder.as_view(), name="file_create_folder"),
    path("list_all", FileManagerListAll.as_view(), name = "file_list_all"),
    path('download_files/', DownloadAll.as_view(),name = "download_all_files"),
    path('download_only_files/', DownloadOnlyFiles.as_view(), name="download_only_files"),
    path('list_files', FileManagerListFolder.as_view(), name="list_files"),
    path('smart-drivers-list',get_smart_driver_view_count,name="smart-drivers-list"),
]
