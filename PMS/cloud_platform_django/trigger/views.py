from rest_framework import viewsets
from .models import *
from .serializers import *
from rest_framework.response import Response
from rest_framework import status as http_status
from django.utils import timezone
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
import pytz
import json
from datetime import datetime
from rest_framework.views import APIView
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
import pika
from licenses.models import Machine
class TriggerDetailsViewSet(viewsets.ModelViewSet):
    queryset = TriggerDetails.objects.all().order_by('-created_at')
    serializer_class = TriggerDetailsSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user) 

    def get_queryset(self):
        user = self.request.user
        queryset = TriggerDetails.objects.filter(user=user).order_by('-created_at')

        return queryset

US_TIMEZONES = {
  "SST": "Pacific/Midway",
  "HST": "Pacific/Honolulu",
  "AKST": "America/Juneau",
  "MST": "America/Boise",
  "MST2": "America/Dawson",
  "MST3": "America/Chihuahua",
  "MST4": "America/Phoenix",
  "CST": "America/Chicago",
  "CST2": "America/Regina",
  "CST3": "America/Mexico_City",
  "CST4": "America/Belize",
  "EST": "America/Detroit",
  "COT": "America/Bogota",
  "VET": "America/Caracas",
  "CLT": "America/Santiago",
  "NST": "America/St_Johns",
  "BRT": "America/Sao_Paulo",
  "PST": "America/Tijuana",
  "UYT": "America/Montevideo",
  "ART": "America/Argentina/Buenos_Aires",
  "WGT": "America/Godthab",
  "PST2": "America/Los_Angeles",
  "AZOT": "Atlantic/Azores",
  "CVT": "Atlantic/Cape_Verde",
  "UTC": "GMT",
  "GMT": "Europe/London",
  "GMT2": "Europe/Dublin",
  "WET": "Europe/Lisbon",
  "WET2": "Africa/Casablanca",
  "WET3": "Atlantic/Canary",
  "CET": "Europe/Belgrade",
  "CET2": "Europe/Sarajevo",
  "CET3": "Europe/Brussels",
  "CET4": "Europe/Amsterdam",
  "WAT": "Africa/Algiers",
  "EET": "Europe/Bucharest",
  "EET2": "Africa/Cairo",
  "EET3": "Europe/Helsinki",
  "EET4": "Europe/Athens",
  "IST": "Asia/Jerusalem",
  "CAT": "Africa/Harare",
  "MSK": "Europe/Moscow",
  "AST": "Asia/Kuwait",
  "EAT": "Africa/Nairobi",
  "AST2": "Asia/Baghdad",
  "IRST": "Asia/Tehran",
  "GST": "Asia/Dubai",
  "AZT": "Asia/Baku",
  "AFT": "Asia/Kabul",
  "YEKT": "Asia/Yekaterinburg",
  "PKT": "Asia/Karachi",
  "IST2": "Asia/Kolkata",
  "NPT": "Asia/Kathmandu",
  "BST": "Asia/Dhaka",
  "SLST": "Asia/Colombo",
  "ALMT": "Asia/Almaty",
  "MMT": "Asia/Rangoon",
  "ICT": "Asia/Bangkok",
  "KRAT": "Asia/Krasnoyarsk",
  "CST6": "Asia/Shanghai",
  "MYT": "Asia/Kuala_Lumpur",
  "CST7": "Asia/Taipei",
  "AWST": "Australia/Perth",
  "IRKT": "Asia/Irkutsk",
  "KST": "Asia/Seoul",
  "JST": "Asia/Tokyo",
  "YAKT": "Asia/Yakutsk",
  "ACST": "Australia/Darwin",
  "ACDT": "Australia/Adelaide",
  "AEST": "Australia/Sydney",
  "AEST2": "Australia/Brisbane",
  "AEDT": "Australia/Hobart",
  "VLAT": "Asia/Vladivostok",
  "CHST": "Pacific/Guam",
  "MAGT": "Asia/Magadan",
  "PETT": "Asia/Kamchatka",
  "FJT": "Pacific/Fiji",
  "NZST": "Pacific/Auckland",
  "TOT": "Pacific/Tongatapu"
}

UTC_TZ = pytz.UTC


def convert_to_utc_time(time_str, source_tz_name, date=None):
    if not date:
        date = datetime.now(pytz.timezone(source_tz_name)).date()
    hour, minute = map(int, time_str.split(':'))
    source_tz = pytz.timezone(source_tz_name)
    local_dt = source_tz.localize(datetime(date.year, date.month, date.day, hour, minute))
    utc_dt = local_dt.astimezone(UTC_TZ)
    return utc_dt.hour, utc_dt.minute


