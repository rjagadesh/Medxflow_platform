from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'assets', AssetViewSet, basename='asset')

urlpatterns = [
    path('', include(router.urls)),
    path("upload-files/", upload_files, name="upload-files"),
    path('asset/<int:user_id>/<str:asset_name>/', get_asset_by_user_and_name, name='get_asset_by_user_and_name'),
    path("get-task-files/<int:task_id>/", get_task_files, name="get-task-files"),
    path("get-execution-files/<int:task_id>/", get_execution_file, name="get-execution-files"),
    path("user/<int:user_id>/projects/", get_user_projects, name="get-user-projects"),
    path("<int:project_id>/tasks/", get_project_tasks, name="get-project-tasks"),
    path("tasks-json/<int:pk>/data/", TaskDataUpdateView.as_view(), name="task-data"),
    path("tasks-code/<int:pk>/data/", TaskCodeUpdateView.as_view(), name="task-code"),
    path("api-keys/generate/", generate_api_key_api),
    path('assets-api-keys/<str:asset_name>/', get_asset_by_api_key),
    path("api-keys/", get_api_keys),
    path("assets-api/", AssetListByUsernameView.as_view(), name="api-assets"),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
