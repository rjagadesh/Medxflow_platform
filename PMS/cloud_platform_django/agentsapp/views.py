import os
import asyncio
from livekit import api as lk_api
import mimetypes
from django.conf import settings
from django.db.models import Q, F, Subquery, OuterRef
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import AgentTask, Instructions
from .serializers import AgentTaskSerializer, InstructionSerializer
from modules.models import App, GeneratedAPI, Module
from django.db.models import Count
from accounts.models import Client
from django.utils.timezone import now
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view,permission_classes
from django.db.models import Count
from django.db.models.functions import TruncDate
import csv
import io
from django.http import HttpResponse
from dateutil import parser
import pandas as pd
from .utils import read_excelrange
import tempfile
import json
MEDIA_SUBFOLDER = "agents"
from rest_framework import viewsets
from voiceAI.models import TelephonySettings, AgentVersion, CallLog
from openpyxl import Workbook
import os
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework import status
from django.http import FileResponse, HttpResponse, HttpResponseNotFound
from django.conf import settings
import os
from datetime import datetime
from zoneinfo import ZoneInfo

@api_view(["GET"])
def serve_audio(request, subfolder, agentid, filename):
    """
    Serve audio files with HTTP range support for seeking.
    Example URL: /audio/tasks/1234/file.wav
    """
    file_path = os.path.join(settings.MEDIA_ROOT, subfolder, agentid, filename)

    if not os.path.exists(file_path):
        return HttpResponseNotFound("File not found")

    file_size = os.path.getsize(file_path)
    range_header = request.headers.get('Range', '')
    content_type = 'audio/wav'

    # Default full file response
    response = None

    if range_header:
        # Parse the Range header: bytes=start-end
        bytes_range = range_header.strip().split('=')[-1]
        start, end = bytes_range.split('-')[0], bytes_range.split('-')[1] or None
        start = int(start)
        end = int(end) if end else file_size - 1

        if start >= file_size:
            response = HttpResponse(status=416)  # Range Not Satisfiable
        else:
            length = end - start + 1
            with open(file_path, 'rb') as f:
                f.seek(start)
                data = f.read(length)

            response = HttpResponse(data, status=206, content_type=content_type)
            response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response['Content-Length'] = str(length)
    else:
        # No Range header → return full file
        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
        response['Content-Length'] = str(file_size)

    # Always advertise support for range requests
    response['Accept-Ranges'] = 'bytes'
    return response

def convert_timezone(dt=None, tz_name="America/Chicago"):
    if not dt:
        return ""
    try:
        return dt.astimezone(ZoneInfo(tz_name)).strftime("%-m/%-d/%Y, %-I:%M:%S %p")
    except Exception:
        import traceback as tr
        print(f"the error converting is : {tr.format_exc()}")
        return dt.strftime("%-m/%-d/%Y, %-I:%M:%S %p")
    
class AgentTaskExportCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        agent_id = request.query_params.get("agent_id")
        range_param = request.query_params.get("params")
        time_zone = request.query_params.get("time_zone")

        start_date = None
        end_date = None

        if range_param:
            try:
                # Parse params JSON string into Python list
                range_list = json.loads(range_param)
                if isinstance(range_list, list) and len(range_list) > 0:
                    start_date = range_list[0].get("startDate")
                    end_date = range_list[0].get("endDate")
            except json.JSONDecodeError:
                return HttpResponse("Invalid params format", status=400)

        # Validate required fields
        if not start_date or not end_date:
            return HttpResponse("Please provide start and end date", status=400)

        user = request.user

        # Filter tasks by agent and date range
        queryset = AgentTask.objects.filter(
            user=user,
            apikey__id=agent_id,
            created_at__range=[start_date, end_date]
        ).prefetch_related('call_logs').order_by("-created_at")

        # Collect all unique keys from `task.data`
        all_keys = set()
        for task in queryset:
            if isinstance(task.data, dict):
                all_keys.update(task.data.keys())

        all_keys = sorted(all_keys)  # convert to list for consistent order

        # Write CSV in memory
        buffer = io.StringIO()
        writer = csv.writer(buffer)

        # CSV Header -> all keys + status + call log fields
        call_log_fields = ["from_number", "to_number", "start_time", "end_time", "duration_seconds"]
        header = ["Queue Uploaded Date"] + all_keys + ["status"] + call_log_fields
        writer.writerow(header)

        # Write rows
        for task in queryset:
            row = []
            row.append(convert_timezone(task.created_at,time_zone) if time_zone else task.created_at)
            for key in all_keys:
                row.append(task.data.get(key, ""))  # empty string if key missing
            row.append(task.status)

            # Get latest call log
            # Since CallLog has ordering=['-created_at'], the first one is the latest
            latest_call = task.call_logs.first()
            
            if latest_call:
                row.append(latest_call.from_number or "")
                row.append(latest_call.to_number or "")
                row.append(convert_timezone(latest_call.start_time or "",time_zone) if time_zone else (latest_call.start_time or "") )
                row.append(convert_timezone(latest_call.end_time or "",time_zone)if time_zone else (latest_call.end_time or ""))
                row.append(latest_call.duration_seconds or "")
            else:
                # Fill empty strings for call log fields if no call log found
                row.extend([""] * len(call_log_fields))

            writer.writerow(row)

        # Prepare response
        response = HttpResponse(buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="agent_tasks.csv"'
        return response
    
def make_naive(dt):
    if isinstance(dt, datetime) and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

def clean_sheet_title(title):
    import re
    # Remove invalid Excel characters
    title = re.sub(r'[\\/*?:[\]]', '_', title)

    # Trim to Excel 31 character limit
    return title[:31]

class AllAgentTaskExportCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        range_param = request.query_params.get("params")
        department = request.query_params.get("department")
        department_id = request.query_params.get("department_id")
        time_zone = request.query_params.get("time_zone")

        start_date = None
        end_date = None

        if range_param:
            try:
                range_list = json.loads(range_param)
                if isinstance(range_list, list) and len(range_list) > 0:
                    start_date = range_list[0].get("startDate")
                    end_date = range_list[0].get("endDate")
            except json.JSONDecodeError:
                return HttpResponse("Invalid params format", status=400)

        user = request.user

        if department:
            agent_ids = (
                AgentTask.objects
                .filter(
                    user__client=user.client,
                    apikey__module__module_name=department,
                    apikey__module__is_active=True
                )
                .values_list("apikey__id", "apikey__app_name")
                .distinct()
            )
        elif department_id:
            agent_ids = (
                AgentTask.objects
                .filter(
                    user__client=user.client,
                    apikey__module__id=department_id,
                    apikey__module__is_active=True
                )
                .values_list("apikey__id", "apikey__app_name")
                .distinct()
            )
        else:
            agent_ids = AgentTask.objects.filter(
                user__client=user.client
            ).values_list("apikey__id", "apikey__app_name").distinct()

        # Create Excel workbook
        wb = Workbook()
        wb.remove(wb.active)  

        call_log_fields = [
            "from_number",
            "to_number",
            "start_time",
            "end_time",
            "duration_seconds"
        ]

        print(f"the agent ids are : {agent_ids}")
        if not agent_ids.exists():
            return Response({"status":"No data Found"},status=status.HTTP_404_NOT_FOUND)
        
        for agent  in agent_ids:
            print(f"the agent : {agent}")
            agent_id = agent[0]
            app_name = agent[1]
            if start_date and end_date:
                queryset = AgentTask.objects.filter(
                    user__client=user.client,
                    apikey__id=agent_id,
                    created_at__range=[start_date, end_date]
                ).prefetch_related('call_logs')
            else:
                queryset = AgentTask.objects.filter(
                    user__client=user.client,
                    apikey__id=agent_id
                ).prefetch_related('call_logs')

            if not queryset.exists():
                continue

            # Collect all dynamic keys
            all_keys = set()
            for task in queryset:
                if isinstance(task.data, dict):
                    all_keys.update(task.data.keys())

            all_keys = sorted(all_keys)

            # Create sheet per agent
            # sheet = wb.create_sheet(title=f"Agent_{app_name[:20]}_{agent_id}")
            safe_name = clean_sheet_title(f"Agent_{app_name}_{agent_id}")
            sheet = wb.create_sheet(title=safe_name)

            # Header
            header = all_keys + ["status"] + call_log_fields
            sheet.append(header)

            # Rows
            for task in queryset:
                row = []
                for key in all_keys:
                    row.append(task.data.get(key, ""))

                row.append(task.status)

                latest_call = task.call_logs.first()

                if latest_call:
                    row.extend([
                        latest_call.from_number or "",
                        latest_call.to_number or "",
                        convert_timezone(make_naive(latest_call.start_time) if latest_call.start_time else "",time_zone) if time_zone else (make_naive(latest_call.start_time) if latest_call.start_time else ""),
                        convert_timezone(make_naive(latest_call.end_time) if latest_call.end_time else "",time_zone) if time_zone else (make_naive(latest_call.end_time) if latest_call.end_time else ""),
                        latest_call.duration_seconds or ""
                    ])
                else:
                    row.extend([""] * len(call_log_fields))

                sheet.append(row)

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        return FileResponse(
            output,
            as_attachment=True,
            filename="all_agents_tasks.xlsx",
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )


# 1. Create Agent Task
class AgentTaskCreateView(generics.CreateAPIView):
    serializer_class = AgentTaskSerializer

    def create(self, request, *args, **kwargs):
        apikey = request.data.get("apikey")
        if not apikey:
            return Response({"error": "apikey is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            generated_api = GeneratedAPI.objects.select_related("apps", "user").get(api_key=apikey)
        except GeneratedAPI.DoesNotExist:
            return Response({"error": "Invalid apikey"}, status=status.HTTP_404_NOT_FOUND)

        data_field = request.data.get("data", {})
        if isinstance(data_field, dict) and "tasks" in data_field:
            tasks_list = data_field["tasks"]
        else:
            tasks_list = [data_field]

        if not isinstance(tasks_list, list):
            return Response({"error": "tasks must be a list"}, status=status.HTTP_400_BAD_REQUEST)

        agent_tasks_to_create = []
        errors = []

        for idx, task_item in enumerate(tasks_list):
            if not isinstance(task_item, dict):
                errors.append({"index": idx, "error": "Each task must be a JSON object"})
                continue

            # unwrap task if nested
            claim_data = task_item.get("task", task_item)

            raw_status = task_item.get("status", "NEW")
            created_at_str = task_item.get("created_date")
            current_retry = task_item.get("current_retry", 0)

            if isinstance(raw_status, str) and raw_status.lower().startswith("retry"):
                try:
                    current_retry = int(raw_status[5:])
                    task_status = "PENDING"
                except ValueError:
                    task_status = "PENDING"
            else:
                task_status = raw_status

            from dateutil import parser
            created_at = None
            if created_at_str:
                try:
                    created_at = parser.parse(created_at_str)
                except Exception:
                    errors.append({"index": idx, "error": f"Invalid created_date: {created_at_str}"})

            agent_tasks_to_create.append(
                AgentTask(
                    apikey=generated_api.apps,
                    user=generated_api.user,
                    data=claim_data,
                    status=task_status.upper(),
                    current_retry=current_retry,
                    created_at=created_at if created_at else timezone.now()
                )
            )

        # Bulk insert
        AgentTask.objects.bulk_create(agent_tasks_to_create)

        return Response(
            {
                "message": f"{len(agent_tasks_to_create)} tasks created",
                "errors": errors,
            },
            status=status.HTTP_201_CREATED,
        )
    

class AgentTaskBulkUploadView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            apikey = request.data.get("apikey")
            if not apikey:
                return Response({"error": "apikey is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Validate API key
            try:
                generated_api = GeneratedAPI.objects.select_related("apps", "user").get(api_key=apikey)
            except GeneratedAPI.DoesNotExist:
                return Response({"error": "Invalid apikey"}, status=status.HTTP_404_NOT_FOUND)

            file_obj = request.FILES.get("file")
            if not file_obj:
                return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_obj.name)[-1]) as tmp:
                for chunk in file_obj.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name

            # Optional params (Excel only)
            sheet_name = request.data.get("sheet")
            read_range = request.data.get("range")

            try:
                rows = read_excelrange(tmp_path, sheet_name, read_range)
            finally:
                os.remove(tmp_path)

            agent_tasks_to_create = []
            errors = []

            for idx, row in enumerate(rows):
                try:
                    claim_data = {k: v for k, v in row.items() if k not in ["Status", "Created Date", "Current Retry"]}

                    status_key = next((k for k in row.keys() if k.lower() == "status"), None)

                    if status_key:
                        claim_data["Status 1"] = row[status_key]
                    raw_status = "NEW"
                    # raw_status = str(row.get("Status", "NEW"))
                    created_at_str = row.get("Created Date")
                    current_retry = row.get("Current Retry") or 0

                    # Handle retry
                    if raw_status.lower().startswith("retry"):
                        try:
                            current_retry = int(raw_status[5:])
                            task_status = "PENDING"
                        except ValueError:
                            task_status = "PENDING"
                    else:
                        task_status = raw_status

                    # Parse created_at
                    created_at = None
                    if created_at_str:
                        try:
                            created_at = parser.parse(str(created_at_str))
                        except Exception:
                            errors.append({"index": idx, "error": f"Invalid created_date: {created_at_str}"})

                    agent_tasks_to_create.append(
                        AgentTask(
                            apikey=generated_api.apps,
                            user=generated_api.user,
                            data=claim_data,
                            status=task_status.upper(),
                            current_retry=int(current_retry),
                            created_at=created_at if created_at else timezone.now(),
                        )
                    )
                except Exception as e:
                    errors.append({"index": idx, "error": str(e)})

            # Bulk insert
            if agent_tasks_to_create:
                AgentTask.objects.bulk_create(agent_tasks_to_create)

            return Response(
                {"message": f"{len(agent_tasks_to_create)} tasks created", "errors": errors},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"errors": e}
            )
    
from modules import views
from rest_framework.test import APIRequestFactory
from modules.models import  CustomColumn, AppsColumnSetting
from modules.serializers import CustomColumnSerializer, ColumnSettingSerializer
from rest_framework.exceptions import ValidationError 
from rest_framework.generics import GenericAPIView


# 2. Dynamic List
class AgentTaskDynamicList(GenericAPIView):
    serializer_class = ColumnSettingSerializer
    def create_columns(self, request,generated_api,serializer,user):
        factory = APIRequestFactory()
        module_request = factory.get(
                    "/modulesapi/",
                    {"user_name":request.user,
                     "app_name":generated_api.apps_id},
                    HTTP_APP_NAME=generated_api.apps_id,
                    HTTP_AUTHORIZATION=request.META.get("HTTP_AUTHORIZATION"),
                )
        module_response = views.get_app_columns(module_request)
        if module_response.status_code == 404:
            user = request.user
            app_name = generated_api.apps_id    
            if not app_name:
                raise ValidationError({"app_name": "This field is required."})

            instance = AppsColumnSetting.objects.filter(user=user, app_name=app_name).first()

            request_data = {"app_name":app_name,
                            "columns":[]}

            new_serializer = self.get_serializer(instance, data=request_data, partial=bool(instance))
            new_serializer.is_valid(raise_exception=True)
            new_serializer.save(user=user)
            module_response.data["id"] = new_serializer.data["app_name"]
        column_list_to_update = {}
        column_to_update_details = []
        all_column_list = []
        db_column_list = []
        try:
            if serializer.data:
                for data in serializer.data:
                    if data.get("data"):
                        all_keys = data["data"].keys()
                        filtered_keys = [keys.strip() for keys in all_keys]
                        for default_keys in filtered_keys:
                            all_column_list.append(default_keys)
            all_column_list = set(all_column_list)

            if module_response.data:
                columns = (module_response.data).get("columns")
                if columns:
                    for data in columns:
                        if data.get("id"):
                            all_keys = data["id"]
                            db_column_list.append(all_keys)
            db_column_list = set(db_column_list)

            missing_columns = list(all_column_list - db_column_list)
            
            if missing_columns:

                all_columns = set(db_column_list).union(missing_columns)
                for columns in all_columns:
                    if "status" == columns.lower():
                        continue
                    if columns in missing_columns:
                        column_details = {"active": False,
                                "id": columns,
                                "is_custom": True,
                                "is_file_type": False,
                                "name": columns,
                                "required": True}
                    else:
                        column_details = {"active": True,
                                "id": columns,
                                "is_custom": True,
                                "is_file_type": False,
                                "name": columns,
                                "required": True}

                    column_to_update_details.append(column_details)
        
                column_list_to_update["column_names"] = column_to_update_details
                column_list_to_update["app_column_settings"] = module_response.data.get("id")
                
                data = {
                    "column_names": column_to_update_details,
                    "app_column_settings": module_response.data.get("id"),
                }

                new_serializer = CustomColumnSerializer(data=data, context={"request": self.request})
                new_serializer.is_valid(raise_exception=True)
                new_serializer.save(user=user)
                app_column_settings = new_serializer.validated_data.get("app_column_settings")

                # check if record already exists
                instance = CustomColumn.objects.filter(
                    user=user,
                    app_column_settings=app_column_settings
                ).first()

                if instance:
                    # Update existing record
                    new_serializer.update(instance, new_serializer.validated_data)
                else:
                    # Create new record
                    new_serializer.save(user=user)
        except Exception as e:
            print(e)
                    
    
    def get(self, request):
        apikey = request.query_params.get("apikey")
        user = request.user
        if not apikey:
            return Response({"error": "apikey is required"}, status=400)

        # Validate against GeneratedAPI
        try:
            generated_api = GeneratedAPI.objects.select_related("apps", "user").get(api_key=apikey)
        except GeneratedAPI.DoesNotExist:
            return Response({"error": "Invalid apikey"}, status=status.HTTP_404_NOT_FOUND)

        qs = AgentTask.objects.filter(apikey=generated_api.apps, user=generated_api.user)

        # --- Dynamic filters ---
        for key, value in request.query_params.items():
            if key in ["apikey", "page", "page_size", "ordering", "start_date", "end_date"]:
                continue

            if key.startswith("data__"):
                exact = Q(**{key: value})
                partial = Q(**{f"{key}__icontains": value})
                qs = qs.filter(exact | partial)
            else:
                qs = qs.filter(**{key: value})

        # --- Date Range Filter ---
        start_date_param = request.query_params.get("start_date")
        end_date_param = request.query_params.get("end_date")

        if start_date_param:
            qs = qs.filter(created_at__date__gte=start_date_param)
        if end_date_param:
            qs = qs.filter(created_at__date__lte=end_date_param)

        # --- Annotate with latest CallLog fields ---
        latest_call = CallLog.objects.filter(agent_task=OuterRef("pk")).order_by("-created_at")
        qs = qs.annotate(
            latest_call_id=Subquery(latest_call.values("id")[:1]),
            latest_call_call_id=Subquery(latest_call.values("call_id")[:1]),
            latest_call_duration=Subquery(latest_call.values("duration_seconds")[:1]),
            latest_call_status=Subquery(latest_call.values("status")[:1]),
            latest_call_start_time=Subquery(latest_call.values("start_time")[:1]),
            latest_call_end_time=Subquery(latest_call.values("end_time")[:1]),
            latest_call_to_number=Subquery(latest_call.values("to_number")[:1]),
            latest_call_from_number=Subquery(latest_call.values("from_number")[:1]),
            latest_call_voice=Subquery(latest_call.values("voice")[:1]),
            latest_call_model=Subquery(latest_call.values("model")[:1]),
            latest_call_config_source=Subquery(latest_call.values("config_source")[:1]),
            latest_call_recording_s3_url=Subquery(latest_call.values("recording_s3_url")[:1]),
            latest_call_transcript_s3_url=Subquery(latest_call.values("transcript_s3_url")[:1]),
            latest_call_call_log_s3_url=Subquery(latest_call.values("call_log_s3_url")[:1]),
            latest_call_extracted_s3_url=Subquery(latest_call.values("extracted_s3_url")[:1]),
            latest_call_created_at=Subquery(latest_call.values("created_at")[:1]),
            latest_call_updated_at=Subquery(latest_call.values("updated_at")[:1]),
        )

        # --- Sorting ---
        ordering = request.query_params.get("ordering")
        if ordering:
            fields = [f.strip() for f in ordering.split(",")]
            resolved_fields = []
            annotated_fields = [
                "latest_call_id",
                "latest_call_call_id",
                "latest_call_duration",
                "latest_call_status",
                "latest_call_start_time",
                "latest_call_end_time",
                "latest_call_to_number",
                "latest_call_from_number",
                "latest_call_voice",
                "latest_call_model",
                "latest_call_config_source",
                "latest_call_recording_s3_url",
                "latest_call_transcript_s3_url",
                "latest_call_call_log_s3_url",
                "latest_call_extracted_s3_url",
                "latest_call_created_at",
                "latest_call_updated_at",
            ]
            
            for f in fields:
                desc = f.startswith("-")
                field_name = f.lstrip("-")

                if field_name in annotated_fields:
                    resolved_fields.append(f)
                elif field_name not in [f.name for f in AgentTask._meta.get_fields()]:
                    # If it's not a real model field, assume it's a JSON key
                    json_lookup = f"data__{field_name}"
                    if desc:
                        json_lookup = f"-{json_lookup}"
                    resolved_fields.append(json_lookup)
                else:
                    resolved_fields.append(f)

            qs = qs.order_by(*resolved_fields)
        else:
            qs = qs.order_by("-created_at")

        # --- Pagination ---
        paginator = PageNumberPagination()
        paginator.page_size = int(request.query_params.get("page_size", 50))
        result_page = paginator.paginate_queryset(qs, request)

        serializer = AgentTaskSerializer(result_page, many=True)

        # self.create_columns(request,generated_api,serializer,user)

        return paginator.get_paginated_response(serializer.data)


class AgentTaskEditData(APIView):
    """
    PATCH /api/agent-task/edit-data/?apikey=<key>&task_id=<id>
    Body: {"data": {...}}  # Partial updates supported
    """

    def patch(self, request):
        apikey = request.query_params.get("apikey")
        task_id = request.query_params.get("task_id")
        status_data = request.data.get("status")

        if not apikey or not task_id:
            return Response({"error": "apikey and task_id are required"}, status=400)

        # ✅ Validate API key
        try:
            generated_api = GeneratedAPI.objects.select_related("apps", "user").get(api_key=apikey)
        except GeneratedAPI.DoesNotExist:
            return Response({"error": "Invalid apikey"}, status=status.HTTP_404_NOT_FOUND)

        # ✅ Get task
        task = get_object_or_404(
            AgentTask,
            id=task_id,
            apikey=generated_api.apps,
            user=generated_api.user,
        )

        # ✅ Ensure 'data' key exists
        if "data" not in request.data:
            return Response({"error": "Missing 'data' field in request body"}, status=400)

        update_data = request.data["data"]

        if not isinstance(update_data, dict):
            return Response({"error": "'data' must be a JSON object"}, status=400)

        # ✅ Get current data
        existing_data = task.data or {}

        # ✅ Check if all keys in update_data exist in existing_data
        missing_keys = [key for key in update_data.keys() if key not in existing_data]

        if missing_keys:
            return Response(
                {"error": f"Cannot update non-existent field(s): {', '.join(missing_keys)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ Merge partial updates (only for existing keys)
        existing_data.update(update_data)
        task.data = existing_data
        if status_data:
            task.status = status_data
            if status_data == "NEW":
                task.current_retry = 0
        task.save(update_fields=["data", "status","current_retry","status_changed_at"])

        serializer = AgentTaskSerializer(task)
        return Response(
            {"message": "Data updated successfully", "task": serializer.data},
            status=status.HTTP_200_OK,
        )

class AgentTaskDeleteView(APIView):
    def delete(self, request):
        apikey = request.query_params.get("apikey")
        task_ids = request.data.get("ids", None)  # list or single id

        if not apikey:
            return Response({"error": "apikey is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate the API key
        try:
            generated_api = GeneratedAPI.objects.select_related("apps", "user").get(api_key=apikey)
        except GeneratedAPI.DoesNotExist:
            return Response({"error": "Invalid apikey"}, status=status.HTTP_404_NOT_FOUND)

        # Filter base queryset
        queryset = AgentTask.objects.filter(apikey=generated_api.apps, user=generated_api.user)

        # === Case 1: Delete all NEW records ===
        if not task_ids:
            deleted_count, _ = queryset.filter(status="NEW").delete()
            return Response(
                {"message": "Bulk delete (NEW) completed", "deleted_count": deleted_count},
                status=status.HTTP_200_OK
            )

        # === Case 2: Delete one or multiple specific records ===
        if isinstance(task_ids, int):  # if a single ID is passed
            task_ids = [task_ids]

        if not isinstance(task_ids, list):
            return Response({"error": "ids must be a list or single integer"}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count, _ = queryset.filter(id__in=task_ids).delete()

        return Response(
            {"message": "Selected records deleted", "deleted_count": deleted_count},
            status=status.HTTP_200_OK
        )


class AgentTaskPendingView(generics.RetrieveAPIView):
    serializer_class = AgentTaskSerializer

    def get_object(self):
        apikey = self.request.query_params.get("apikey")
        if not apikey:
            return None, None

        try:
            generated_api = GeneratedAPI.objects.select_related("apps", "user").get(api_key=apikey)
        except GeneratedAPI.DoesNotExist:
            return None, None

        max_retries = generated_api.max_retries
        user = generated_api.user
        app = generated_api.apps

        # Step 1: Fetch NEW task
        task = AgentTask.objects.filter(
            apikey=app,
            user=user,
            status="NEW",
        ).order_by("created_at").first()

        if task:
            if max_retries == 0:
                task.status = "FAILURE"
                task.save(update_fields=["status", "status_changed_at"])
                return None, user.mail

            task.status = "PENDING"
            task.current_retry = F("current_retry") + 1
            task.save(update_fields=["status", "current_retry", "status_changed_at"])
            task.refresh_from_db()
            return task, user.mail

        # Step 2: Fetch oldest PENDING task within retry limit
        task = AgentTask.objects.filter(
            apikey=app,
            user=user,
            status="PENDING"
        ).order_by("created_at").first()

        if task:
            if task.current_retry >= max_retries:
                task.status = "FAILURE"
                task.save(update_fields=["status", "status_changed_at"])
                return None, user.mail
            else:
                task.current_retry = F("current_retry") + 1
                task.save(update_fields=["current_retry", "status_changed_at"])
                task.refresh_from_db(fields=["current_retry"])
                return task, user.mail

        return None, user.mail

    def retrieve(self, request, *args, **kwargs):
        task, user_email = self.get_object()
        input_apikey = self.request.query_params.get("apikey")

        if not task:
            return Response(
                {"status": "no records", "usermailid": user_email, "apikey": input_apikey},
                status=status.HTTP_200_OK
            )

        serializer = self.get_serializer(task, context={"input_apikey": input_apikey})
        data = serializer.data
        data["usermailid"] = user_email
        return Response(data, status=status.HTTP_200_OK)


class AgentTaskSimpleView(generics.RetrieveAPIView):
    serializer_class = AgentTaskSerializer

    def get_object(self):
        apikey = self.request.query_params.get("apikey")
        if not apikey:
            return None, None, False

        try:
            generated_api = GeneratedAPI.objects.select_related("apps", "user").get(api_key=apikey)
        except GeneratedAPI.DoesNotExist:
            return None, None, False

        user = generated_api.user
        app = generated_api.apps

        # ── Concurrency check ──────────────────────────────────────────────
        # Get the active AgentVersion for this app to reach TelephonySettings
        agent_version = (
            AgentVersion.objects.select_related("Telephony_Settings_id")
            .filter(app=app, status="Active")
            .first()
        )

        if agent_version and agent_version.Telephony_Settings_id:
            telephony: TelephonySettings = agent_version.Telephony_Settings_id
            max_concurrent = telephony.max_concurrent_calls

            pending_count = AgentTask.objects.filter(
                apikey=app,
                user=user,
                status="PENDING",
            ).count()

            if pending_count >= max_concurrent:
                # System is at capacity — signal "engaged" to the caller
                return None, user.mail, True   # <-- True = engaged
        # ──────────────────────────────────────────────────────────────────

        # Fetch only NEW tasks — PENDING tasks are never returned again
        task = (
            AgentTask.objects.filter(
                apikey=app,
                user=user,
                status="NEW",
            )
            .order_by("created_at")
            .first()
        )

        if task:
            task.status = "PENDING"
            task.save(update_fields=["status", "status_changed_at"])
            return task, user.mail, False

        return None, user.mail, False

    def retrieve(self, request, *args, **kwargs):
        task, user_email, is_engaged = self.get_object()
        input_apikey = self.request.query_params.get("apikey")

        # ── Engaged / at-capacity response ────────────────────────────────
        if is_engaged:
            return Response(
                {
                    "status": "engaged",
                    "message": "Max concurrent calls reached. Try again later.",
                    "usermailid": user_email,
                    "apikey": input_apikey,
                },
                status=status.HTTP_200_OK,
            )
        # ──────────────────────────────────────────────────────────────────

        if not task:
            return Response(
                {"status": "no records", "usermailid": user_email, "apikey": input_apikey},
                status=status.HTTP_200_OK,
            )

        serializer = self.get_serializer(task, context={"input_apikey": input_apikey})
        data = serializer.data
        data["usermailid"] = user_email
        return Response(data, status=status.HTTP_200_OK)

# 4. Update status
class AgentTaskStatusUpdateView(generics.UpdateAPIView):
    serializer_class = AgentTaskSerializer
    queryset = AgentTask.objects.all()
    lookup_field = "id"

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Check apikey against GeneratedAPI
        apikey = request.data.get("apikey")
        if not apikey:
            return Response({"error": "apikey is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            generated_api = GeneratedAPI.objects.select_related("apps", "user").get(api_key=apikey)
        except GeneratedAPI.DoesNotExist:
            return Response({"error": "Invalid apikey"}, status=status.HTTP_404_NOT_FOUND)

        # Ensure task belongs to same user + app
        if instance.user != generated_api.user or instance.apikey != generated_api.apps:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Validate status
        new_status = request.data.get("status")
        if new_status not in dict(AgentTask.STATUS_CHOICES):
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        # Update status
        instance.status = new_status
        instance.save(update_fields=["status", "status_changed_at"])

        return Response(AgentTaskSerializer(instance).data)

def validate_agent(agentid, secretkey):
    """
    Validate agentid against GeneratedAPI.api_key.
    Ensures that the AgentTask belongs to the same user + app as the GeneratedAPI.
    """
    try:
        generated_api = GeneratedAPI.objects.select_related("apps", "user").get(api_key=secretkey)
    except GeneratedAPI.DoesNotExist:
        return None

    try:
        agent = AgentTask.objects.get(
            id=agentid,
            user=generated_api.user,
            apikey=generated_api.apps,   # ✅ ensure AgentTask is tied to same App
        )
    except AgentTask.DoesNotExist:
        return None

    # enrich agent object with extra context (user + app from GeneratedAPI)
    agent.generated_user = generated_api.user
    agent.generated_app = generated_api.apps
    return agent



# ---------- POST Upload ----------
@api_view(["POST", "OPTIONS"])
def upload_files(request):
    agentid = request.data.get("agentid")
    secretkey = request.data.get("secretkey")
    uploaded_files = request.FILES.getlist("files")

    if not agentid or not secretkey or not uploaded_files:
        return Response(
            {"error": "agentid, secretkey, and files are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    agent = validate_agent(agentid, secretkey)
    if not agent:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    MAX_FILES = 10
    MAX_FILE_SIZE_MB = 100
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "docx", "txt","json","mp3","mp4", "wav"}

    if len(uploaded_files) > MAX_FILES:
        return Response({"error": f"Maximum {MAX_FILES} files allowed"}, status=status.HTTP_400_BAD_REQUEST)

    task_folder = os.path.join(settings.MEDIA_ROOT, MEDIA_SUBFOLDER, str(agentid))
    os.makedirs(task_folder, exist_ok=True)

    saved_files = []
    for f in uploaded_files:
        ext = f.name.split(".")[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return Response({"error": f"File type not allowed: {f.name}"}, status=status.HTTP_400_BAD_REQUEST)
        if f.size > MAX_FILE_SIZE_MB * 1024 * 1024:
            return Response({"error": f"File {f.name} exceeds {MAX_FILE_SIZE_MB} MB limit"}, status=status.HTTP_400_BAD_REQUEST)

        file_path = os.path.join(task_folder, f.name)

        # ✅ If file exists, remove it before writing new one
        if os.path.exists(file_path):
            os.remove(file_path)

        with open(file_path, "wb+") as destination:
            for chunk in f.chunks():
                destination.write(chunk)

        saved_files.append(os.path.join(MEDIA_SUBFOLDER, str(agentid), f.name))

    return Response(
        {"message": f"{len(saved_files)} file(s) uploaded successfully", "files": saved_files},
        status=status.HTTP_201_CREATED,
    )


# ---------- GET Files ----------
@api_view(["GET", "OPTIONS"])
def get_task_files(request):
    agentid = request.query_params.get("agentid")
    secretkey = request.query_params.get("secretkey")

    if not agentid or not secretkey:
        return Response(
            {"error": "agentid and secretkey are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    agent = validate_agent(agentid, secretkey)
    if not agent:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    task_folder = os.path.join(settings.MEDIA_ROOT, MEDIA_SUBFOLDER, str(agentid))
    if not os.path.exists(task_folder):
        return Response({"files": []}, status=status.HTTP_200_OK)

    base_url = request.build_absolute_uri(settings.MEDIA_URL)
    file_list = []
    audio_base_url = request.build_absolute_uri('/').rstrip('/')

    for file_name in os.listdir(task_folder):
        audio_url = f"{audio_base_url}/app/agentsapp/audio/{MEDIA_SUBFOLDER}/{agentid}/{file_name}"
        file_path = os.path.join(task_folder, file_name)
        if not os.path.isfile(file_path):
            continue

        mime_type, _ = mimetypes.guess_type(file_name)

        file_url = audio_url if "audio/x-wav" in mime_type else f"{base_url}{MEDIA_SUBFOLDER}/{agentid}/{file_name}"

        file_list.append(
            {
                "file_name": file_name,
                "file_url": file_url,
                "mime_type": mime_type or "unknown",
                "size_bytes": os.path.getsize(file_path),
            }
        )

    return Response({"files": file_list}, status=status.HTTP_200_OK)


class TaskStatusCountAPIView(APIView):
    def get(self, request):
        apikey = request.GET.get("apikey")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        type = request.GET.get("type")

        if not apikey:
            return Response({"error": "apikey is required"}, status=status.HTTP_400_BAD_REQUEST)            
        
        try:
            generated_api = GeneratedAPI.objects.select_related("apps", "user").get(api_key=apikey)
        except GeneratedAPI.DoesNotExist:
            return Response({"error": "Invalid apikey"}, status=status.HTTP_404_NOT_FOUND)
        
        if type == "inbound":
            if not start_date or not end_date:
                return Response({"error": "start_date and end_date are required"}, status=status.HTTP_400_BAD_REQUEST)
            call_logs = CallLog.objects.filter(app=generated_api.apps, user__client=generated_api.user.client, created_at__date__range=[start_date, end_date], call_id__contains="call-")
            status_counts = (
                call_logs.values("status")
                .annotate(count=Count("status"))
                .order_by("status")
            )

            # Convert to dictionary for cleaner API response
            data = {item["status"]: item["count"] for item in status_counts}
            return Response(data, status=status.HTTP_200_OK)


        qs = AgentTask.objects.filter(apikey=generated_api.apps, user=generated_api.user)


        if start_date and end_date:
            qs = qs.filter(created_at__date__range=[start_date, end_date])

        all = qs.count()

        status_counts = (
            qs.values("status")
            .annotate(count=Count("status"))
            .order_by("status")
        )

        # Convert to dictionary for cleaner API response
        data = {item["status"]: item["count"] for item in status_counts}
        data["all"] = all



        return Response(data, status=status.HTTP_200_OK)

from django.db.models import Q

class DepartmentTaskStatusCountAPIView(APIView):
    def get(self, request, id):
        try:
            module = Module.objects.get(id=id)
        except Module.DoesNotExist:
            return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)

        # ✅ Get client from token
        client_id = request.user.client_id  # assuming User has FK to Client
        try:
            client = Client.objects.get(id=client_id)
        except Client.DoesNotExist:
            return Response({"error": "Client not found"}, status=status.HTTP_404_NOT_FOUND)


        apps = App.objects.filter(module=module).filter(
            Q(client=client) | Q(client__isnull=True)
        )



        result = []
        for app in apps:
            qs = AgentTask.objects.filter(apikey=app, user=request.user)
            
            all_count = qs.count()
            status_counts = (
                qs.values("status")
                .annotate(count=Count("status"))
                .order_by("status")
            )

            # Convert queryset to dict
            data = {item["status"]: item["count"] for item in status_counts}
            data["all"] = all_count
            data["app_id"] = app.id
            data["app_name"] = app.app_name
            result.append(data)

        return Response(result, status=status.HTTP_200_OK)


@api_view(["GET"])
def today_status_counts(request):
    today = now().date()
    qs = AgentTask.objects.filter(created_at__date=today)

    counts = qs.values("status").annotate(count=Count("id"))
    data = {status: 0 for status, _ in AgentTask.STATUS_CHOICES}
    for item in counts:
        data[item["status"]] = item["count"]

    data["total"] = sum(data.values())
    return Response(data)


# 2nd API - Overall status counts
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def overall_status_counts(request):
    user = request.user
    agent_id = request.query_params.get("agent_id")
    app = App.objects.get(id=agent_id)
    qs = AgentTask.objects.all()
    counts = qs.filter(apikey=app, user=user).values("status").annotate(count=Count("id"))
    data = {status: 0 for status, _ in AgentTask.STATUS_CHOICES}
    for item in counts:
        data[item["status"]] = item["count"]

    data["total"] = sum(data.values())
    return Response(data)


# 3rd API - Today's overall count, success count, failure count
@api_view(["GET"])
def today_success_failure_counts(request):
    today = now().date()
    qs = AgentTask.objects.filter(created_at__date=today)

    data = {
        "today_total": qs.count(),
        "today_success": qs.filter(status="SUCCESS").count(),
        "today_failure": qs.filter(status="FAILURE").count(),
    }
    return Response(data)


@api_view(["GET"])
def request_by_day(request):
    user = request.user
    agent_id = request.query_params.get("agent_id")
    # Get query params (format: YYYY-MM-DD)
    from_date = request.query_params.get("from_date")
    to_date = request.query_params.get("to_date")

    if not from_date or not to_date:
        return Response({"error": "from_date and to_date are required"}, status=400)

    # Query & group by date
    qs = (
        AgentTask.objects.filter(created_at__range=[from_date, to_date], user=user, apikey__id=agent_id)
        .annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    # Format for chart (x = date, y = count)
    data = [{"date": row["date"].strftime("%Y-%m-%d"), "count": row["count"]} for row in qs]

    return Response(data)

from django.db.models import Count
from django.db.models.functions import TruncDate, TruncMonth
from rest_framework.decorators import api_view
from rest_framework.response import Response
import calendar

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def request_status_by_day(request):
    user = request.user
    agent_id = request.query_params.get("agent_id")
    from_date = request.query_params.get("from_date")
    to_date = request.query_params.get("to_date")

    if not agent_id:
        return Response({"error": "agent_id is required"}, status=400)

    if not from_date or not to_date:
        return Response({"error": "from_date and to_date are required"}, status=400)

    qs = (
        AgentTask.objects.filter(user = user, apikey__id=agent_id, created_at__date__range=[from_date, to_date])
        .annotate(date=TruncDate("created_at"))
        .values("date", "status")
        .annotate(count=Count("id"))
        .order_by("date", "status")
    )

    # Transform into a dictionary grouped by date
    grouped = {}
    for row in qs:
        date_str = row["date"].strftime("%Y-%m-%d")
        if date_str not in grouped:
            grouped[date_str] = {status: 0 for status, _ in AgentTask.STATUS_CHOICES}
        grouped[date_str][row["status"]] = row["count"]

    # Convert to list for easier chart consumption
    data = [
        {"date": date, **status_counts}
        for date, status_counts in grouped.items()
    ]

    return Response(data)


@api_view(["GET"])

@permission_classes([IsAuthenticated])

def request_status_by_month(request):

    user = request.user

    agent_id = request.query_params.get("agent_id")

    from_date = request.query_params.get("from_date")

    to_date = request.query_params.get("to_date")
 
    if not agent_id:

        return Response({"error": "agent_id is required"}, status=400)
 
    if not from_date or not to_date:

        return Response({"error": "from_date and to_date are required"}, status=400)
 
    qs = (

        AgentTask.objects.filter(

            user=user,

            apikey__id=agent_id,

            created_at__date__range=[from_date, to_date],

        )

        .annotate(month=TruncMonth("created_at"))

        .values("month", "status")

        .annotate(count=Count("id"))

        .order_by("month", "status")

    )
 
    # Group by month

    grouped = {}

    for row in qs:

        month_str = row["month"].strftime("%Y-%m")  # YYYY-MM

        if month_str not in grouped:

            grouped[month_str] = {status: 0 for status, _ in AgentTask.STATUS_CHOICES}

        grouped[month_str][row["status"]] = row["count"]
 
    # Format data for charts

    data = [

        {

            "month": month,

            "month_name": calendar.month_name[int(month.split("-")[1])],  # Jan, Feb etc

            **status_counts,

        }

        for month, status_counts in grouped.items()

    ]
 
    return Response(data)
 

# 4th API - Monthly overall count, success count, failure count
@api_view(["GET"])
def monthly_success_failure_counts(request):
    today = now()
    qs = AgentTask.objects.filter(
        created_at__year=today.year, created_at__month=today.month
    )

    data = {
        "monthly_total": qs.count(),
        "monthly_success": qs.filter(status="SUCCESS").count(),
        "monthly_failure": qs.filter(status="FAILURE").count(),
    }
    return Response(data)


@api_view(["GET"])
def rowdata_count(request):
    total_rows = AgentTask.objects.count()
    return Response({"rowdata_count": total_rows})


@api_view(["GET"])
def user_rowdata_count(request, user_id):
    user_rows = AgentTask.objects.filter(user_id=user_id).count()
    return Response({
        "user_id": user_id,
        "rowdata_count": user_rows
    })


@api_view(["POST"])
def update_task_status(request, task_id):
    """
    Update the task status by task_id.
    Expected body: {"status": "NEW" | "PENDING" | "SUCCESS" | "FAILURE" | "NEEDS-ATTENTION"}
    """
    try:
        task = AgentTask.objects.get(id=task_id)
    except AgentTask.DoesNotExist:
        return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get("status")
    valid_statuses = dict(AgentTask.STATUS_CHOICES).keys()

    if new_status not in valid_statuses:
        return Response({"error": f"Invalid status. Must be one of {list(valid_statuses)}"}, 
                        status=status.HTTP_400_BAD_REQUEST)

    # Update status
    task.status = new_status

    # ✅ Reset retry counter when status becomes NEW
    if new_status == "NEW":
        task.current_retry = 0

    task.save(update_fields=["status", "current_retry", "status_changed_at"])

    return Response(
        {
            "message": "Task status updated successfully",
            "task_id": task.id,
            "new_status": task.status,
            "current_retry": task.current_retry,
        },
        status=status.HTTP_200_OK
    )


class InstructionView(viewsets.ModelViewSet):
    queryset = Instructions.objects.all()
    serializer_class = InstructionSerializer

    def perform_create(self, serializer):
        client = self.request.user.client
        serializer.save(client=client)

from rest_framework.parsers import MultiPartParser, FormParser

class UpdatePdfView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        pdf_file = request.FILES.get("file")
        file_path = request.data.get("file_path")

        if not pdf_file:
            return JsonResponse({"error": "No PDF file provided"}, status=400)

        if not file_path:
            return JsonResponse({"error": "file_path is required"}, status=400)

        # Normalize and ensure path is within MEDIA_ROOT for security
        abs_path = os.path.abspath(os.path.join(settings.BASE_DIR, file_path))
        media_root_abs = os.path.abspath(settings.MEDIA_ROOT)

        if not abs_path.startswith(media_root_abs):
            return JsonResponse({"error": "Invalid file path"}, status=400)

        # Ensure directory exists
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)

        # Overwrite the file
        with open(abs_path, "wb+") as destination:
            for chunk in pdf_file.chunks():
                destination.write(chunk)

        # Optionally return URL for frontend preview
        relative_url = abs_path.replace(media_root_abs + "/", settings.MEDIA_URL)
        return JsonResponse({
            "message": "PDF updated successfully",
            "file_url": relative_url,
        })


class AgentTaskDataUpdateView(APIView):
    def patch(self, request, pk):
        try:
            task = AgentTask.objects.get(pk=pk)
        except AgentTask.DoesNotExist:
            return Response({"error": "AgentTask not found."}, status=status.HTTP_404_NOT_FOUND)

        # ── Support both single and bulk update ───────────────────────────────
        # Single:  {"key": "call_status", "value": "connected"}
        # Bulk:    {"updates": {"call_status": "connected", "room": "outbound-123"}}
        updates = request.data.get("updates")  # bulk

        if updates:
            if not isinstance(updates, dict):
                return Response({"error": "updates must be a dict."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Fall back to single key/value
            key   = request.data.get("key")
            value = request.data.get("value")
            if not key:
                return Response({"error": "key or updates is required."}, status=status.HTTP_400_BAD_REQUEST)
            updates = {key: value}

        task.data.update(updates)
        task.save(update_fields=["data"])

        return Response({"message": "Data updated successfully.", "data": task.data})



class CallStatusCheckView(APIView):
    """
    GET /agent-tasks/<pk>/call-status/
    Returns live call status by checking LiveKit + Twilio using stored task data.
    """
    def get(self, request, pk):
        try:
            task = AgentTask.objects.get(pk=pk)
        except AgentTask.DoesNotExist:
            return Response({"error": "AgentTask not found."}, status=status.HTTP_404_NOT_FOUND)

        data        = task.data or {}
        room_name   = data.get("livekit_room")
        call_status = data.get("call_status")

        if not room_name:
            return Response({
                "call_in_progress": False,
                "reason":           "no livekit_room in task data",
                "stored_status":    call_status,
            })

        # Run async checks in sync Django view
        result = asyncio.run(_check_call_status(room_name, data))
        return Response(result)


async def _check_call_status(room_name: str, stored_data: dict) -> dict:
    livekit_url        = os.getenv("LIVEKIT_URL")
    livekit_api_key    = os.getenv("LIVEKIT_API_KEY")
    livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")
    twilio_sid         = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token       = os.getenv("TWILIO_AUTH_TOKEN")

    result = {
        "call_in_progress":   False,
        "stored_status":      stored_data.get("call_status"),
        "livekit_room":       room_name,
        "to_number":          stored_data.get("to_number"),
        "from_number":        stored_data.get("from_number"),
        "dial_time":          stored_data.get("dial_time"),
        "livekit_status":     None,
        "livekit_participants": 0,
        "sip_participant_id": stored_data.get("sip_participant_id"),
        "twilio_call_sid":    None,
        "twilio_status":      None,
    }

    # ── LiveKit check ─────────────────────────────────────────────────────────
    try:
        lk = lk_api.LiveKitAPI(
            url=livekit_url,
            api_key=livekit_api_key,
            api_secret=livekit_api_secret,
        )
        resp = await lk.room.list_participants(
            lk_api.ListParticipantsRequest(room=room_name)
        )
        await lk.aclose()

        participant_count = len(resp.participants)
        result["livekit_participants"] = participant_count

        # Find SIP participant and grab Twilio call SID from attributes
        for p in resp.participants:
            if p.kind == 3:  # SIP
                attrs = dict(p.attributes or {})
                call_sid = (
                    attrs.get("sip.twilio.callSid") or
                    attrs.get("sip.callSid")
                )
                result["twilio_call_sid"]    = call_sid
                result["livekit_status"]     = "sip_active"
                result["call_in_progress"]   = True
                break
        else:
            result["livekit_status"] = "no_sip_participant" if participant_count > 0 else "room_empty"

    except Exception as e:
        result["livekit_status"] = f"error: {str(e)}"

    # ── Twilio check ──────────────────────────────────────────────────────────
    call_sid = result.get("twilio_call_sid")
    if call_sid and twilio_sid and twilio_token:
        try:
            from twilio.rest import Client
            twilio_client = Client(twilio_sid, twilio_token)

            import asyncio
            call = await asyncio.to_thread(twilio_client.calls(call_sid).fetch)
            result["twilio_status"] = call.status

            # Twilio is authoritative — override livekit guess
            active_statuses = {"in-progress", "ringing", "queued"}
            result["call_in_progress"] = call.status in active_statuses

        except Exception as e:
            result["twilio_status"] = f"error: {str(e)}"

    return result