def generate_cron_for_daily(schedule, timezone):
    crons = []
    source_tz = US_TIMEZONES.get(timezone)
    if not source_tz:
        raise ValueError(f"Invalid timezone: {timezone}")

    day_of_week = '*'
    if schedule.get('weekendSupport') == 'weekdays':
        day_of_week = '1-5'
    elif schedule.get('weekendSupport') == 'weekends':
        day_of_week = '0,6'

    if schedule['mode'] == 'once':
        hour, minute = convert_to_utc_time(schedule['time'], source_tz)
        cron = f"{minute} {hour} * * {day_of_week}"
        crons.append(cron)
    elif schedule['mode'] == 'interval':
        start_hour, start_minute = convert_to_utc_time(schedule['startTime'], source_tz)
        end_hour, end_minute = convert_to_utc_time(schedule['endTime'], source_tz)
        interval = int(schedule['interval'])
        unit = schedule['intervalUnit']

        if unit == 'hours':
            interval *= 60

        if interval < 60:
            minute_step = f"*/{interval}"
            hour_range = f"{start_hour}-{end_hour}" if start_hour != end_hour else str(start_hour)
        else:
            minute_step = str(start_minute)
            hours_interval = interval // 60
            hour_range = f"{start_hour}-{end_hour}/{hours_interval}" if start_hour != end_hour else f"{start_hour}/{hours_interval}"

        cron = f"{minute_step} {hour_range} * * {day_of_week}"
        crons.append(cron)

    return crons


