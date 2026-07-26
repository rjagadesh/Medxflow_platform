from django.urls import path
from .views import VersionCreateView, VersionUpdateView, VersionRetrieveView, FileListView

urlpatterns = [
    path("droidal/create/", VersionCreateView.as_view(), name="version-create"),
    path("droidal/update/<str:app_name>/", VersionUpdateView.as_view(), name="version-update"),
    path("droidal/<str:app_name>/", VersionRetrieveView.as_view(), name="version-get"),
    path("list_file", FileListView.as_view(),name="file_list")
]
