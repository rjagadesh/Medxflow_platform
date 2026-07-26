from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'modules', ModuleViewSet)
router.register(r'apps', AppViewSet)
router.register(r'column-settings', ColumnSettingUpsertViewSet)
router.register(r'generated-apis', GeneratedAPIViewSet, basename='generated-api')  # <-- added
router.register(r'sub-agent', SubAgentsViewSet, basename='sub-agent')  # <-- added
router.register(r'sub-agent-apis', Sub_Agent_APIViewSet, basename='sub-agent-api')  # <-- added
router.register(r'column-custom', CustomColumnViewSet, basename='column-custom')  # <-- added
router.register(r'module-permission', ModulePermissionViewSet, basename='module-permission')  # <-- added
urlpatterns = [
    path('', include(router.urls)),
    path("modulesapi/", ModuleListAPIView.as_view(), name="modules-list"),
    path("appsapi/", AppListAPIView.as_view(), name="apps-list"),
    path("apps-hide-list/", AppHideListView.as_view(), name="apps-hide-list"),
    path("apps-hide/", AppHideToggleView.as_view(), name="apps-hide-toggle"),
    path("sub-agent-list/", SubAgentListAPIView.as_view(), name="sub-agent-apis"),
    path("get-api-key/", GetApiKeyView.as_view(), name="get-api-key"),
    path("get_app_columns/", get_app_columns, name="get_app_columns"),
    path("department-status/<int:department_id>/", get_department_status, name="get_department_status"),
    path("user-apps-minimal/", UserGeneratedAppsMinimalView.as_view(), name="user-apps-minimal"),
    path("search-app/", AppSearchAPIView.as_view(), name="app-search"),
    path("generated-api/<int:pk>/", GeneratedAPIKeyDetailView.as_view(), name="generated-api-detail"),
    path("generated-api/<int:id>/update-max-retries/", UpdateMaxRetriesView.as_view(), name="update-max-retries"),
    path('logs/', LogRecordsListAPIView.as_view(), name='logrecords-list')
]
