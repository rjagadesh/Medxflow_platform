from rest_framework import viewsets, permissions
from .models import ProcessDatas
from .serializers import ProcessDataSerializer
from rest_framework.decorators import api_view, permission_classes
import json
import requests
from rest_framework.response import Response
from modules.models import GeneratedAPI
from django.forms.models import model_to_dict
from decimal import Decimal

def convert_decimals_to_strings(obj):
    if isinstance(obj, dict):
        return {k: convert_decimals_to_strings(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals_to_strings(item) for item in obj]
    elif isinstance(obj, Decimal):
        return str(obj)  # or float(obj) if needed
    else:
        return obj
class ProcessDataViewSet(viewsets.ModelViewSet):
    queryset = ProcessDatas.objects.all()
    serializer_class = ProcessDataSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "client") and user.client:
            client_user_ids = list(user.client.users.values_list("id", flat=True))
        else:
            client_user_ids = [user.id]
        queryset = ProcessDatas.objects.filter(user__in=client_user_ids)

        # Get optional query params
        module_id = self.request.query_params.get('module_id')
        app_id = self.request.query_params.get('app_id')

        if module_id:
            queryset = queryset.filter(department_id=module_id)  # department is Module FK
        if app_id:
            queryset = queryset.filter(agent_id=app_id)  # agent is App FK

        return queryset
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def fetch_effort_data_rest(request):
    data = json.loads(request.body)
    user = request.user
    department = data['department']
    agent = data['agent']

    # Filter ProcessDatas based on the input conditions
    if hasattr(user, "client") and user.client:
        client_user_ids = list(user.client.users.values_list("id", flat=True))
    else:
        client_user_ids = [user.id]
    if department == "All":
        userRoiInputs = ProcessDatas.objects.filter(user__in=client_user_ids).select_related('agent')
    elif agent == "All":
        userRoiInputs = ProcessDatas.objects.filter(user__in=client_user_ids, department=department).select_related('agent')
    else:
        userRoiInputs = ProcessDatas.objects.filter(user__in=client_user_ids, department=department, agent=agent).select_related('agent')

    # Bulk fetch all relevant GeneratedAPI entries for the user
    agent_ids = [p.agent_id for p in userRoiInputs]
    user_generated_apis = {
        ga.apps_id: ga.api_key
        for ga in GeneratedAPI.objects.filter(user__in=client_user_ids, apps__in=agent_ids)
    }

    roi_list = []
    for process_data in userRoiInputs:
        process_data_dict = model_to_dict(process_data)
        process_data_dict['secret_key'] = user_generated_apis.get(process_data.agent_id)
        # Convert Decimals to strings
        cleaned_dict = convert_decimals_to_strings(process_data_dict)
        roi_list.append(cleaned_dict)

    # Prepare the request payload
    url = 'https://droidmetrix.droidal.com/fetch-effort-data-rest2/'

    try:
        response = requests.post(
            url,
            json={**data, 'roiList': roi_list},
            timeout=120,
            auth=("qv0fjm58f9", "bnd8rkansm") 
        )
        response.raise_for_status()

        if response.headers.get("Content-Type", "").startswith("application/json"):
            return Response(response.json())
        else:
            return Response({
                "error": "Invalid JSON response from remote server",
                "raw": response.text
            }, status=502)
    except requests.exceptions.RequestException as e:
        return Response({"error": str(e)}, status=500)