def generate_cron_for_weekly(schedule, timezone):
    source_tz = US_TIMEZONES.get(timezone)
    if not source_tz:
        raise ValueError(f"Invalid timezone: {timezone}")

    hour, minute = convert_to_utc_time(schedule['time'], source_tz)

    day_map = {'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6}
    days = [str(day_map[day]) for day in schedule['days'] if day in day_map]
    if not days:
        raise ValueError("No valid days selected")
    day_of_week = ','.join(days)

    return [f"{minute} {hour} * * {day_of_week}"]


def generate_cron_for_monthly(schedule, timezone):
    source_tz = US_TIMEZONES.get(timezone)
    if not source_tz:
        raise ValueError(f"Invalid timezone: {timezone}")

    hour, minute = convert_to_utc_time(schedule['time'], source_tz)

    day_map = {'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6}
    day_of_week = day_map.get(schedule['day'])
    if day_of_week is None:
        raise ValueError(f"Invalid day: {schedule['day']}")

    week_map = {'First': '1-7', 'Second': '8-14', 'Third': '15-21', 'Fourth': '22-28', 'Last': '22-31'}
    day_of_month = week_map.get(schedule['week'])
    if not day_of_month:
        raise ValueError(f"Invalid week: {schedule['week']}")

    return [f"{minute} {hour} {day_of_month} * {day_of_week}"]


class CronGeneratorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            timezone = request.data.get('timezone', '')
            schedules = request.data.get('schedules', [])

            if not timezone or not schedules:
                return Response({'error': 'Missing timezone or schedules'}, status=status.HTTP_400_BAD_REQUEST)

            cron_jobs = []
            for schedule in schedules:
                schedule_type = schedule.get('type')
                if schedule_type == 'daily':
                    crons = generate_cron_for_daily(schedule, timezone)
                elif schedule_type == 'weekly':
                    crons = generate_cron_for_weekly(schedule, timezone)
                elif schedule_type == 'monthly':
                    crons = generate_cron_for_monthly(schedule, timezone)
                elif schedule_type == 'advanced':
                    crons = [schedule.get('cron', '')]
                else:
                    continue

                cron_jobs.extend([f"{cron}" for cron in crons])

            return Response({
                'cron_jobs': cron_jobs,
                'timezone': 'UTC'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

def send_cron_job_to_machine(queue_name, command, schedule, task_id,machineip,machineuname,machinepwd,height,width,scaling,agentid,action):
    credentials = pika.PlainCredentials('cloud-droidal', 'clouD-D#roidal')
    params = pika.ConnectionParameters(
        host='54.164.40.218',  # Your RabbitMQ host
        port=5672,
        virtual_host='/',
        credentials=credentials
    )

    # Establish the connection and channel
    connection = pika.BlockingConnection(params)
    channel = connection.channel()

    # Declare the queue (make sure the queue exists)
    channel.queue_declare(queue=queue_name, durable=True)

    # Prepare the message payload with task_id
    payload = {
        'action': action,
        'command': command,
        'schedule': schedule,
        'task_id': task_id,
        'machineip':machineip,
        'machineuname':machineuname,
        'machinepwd':machinepwd,
        'height':height,
        'width':width,
        'scaling':scaling,
        'agentid':agentid,
    }

    # Publish the message to the queue
    channel.basic_publish(
        exchange='',
        routing_key=queue_name,
        body=json.dumps(payload),
        properties=pika.BasicProperties(delivery_mode=2)  # Ensure durability
    )

    # Close the connection
    connection.close()
    print(f"[Producer] Cron job request sent for task ID {task_id}.")


@csrf_exempt
def triggerflag(request):
    if request.method == 'POST':
        triggerid = request.POST['triggerid']
        flag_value = request.POST['flag_value']
        machine_id = request.POST['machine_id']

        triggerdata = TriggerDetails.objects.get(trigger_id=triggerid) 
        taskid = triggerdata.task.id   # returns the primary key of the linked Task
        scaling = triggerdata.scaling or "100"
        schedule = triggerdata.cron_query
        agentid = triggerdata.agentid
        actions = {
            '0': 'delete_cron',
            '1': 'create_cron',
            '2': 'start_trigger',
            '3': 'stop_trigger'
        }
        action = actions.get(flag_value, 'unknown')

        triggerdata.cron_flag = flag_value
        triggerdata.save()

        machine = Machine.objects.get(id=machine_id)
        send_cron_job_to_machine(
            queue_name="client.createcron",
            command=f"client.{machine.machine_username}.{machine.machine_ip.replace('.', '-')}",
            schedule=schedule,
            task_id=taskid,
            machineip=machine.machine_ip,
            machineuname=machine.machine_username,
            machinepwd=machine.machine_password,
            height=machine.height,
            width=machine.width,
            scaling=scaling,
            agentid = agentid,
            action=action
        )

        return JsonResponse({'status': 'success', 'action': action})

class TriggerStatusAPIView(APIView):
    def post(self, request, trigger_id, *args, **kwargs):
        status_value = request.data.get("status")
        reason = request.data.get("reason", "")  # optional reason for failure

        if not status_value:
            return Response({"error": "status is required"},
                            status=http_status.HTTP_400_BAD_REQUEST)

        try:
            trigger = TriggerDetails.objects.get(trigger_id=trigger_id)
        except TriggerDetails.DoesNotExist:
            return Response({"error": "Trigger not found"},
                            status=http_status.HTTP_404_NOT_FOUND)

        # Case 1: started → create new record
        if status_value == "started":
            ts = TriggerStatus.objects.create(
                trigger=trigger,
                status="started",
                start_date=timezone.now()
            )
            serializer = TriggerStatusSerializer(ts)
            return Response(serializer.data, status=http_status.HTTP_201_CREATED)

        # Case 2: success/failure → update last started record
        elif status_value in ["success", "failure"]:
            last_started = TriggerStatus.objects.filter(
                trigger=trigger, status="started"
            ).order_by("-created_at").first()

            if not last_started:
                return Response({"error": "No started trigger found to update"},
                                status=http_status.HTTP_400_BAD_REQUEST)

            last_started.status = status_value
            last_started.end_date = timezone.now()

            if status_value == "failure":
                last_started.exception = reason if reason else ""

            last_started.save()

            serializer = TriggerStatusSerializer(last_started)
            return Response(serializer.data, status=http_status.HTTP_200_OK)

        else:
            return Response({"error": "Invalid status value"},
                            status=http_status.HTTP_400_BAD_REQUEST)
    
    # GET → with filters
    def get(self, request, trigger_id, *args, **kwargs):
        try:
            trigger = TriggerDetails.objects.get(trigger_id=trigger_id)
        except TriggerDetails.DoesNotExist:
            return Response({"error": "Trigger not found"},
                            status=http_status.HTTP_404_NOT_FOUND)

        qs = TriggerStatus.objects.filter(trigger=trigger)

        # filter by status (ex: ?status=failure)
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        # filter by exact date (ex: ?date=2025-09-26)
        date_str = request.query_params.get("date")
        if date_str:
            try:
                qs = qs.filter(start_date__date=date_str)
            except ValueError:
                return Response({"error": "Invalid date format, use YYYY-MM-DD"},
                                status=http_status.HTTP_400_BAD_REQUEST)

        # filter by date range (ex: ?start_date=2025-09-20&end_date=2025-09-26)
        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")
        if start_date_str and end_date_str:
            try:
                qs = qs.filter(start_date__date__gte=start_date_str,
                               start_date__date__lte=end_date_str)
            except ValueError:
                return Response({"error": "Invalid date range format, use YYYY-MM-DD"},
                                status=http_status.HTTP_400_BAD_REQUEST)

        # filter where exception contains keyword (ex: ?reason_contains=timeout)
        reason_filter = request.query_params.get("reason_contains")
        if reason_filter:
            qs = qs.filter(exception__icontains=reason_filter)

        # configurable limit (default = 10)
        try:
            limit = int(request.query_params.get("limit", 10))
        except ValueError:
            return Response({"error": "Invalid limit value, must be integer"},
                            status=http_status.HTTP_400_BAD_REQUEST)

        qs = qs.order_by("-created_at")[:limit]

        serializer = TriggerStatusSerializer(qs, many=True)
        return Response(serializer.data, status=http_status.HTTP_200_OK)