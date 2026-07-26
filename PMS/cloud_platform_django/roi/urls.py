from django.urls import path
from .views import ProcessDataViewSet, fetch_effort_data_rest

process_data_list = ProcessDataViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

process_data_detail = ProcessDataViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path('process-data/', process_data_list, name='process-data-list'),
    path('process-data/<int:pk>/', process_data_detail, name='process-data-detail'),
    path('fetch-effort-data-rest/', fetch_effort_data_rest, name='fetch_effort_data_rest'),
]