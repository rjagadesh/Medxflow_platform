from django.urls import path, include
from .views import *
from rest_framework.routers import DefaultRouter



router = DefaultRouter()
router.register(r'instruction', InstructionView, basename='instruction')

urlpatterns = [
    path("", include(router.urls)),
    path("tasks/create/", AgentTaskCreateView.as_view(), name="agenttask-create"),
    path("tasks/", AgentTaskDynamicList.as_view(), name="task-list"),
    path("tasks/pending/", AgentTaskPendingView.as_view(), name="task-pending"),
    path("tasks/pending/new-only/", AgentTaskSimpleView.as_view(), name="new-task-pending"),
    path("tasks/export/", AgentTaskExportCSVView.as_view(), name="task-export"),
    path("tasks/export-all/",AllAgentTaskExportCSVView.as_view(),name='all-task-export'),
    path("tasks/<int:id>/update-status/", AgentTaskStatusUpdateView.as_view(), name="task-update-status"),
    path("upload/", upload_files, name="upload-agent-file"),
    path("get-agent-files/", get_task_files, name="get-agent-files"),
    path("task-status-count/", TaskStatusCountAPIView.as_view(), name="task-status-count"),
    path("department/<int:id>/task-status-count/", DepartmentTaskStatusCountAPIView.as_view(), name="task-status-count"),
    path("today-status/", today_status_counts, name="today-status-counts"),
    path("overall-status/", overall_status_counts, name="overall-status-counts"),
    path("today-summary/", today_success_failure_counts, name="today-summary"),
    path("monthly-summary/", monthly_success_failure_counts, name="monthly-summary"),
    path("request_by_day/", request_by_day, name="request_by_day"),
    path("request_status_by_day/", request_status_by_day, name="request_status_by_day"),
    path("request_status_by_month/", request_status_by_month, name="request_status_by_month"),
    path("rowdata-count/", rowdata_count, name="rowdata-count"),
    path("user/<int:user_id>/", user_rowdata_count, name="user-rowdata-count"),
    path("update-task-status/<int:task_id>/", update_task_status, name="update-task-status"),
    path("bulk-upload/", AgentTaskBulkUploadView.as_view(), name="agent-task-bulk-upload"),
    path('tasks-bulk-delete/', AgentTaskDeleteView.as_view(), name='agent-task-bulk-delete'),
    path("audio/<str:subfolder>/<str:agentid>/<str:filename>", serve_audio, name="serve_audio"),
    path("edit-data/", AgentTaskEditData.as_view(), name="agent-task-edit-data"),
    path("update-pdf/", UpdatePdfView.as_view(), name="update_pdf"),
    path("agent-tasks/<int:pk>/call-status/", CallStatusCheckView.as_view()),
    path("agent-tasks/<int:pk>/update-data/", AgentTaskDataUpdateView.as_view(), name="agent-task-update-data"),
]