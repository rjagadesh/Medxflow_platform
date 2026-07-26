# patient/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Patient
from .serializers import PatientSerializer
from django_tenants.utils import schema_context
from django.db import connection
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from tenant_telehealth.services import ChimeService
from django_tenants.utils import get_tenant_model, schema_context
from rest_framework.permissions import IsAuthenticated
from .models import PatientProvider,Appointment
from .serializers import * #PatientProviderSerializer, AppointmentSerializer, MinimalPatientSerializer, MinimalPatientProviderSerializer
from tenant_encounter.models import Encounter
from tenant_claim_submission.models import Claim
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from django.core.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from middleware.helper import StediClient
stedi = StediClient() 
from datetime import datetime, time, timedelta
from datetime import date, datetime
import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

TenantModel = get_tenant_model()

def get_changed_fields(old_obj, new_data):
    changes = {}

    for field, new_value in new_data.items():
        old_value = getattr(old_obj, field, None)
        if old_value != new_value:
            changes[field] = {
                "old": old_value,
                "new": new_value
            }

    return changes
    
class IsOwnerOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj.patient == obj  # adjust if needed

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('last_name', 'first_name')
    serializer_class = PatientSerializer
    lookup_field = 'id'
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Patient.objects.all()
    

class TenantAPIView(APIView):

    def dispatch(self, request, *args, **kwargs):

        tenant = getattr(request, "tenant", None)

        if tenant and tenant.schema_name:
            with schema_context(tenant.schema_name):
                return super().dispatch(request, *args, **kwargs)

        return super().dispatch(request, *args, **kwargs)
    
class PatientsView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Patient.objects.all().order_by("created_at")

        # -------------------------
        # Query params
        # -------------------------
        all = request.query_params.get("all")
        search = request.query_params.get("search")
        name = request.query_params.get("name")
        address = request.query_params.get("address")
        dob = request.query_params.get("dob")
        ssn = request.query_params.get("ssn")
        home_phone = request.query_params.get("home_phone")
        mobile_phone = request.query_params.get("mobile_phone")
        mrn = request.query_params.get("mrn")
        guarantor = request.query_params.get("guarantor")
        page_size = request.query_params.get("page_size")
        email = request.query_params.get("email")

        # -------------------------
        # GLOBAL SEARCH (Headers only)
        # -------------------------

        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(address__icontains=search) |
                Q(dob__icontains=search) |
                Q(ssn__icontains=search) |
                Q(home_phone__icontains=search) |
                Q(mobile_phone__icontains=search) |
                Q(mrn__icontains=search) |
                Q(emergency_name__icontains=search)  # Guarantor
            )

        # -------------------------
        # SPECIFIC FIELD FILTERS
        # -------------------------
        if name:
            qs = qs.filter(
                Q(first_name__icontains=name) |
                Q(last_name__icontains=name)
            )

        if address:
            qs = qs.filter(address__icontains=address)

        if dob:
            qs = qs.filter(dob=dob)

        if ssn:
            qs = qs.filter(ssn__icontains=ssn)

        if home_phone:
            qs = qs.filter(home_phone__icontains=home_phone)

        if mobile_phone:
            qs = qs.filter(mobile_phone__icontains=mobile_phone)

        if mrn:
            qs = qs.filter(mrn__icontains=mrn)

        if guarantor:
            qs = qs.filter(emergency_name__icontains=guarantor)
        
        if email:
            qs = qs.filter(email__icontains = email)


        # -------------------------
        # PAGINATION (MANDATORY)
        # -------------------------
        paginator = PageNumberPagination()
        paginator.page_size = int(page_size) if page_size else 10

        page = paginator.paginate_queryset(qs, request, view=self)

        serializer = PatientSerializer(
            page,
            many=True,
            context={"request": request}
        )

        return paginator.get_paginated_response(serializer.data)

class PatientDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        serializer = PatientSerializer(patient, context={"request": request})
        return Response(serializer.data)

    def put(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        serializer = PatientSerializer(patient, data=request.data, context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Patient updated successfully", "patient": serializer.data}
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        serializer = PatientSerializer(patient, data=request.data, partial=True, context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Patient partially updated", "patient": serializer.data}
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        patient.delete()
        return Response({"message": "Patient deleted"}, status=status.HTTP_204_NO_CONTENT)
        

class ProvidersView(TenantAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = PatientProvider.objects.all().order_by("created_at")

        # -------------------------
        # Query params
        # -------------------------
        search = request.query_params.get("search")
        name = request.query_params.get("name")
        specialty = request.query_params.get("specialty")
        sub_specialty = request.query_params.get("sub_specialty")
        provider_type = request.query_params.get("provider_type")
        practice_name = request.query_params.get("practice_name")
        organization_name = request.query_params.get("organization_name")
        npi = request.query_params.get("npi")
        city = request.query_params.get("city")
        state = request.query_params.get("state")
        page_size = request.query_params.get("page_size")
        email = request.query_params.get("email")

        # -------------------------
        # GLOBAL SEARCH
        # -------------------------
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(specialty__icontains=search) |
                Q(sub_specialty__icontains=search) |
                Q(provider_type__icontains=search) |
                Q(practice_name__icontains=search) |
                Q(organization_name__icontains=search) |
                Q(NPI__icontains=search) |
                Q(medical_license_number__icontains=search) |
                Q(taxid_ein__icontains=search) |
                Q(taxid_ssn__icontains=search) |
                Q(city__icontains=search) |
                Q(state__icontains=search) |
                Q(country__icontains=search) |
                Q(email__icontains=search)
            )

        # -------------------------
        # COLUMN FILTERS
        # -------------------------
        if name:
            qs = qs.filter(
                Q(first_name__icontains=name) |
                Q(last_name__icontains=name)
            )

        if specialty:
            qs = qs.filter(specialty__icontains=specialty)

        if sub_specialty:
            qs = qs.filter(sub_specialty__icontains=sub_specialty)

        if provider_type:
            qs = qs.filter(provider_type__icontains=provider_type)

        if practice_name:
            qs = qs.filter(practice_name__icontains=practice_name)

        if organization_name:
            qs = qs.filter(organization_name__icontains=organization_name)

        if npi:
            qs = qs.filter(NPI__icontains=npi)

        if city:
            qs = qs.filter(city__icontains=city)

        if state:
            qs = qs.filter(state__icontains=state)

        if email:
            qs = qs.filter(state__icontains=email)

        # else:
        #     return Response({"Error":"No Records Found"},status=status.HTTP_400_BAD_REQUEST)

        # -------------------------
        # PAGINATION (MANDATORY)
        # -------------------------
        paginator = PageNumberPagination()
        paginator.page_size = int(page_size) if page_size else 10

        page = paginator.paginate_queryset(qs, request, view=self)

        serializer = PatientProviderSerializer(
            page,
            many=True,
            context={"request": request}
        )

        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = PatientProviderSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Provider created successfully", "provider": serializer.data},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProviderDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        provider = get_object_or_404(PatientProvider, pk=pk)
        serializer = PatientProviderSerializer(provider , context={"request": request})
        return Response(serializer.data)

    def put(self, request, pk):
        provider = get_object_or_404(PatientProvider, pk=pk)
        serializer = PatientProviderSerializer(provider, data=request.data, context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Provider updated successfully", "provider": serializer.data}
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        provider = get_object_or_404(PatientProvider, pk=pk)
        serializer = PatientProviderSerializer(provider, data=request.data, partial=True , context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Provider partially updated", "provider": serializer.data}
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        provider = get_object_or_404(PatientProvider, pk=pk)
        provider.delete()
        return Response({"message": "Provider deleted"}, status=status.HTTP_204_NO_CONTENT)


class AppointmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Appointment.objects.all().order_by("id")

        from_date = request.query_params.get("from_date")
        to_date = request.query_params.get("to_date")
        include_meeting_info = request.query_params.get(
            "include_meeting_info", "false"
        ).lower() == "true"

        if from_date:
            qs = qs.filter(date__gte=from_date)
        if to_date:
            qs = qs.filter(date__lte=to_date)

        serializer = AppointmentSerializer(qs, many=True)

        appointments = serializer.data

        for item in appointments:
            appointment = Appointment.objects.filter(id=item["id"]).select_related("patient").first()
            if appointment and appointment.patient:
                item["insurance_name"] = appointment.patient.insurance_name
            file_data = Document.objects.filter(appointment_id=item['id']).values('file_name', 'file_path')
            item['documents'] = list(file_data)

        response_data = {
            "count": len(appointments),
            "appointments": appointments
        }

        # response_data = {
        #     "count": len(serializer.data),
        #     "appointments": serializer.data
        # }

        if include_meeting_info:
            for appointment_data in response_data["appointments"]:
                appointment = Appointment.objects.filter(
                    id=appointment_data["id"]
                ).first()

                if not appointment:
                    continue

                meeting = TelehealthMeeting.objects.filter(
                    appoinment=appointment,
                    is_active=True
                ).first()

                if meeting:
                    appointment_data["meeting_info"] = {
                        "meeting_id": meeting.id,
                        "status": meeting.status,
                        "scheduled_start_time": meeting.scheduled_start_time,
                        "meeting_link": serializer.get_meeting_link(appointment),
                        "can_start": self._can_start_meeting(meeting)
                    }

        return Response(response_data)

    # --------------------------------------------------
    # CREATE
    # --------------------------------------------------
    def post(self, request):
        serializer = AppointmentSerializer(data=request.data)

        if serializer.is_valid():
            appointment = serializer.save()

            response_data = {
                "message": "Appointment created successfully",
                "appointment": AppointmentSerializer(appointment).data
            }

            meeting = TelehealthMeeting.objects.filter(
                appoinment=appointment,
                is_active=True
            ).first()

            if meeting:
                response_data["message"] = (
                    "Appointment and telehealth meeting created successfully"
                )
                response_data["telehealth_meeting"] = {
                    "meeting_id": meeting.id,
                    "scheduled_start_time": meeting.scheduled_start_time,
                    "status": meeting.status,
                    "emails_sent": meeting.creation_email_sent
                }

            return Response(response_data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # --------------------------------------------------
    # FULL UPDATE (PUT)
    # --------------------------------------------------
    def put(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        old_appointment = Appointment.objects.get(pk=pk)

        serializer = AppointmentSerializer(
            appointment,
            data=request.data,
            partial=False   # PUT = full update
        )

        if serializer.is_valid():
            serializer.save()
            changed_fields = get_changed_fields(
                old_appointment,
                serializer.validated_data
            )

            EmailService.send_appointment_updated_email(
                appointment,
                changed_fields
            )
            return Response(
                {
                    "message": "Appointment updated successfully",
                    "appointment": serializer.data
                }
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        old_appointment = Appointment.objects.get(pk=pk)
        
        serializer = AppointmentSerializer(
            appointment,
            data=request.data,
            partial=True    # PATCH = partial update
        )

        if serializer.is_valid():
            serializer.save()
            changed_fields = get_changed_fields(
                old_appointment,
                serializer.validated_data
            )

            EmailService.send_appointment_updated_email(
                appointment,
                changed_fields
            )
            return Response(
                {
                    "message": "Appointment partially updated successfully",
                    "appointment": serializer.data
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # --------------------------------------------------
    # Meeting start eligibility
    # --------------------------------------------------
    def _can_start_meeting(self, meeting):
        if meeting.status != "scheduled":
            return False

        now = timezone.now()
        minutes = (meeting.scheduled_start_time - now).total_seconds() / 60
        return -5 <= minutes <= 15

    

class AppointmentDetailView(APIView):
    """Get, update, or delete a specific appointment"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            appointment = Appointment.objects.get(id=pk)
            serializer = AppointmentSerializer(appointment)
            
            response_data = {
                "appointment": serializer.data
            }
            
            # Include meeting info if exists
            try:
                meeting = TelehealthMeeting.objects.filter(
                    appoinment=appointment,
                    is_active=True
                ).first()
                
                if meeting:
                    from django.conf import settings
                    base_url = getattr(settings, 'FRONTEND_URL', 'https://dev-cloud.droidal.com')
                    meeting_link = f"{base_url}/meeting/join/{meeting.meeting_id}" if meeting.meeting_id else None
                    
                    response_data["meeting_info"] = {
                        "meeting_id": meeting.id,
                        "chime_meeting_id": meeting.meeting_id,
                        "status": meeting.status,
                        "scheduled_start_time": meeting.scheduled_start_time,
                        "scheduled_end_time": meeting.scheduled_end_time,
                        "meeting_link": meeting_link,
                        "can_start": self._can_start_meeting(meeting),
                        "emails_sent": {
                            "creation": meeting.creation_email_sent,
                            "reminder": meeting.reminder_email_sent,
                            "start": meeting.start_email_sent
                        }
                    }
            except Exception as e:
                logger.error(f"Error fetching meeting info: {str(e)}")
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Appointment.DoesNotExist:
            return Response(
                {"error": "Appointment not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def put(self, request, pk):
        """Update appointment"""
        try:
            appointment = Appointment.objects.get(id=pk)
            old_appointment = Appointment.objects.get(id=pk)
            serializer = AppointmentSerializer(appointment, data=request.data, partial=True)
            
            if serializer.is_valid():
                appointment = serializer.save()

                changed_fields = get_changed_fields(
                    old_appointment,
                    serializer.validated_data
                )

                EmailService.send_appointment_updated_email(
                    appointment,
                    changed_fields
                )
                
                status_list = [
                  'in_session',
                  'roomed',
                  'in_progress',
                  'checked_in',
                  'arrived'
                ]
                
                if appointment.confirmationstatus in status_list:
                    try:
                        Encounter.objects.get_or_create(
                            appointment=appointment,
                            defaults={
                                'patient': appointment.patient,
                                'rendering_provider': appointment.provider,
                                'location': appointment.location,
                                'encounter_from_date': appointment.date,
                                'status': 'not_started',
                                'is_appt': True
                            }
                        )
                    except Exception as e:
                        return Response(
                            {"error": f"Error creating encounter for appointment {pk}: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )

                # Update associated meeting if exists and time/date changed
                if any(field in request.data for field in ['date', 'time', 'duration']):
                    try:
                        meeting = TelehealthMeeting.objects.filter(
                            appoinment=appointment,
                            is_active=True,
                            status='scheduled'
                        ).first()
                        
                        if meeting:
                            start_datetime = timezone.make_aware(
                                datetime.combine(appointment.date, appointment.time)
                            )
                            duration_minutes = serializer._get_duration_minutes(appointment.duration)
                            end_datetime = start_datetime + timedelta(minutes=duration_minutes)
                            
                            meeting.scheduled_start_time = start_datetime
                            meeting.scheduled_end_time = end_datetime
                            meeting.reminder_email_sent = False  # Reset reminder flag
                            meeting.save()
                            
                            logger.info(f"Updated meeting times for appointment {pk}")
                    except Exception as e:
                        logger.error(f"Error updating meeting times: {str(e)}")
                
                return Response({
                    "message": "Appointment updated successfully",
                    "appointment": AppointmentSerializer(appointment).data
                }, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Appointment.DoesNotExist:
            return Response(
                {"error": "Appointment not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self, request, pk):
        try:
            appointment = Appointment.objects.get(id=pk)

            try:
                meeting = TelehealthMeeting.objects.filter(
                    appoinment=appointment
                ).first()

                if meeting:
                    attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
                    EmailService.send_meeting_cancelled_email(meeting, attendees)

                    meeting.delete()
            except Exception as e:
                logger.error(f"Error deleting meeting: {str(e)}")

            appointment.delete()

            return Response(
                {"message": "Appointment deleted successfully"},
                status=status.HTTP_200_OK
            )

        except Appointment.DoesNotExist:
            return Response(
                {"error": "Appointment not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    
    def _can_start_meeting(self, meeting):
        """Check if meeting can be started now"""
        if meeting.status != 'scheduled':
            return False
        
        now = timezone.now()
        time_until = (meeting.scheduled_start_time - now).total_seconds() / 60
        return -5 <= time_until <= 15
    
class StartAppointmentMeetingView(APIView):
    """Start the telehealth meeting for an appointment"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, appointment_id):
        try:
            from tenant_app.models import Appointment
            appointment = Appointment.objects.get(id=appointment_id)
            
            # Get meeting linked to this appointment
            meeting = TelehealthMeeting.objects.filter(
                appoinment=appointment,
                is_active=True
            ).first()
            
            if not meeting:
                return Response(
                    {"error": "No telehealth meeting scheduled for this appointment"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if meeting is already started
            if meeting.status == 'started' and meeting.meeting_id:
                from django.conf import settings
                base_url = getattr(settings, 'FRONTEND_URL', 'https://dev-cloud.droidal.com')
                meeting_link = f"{base_url}/meeting/join/{meeting.meeting_id}"
                
                return Response({
                    'message': 'Meeting already started',
                    'meeting_id': meeting.meeting_id,
                    'meeting_link': meeting_link,
                    'meeting_info': {
                        'meeting_id': meeting.meeting_id,
                        'external_meeting_id': meeting.external_meeting_id,
                        'media_region': meeting.media_region,
                        'media_placement': meeting.media_placement
                    }
                }, status=status.HTTP_200_OK)
            
            if meeting.status != 'scheduled':
                return Response(
                    {"error": f"Meeting cannot be started. Current status: {meeting.status}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if meeting can be started (within time window)
            now = timezone.now()
            time_until_meeting = (meeting.scheduled_start_time - now).total_seconds() / 60
            
            if time_until_meeting > 15:
                return Response(
                    {
                        "error": f"Meeting can only be started 15 minutes before scheduled time. Time remaining: {int(time_until_meeting)} minutes"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create Chime meeting (only if not already created)
            if not meeting.meeting_id:
                chime_service = ChimeService()
                meeting_info = chime_service.create_meeting()
                
                # Update meeting with Chime details
                meeting.meeting_id = meeting_info['meeting_id']
                meeting.external_meeting_id = meeting_info['external_meeting_id']
                meeting.media_region = meeting_info['media_region']
                meeting.media_placement = meeting_info['media_placement']
            else:
                # Meeting ID already exists
                meeting_info = {
                    'meeting_id': meeting.meeting_id,
                    'external_meeting_id': meeting.external_meeting_id,
                    'media_region': meeting.media_region,
                    'media_placement': meeting.media_placement
                }
            
            # Update meeting status
            meeting.actual_start_time = now
            meeting.status = 'started'
            meeting.save()
            
            # Update appointment status
            appointment.confirmationstatus = 'in_progress'
            appointment.save()
            
            # Generate meeting link
            from django.conf import settings
            base_url = getattr(settings, 'FRONTEND_URL', 'https://dev-cloud.droidal.com')
            meeting_link = f"{base_url}/meeting/join/{meeting.meeting_id}"
            
            # Send start emails if not already sent
            if not meeting.start_email_sent:
                attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
                if attendees.exists():
                    if EmailService.send_meeting_started_email(meeting, attendees, meeting_link):
                        meeting.start_email_sent = True
                        meeting.save()
            
            logger.info(f"Meeting started for appointment {appointment_id}")
            
            return Response({
                "message": "Meeting started successfully",
                "meeting_id": meeting.meeting_id,
                "meeting_link": meeting_link,
                "meeting_info": meeting_info
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error starting meeting for appointment {appointment_id}: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        
class SchemaCountsView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        now = timezone.now()
        
        # --- Patients ---
        qs_patient = Patient.objects.all()
        
        # Total Patient Count
        total_patient_count = qs_patient.count()
        
        # This Month Patient Count
        this_month_patient_count = qs_patient.filter(
            created_at__year=now.year, 
            created_at__month=now.month
        ).count()
        
        # Dates for trends
        first_day_this_month = now.replace(day=1)
        last_month_date = first_day_this_month - timedelta(days=1)
        
        # This Month Patient Trends
        last_month_patient_count = qs_patient.filter(
            created_at__year=last_month_date.year,
            created_at__month=last_month_date.month
        ).count()
        
        if last_month_patient_count > 0:
            month_trend_val = ((this_month_patient_count - last_month_patient_count) / last_month_patient_count) * 100
        else:
            month_trend_val = 100.0 if this_month_patient_count > 0 else 0.0
            
        this_month_patient_trends = {
            "percentage": round(abs(month_trend_val), 2),
            "direction": "up" if month_trend_val >= 0 else "down"
        }
        
        # This Year Patient Trends
        this_year_patient_count = qs_patient.filter(created_at__year=now.year).count()
        last_year_patient_count = qs_patient.filter(created_at__year=now.year - 1).count()
        
        if last_year_patient_count > 0:
            year_trend_val = ((this_year_patient_count - last_year_patient_count) / last_year_patient_count) * 100
        else:
            year_trend_val = 100.0 if this_year_patient_count > 0 else 0.0
            
        this_year_patient_trends = {
            "percentage": round(abs(year_trend_val), 2),
            "direction": "up" if year_trend_val >= 0 else "down"
        }

        # --- Appointments ---
        qs_appt = Appointment.objects.all()
        
        # Total Appointments
        total_appointment_count = qs_appt.count()
        
        # This Month Appointments
        this_month_appointment_count = qs_appt.filter(
            date__year=now.year, 
            date__month=now.month
        ).count()
        
        # This Month Appointment Trends
        last_month_appointment_count = qs_appt.filter(
            date__year=last_month_date.year,
            date__month=last_month_date.month
        ).count()
        
        if last_month_appointment_count > 0:
            appt_trend_val = ((this_month_appointment_count - last_month_appointment_count) / last_month_appointment_count) * 100
        else:
            appt_trend_val = 100.0 if this_month_appointment_count > 0 else 0.0
            
        this_month_appointment_trends = {
            "percentage": round(abs(appt_trend_val), 2),
            "direction": "up" if appt_trend_val >= 0 else "down"
        }

        # This Month Confirmed Appointments Percentage
        this_month_confirmed_count = qs_appt.filter(
            date__year=now.year,
            date__month=now.month,
            confirmationstatus="confirmed"
        ).count()

        if this_month_appointment_count > 0:
            this_month_confirmed_percentage = (this_month_confirmed_count / this_month_appointment_count) * 100
        else:
            this_month_confirmed_percentage = 0.0

        # --- Claims ---
        qs_claim = Claim.objects.all()
        
        # Total Claims
        total_claim_count = qs_claim.count()
        
        # This Month Claims
        this_month_claim_count = qs_claim.filter(
            created_at__year=now.year, 
            created_at__month=now.month
        ).count()
        
        # This Month Claim Trends
        last_month_claim_count = qs_claim.filter(
            created_at__year=last_month_date.year,
            created_at__month=last_month_date.month
        ).count()
        
        if last_month_claim_count > 0:
            claim_trend_val = ((this_month_claim_count - last_month_claim_count) / last_month_claim_count) * 100
        else:
            claim_trend_val = 100.0 if this_month_claim_count > 0 else 0.0
            
        this_month_claim_trends = {
            "percentage": round(abs(claim_trend_val), 2),
            "direction": "up" if claim_trend_val >= 0 else "down"
        }

        return Response({
            "this_month_patient_count": this_month_patient_count,
            "total_patient_count": total_patient_count,
            "this_year_patient_trends": this_year_patient_trends,
            "this_month_patient_trends": this_month_patient_trends,
            "this_month_appointment_count": this_month_appointment_count,
            "total_appointment_count": total_appointment_count,
            "this_month_appointment_trends": this_month_appointment_trends,
            "this_month_confirmed_percentage": round(this_month_confirmed_percentage, 2),
            "this_month_claim_count": this_month_claim_count,
            "total_claim_count": total_claim_count,
            "this_month_claim_trends": this_month_claim_trends
        })


class MinimalPatientListView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patients = Patient.objects.all().order_by('last_name', 'first_name')
        serializer = MinimalPatientSerializer(patients, many=True)
        return Response(serializer.data)


class MinimalProviderListView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        providers = PatientProvider.objects.all().order_by('last_name', 'first_name')
        serializer = MinimalPatientProviderSerializer(providers, many=True)
        return Response(serializer.data)



# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Patient
from .serializers import PatientMinimalSerializer
from django.db.models import Q

class PatientListMinimalAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Patient.objects.all()

        search = request.query_params.get("search")
        if search:
            parts = search.split()

            if len(parts) == 1:
                queryset = queryset.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search)
                )
            else:
                queryset = queryset.filter(
                    Q(first_name__icontains=parts[0]) &
                    Q(last_name__icontains=parts[1])
                )

        serializer = PatientMinimalSerializer(queryset, many=True)
        return Response(serializer.data)


class ProviderListMinimalAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = PatientProvider.objects.all()

        search = request.query_params.get("search")
        if search:
            parts = search.split()

            if len(parts) == 1:
                queryset = queryset.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search)
                )
            else:
                queryset = queryset.filter(
                    Q(first_name__icontains=parts[0]) &
                    Q(last_name__icontains=parts[1])
                )

        serializer = ProviderMinimalSerializer(queryset, many=True)
        return Response(serializer.data)

class ProviderAvailabilityAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = PatientProvider.objects.all()

        search = request.query_params.get("search")
        if search:
            parts = search.split()

            if len(parts) == 1:
                queryset = queryset.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search)
                )
            else:
                queryset = queryset.filter(
                    Q(first_name__icontains=parts[0]) &
                    Q(last_name__icontains=parts[1])
                )

        serializer = ProviderAvailabilitySerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)
    

class AppointmentEligibilityCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        from modules.models import Agent_API_SecretKeyss
        from django.utils import timezone
        import uuid

        # ------------------------------------
        # API KEY
        # ------------------------------------
        apikey = Agent_API_SecretKeyss.objects.filter(
            user=user,
            sub_app=1
        ).first()

        if not apikey:
            return Response(
                {"detail": "API key not configured for this user"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ------------------------------------
        # INPUTS
        # ------------------------------------
        appointment_ids = request.data.get("appointment_ids")
        patientid = request.data.get("patientid")
        providerid = request.data.get("providerid")

        # ------------------------------------
        # VALIDATION
        # ------------------------------------
        if not appointment_ids and not (patientid and providerid):
            return Response(
                {"detail": "Provide either appointment_ids OR patientid and providerid"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if appointment_ids and (patientid or providerid):
            return Response(
                {"detail": "Provide only one mode: appointment_ids OR patientid + providerid"},
                status=status.HTTP_400_BAD_REQUEST
            )

        patientdetails = []

        # ------------------------------------
        # MODE 1: appointment_ids
        # ------------------------------------
        if appointment_ids:
            appointments = Appointment.objects.select_related(
                "patient", "provider"
            ).filter(
                id__in=appointment_ids
            ).order_by("-date", "-time")

            if not appointments.exists():
                return Response(
                    {"detail": "No appointments found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = AppointmentMinimalSerializer(appointments, many=True)
            patientdetails = serializer.data

        # ------------------------------------
        # MODE 2: patientid + providerid
        # ------------------------------------
        else:
            patient = Patient.objects.filter(id=patientid).first()
            provider = PatientProvider.objects.filter(id=providerid).first()

            if not patient:
                return Response(
                    {"detail": "Invalid patientid"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not provider:
                return Response(
                    {"detail": "Invalid providerid"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Try latest appointment (optional)
            appointment = Appointment.objects.filter(
                patient=patient,
                provider=provider
            ).order_by("-date", "-time").first()

            patientdetails.append({
                "id": appointment.id if appointment else None,
                "patient": PatientSerializer(patient, context={"request": request}).data,
                "provider": PatientProviderSerializer(provider, context={"request": request}).data,
            })

        # ------------------------------------
        # STEDI CONFIG
        # ------------------------------------
        method = "POST"
        api_key = apikey.api_key
        full_url = "https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/eligibility/v3"

        results = {}

        # ------------------------------------
        # LOOP EACH PATIENT
        # ------------------------------------
        for patientdetail in patientdetails:
            appointment_id = patientdetail.get("id")
            patient_data = patientdetail["patient"]
            provider_data = patientdetail["provider"]

            dob = patient_data.get("dob")
            # print(dob, flush=True)
            if isinstance(dob, (date, datetime)):
                date_of_birth = dob.strftime("%Y%m%d")
            elif isinstance(dob, str):
                date_of_birth = dob.replace("-", "")
            else:
                date_of_birth = None
            # PAYER ID
            try:
                payerid = patient_data.get("insurance_name", {}).get("primaryPayerId", "")
            except Exception:
                payerid = ""

            # SERVICE TYPE CODE
            if patient_data.get("servicetypecode"):
                servicetypecode = [str(patient_data["servicetypecode"])]
            else:
                servicetypecode = ["30"]  # default

            payload = {
                "encounter": {
                    "serviceTypeCodes": servicetypecode
                },
                "externalPatientId": "UAA111222333",
                "provider": {
                    "npi": provider_data.get("NPI"),
                    "organizationName": provider_data.get("practice_name"),
                },
                "subscriber": {
                    "dateOfBirth": date_of_birth,
                    
                    "firstName": patient_data.get("first_name"),
                    "lastName": patient_data.get("last_name"),
                    "memberId": patient_data.get("member_id"),
                },
                "tradingPartnerServiceId": payerid,
            }
            print(payload, flush=True)
            response = stedi.request(full_url, method, payload, api_key)

            patient_obj = Patient.objects.filter(id=patient_data["id"]).first()
            eligibility_status = "Unknown"
            provider_network = "Unknown"

            # ------------------------------------
            # BETA ERROR
            # ------------------------------------
            if isinstance(response, dict) and response.get("Status") == "Please Use Beta":
                eligibility_status = "Beta Required"

                if patient_obj:
                    patient_obj.eligibility_status = eligibility_status
                    patient_obj.eligibility_last_checked = timezone.now()
                    patient_obj.save(update_fields=[
                        "eligibility_status",
                        "eligibility_last_checked"
                    ])

                results[str(appointment_id)] = {
                    "success": False,
                    "error": response
                }
                continue

            # ------------------------------------
            # PARSE RESPONSE
            # ------------------------------------
            try:
                data = response.json()

                plan_status = data.get("planStatus", [])
                if plan_status:
                    status_value = plan_status[0].get("status")
                    eligibility_status = "Active" if status_value == "Active Coverage" else "Inactive"

                benefits = data.get("benefitsInformation", [])
                for benefit in benefits:
                    indicator = benefit.get("inPlanNetworkIndicatorCode")
                    if indicator == "Y":
                        provider_network = "In-Network"
                        break
                    elif indicator == "N":
                        provider_network = "Out-of-Network"
                        break

                # SAVE PATIENT
                if patient_obj:
                    patient_obj.eligibility_status = eligibility_status
                    patient_obj.provider_network = provider_network
                    patient_obj.eligibility_last_checked = timezone.now()
                    patient_obj.save(update_fields=[
                        "eligibility_status",
                        "provider_network",
                        "eligibility_last_checked"
                    ])

                results[str(appointment_id)] = {
                    "success": True,
                    "eligibility_status": eligibility_status,
                    "provider_network": provider_network,
                    "response": data
                }

            except Exception:
                if patient_obj:
                    patient_obj.eligibility_status = "Error"
                    patient_obj.provider_network = "Unknown"
                    patient_obj.eligibility_last_checked = timezone.now()
                    patient_obj.save(update_fields=[
                        "eligibility_status",
                        "provider_network",
                        "eligibility_last_checked"
                    ])

                results[str(appointment_id)] = {
                    "success": False,
                    "raw_response": getattr(response, "text", str(response))
                }

        return Response(results, status=status.HTTP_200_OK)

    

class AvailableAppointmentSlotsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        provider_id = request.query_params.get("provider_id")
        date_str = request.query_params.get("date")

        if not provider_id or not date_str:
            return Response(
                {"error": "provider_id and date are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            appointment_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔹 Provider working hours (customize later)
        start_time = time(9, 0)
        end_time = time(17, 0)
        slot_duration = timedelta(minutes=30)

        # 🔹 All slots
        slots = []
        current = datetime.combine(appointment_date, start_time)
        end_datetime = datetime.combine(appointment_date, end_time)

        while current + slot_duration <= end_datetime:
            slots.append(current.time())
            current += slot_duration

        # 🔹 Fetch booked appointments
        booked_times = Appointment.objects.filter(
            provider_id=provider_id,
            date=appointment_date
        ).values_list("time", flat=True)

        booked_times = set(booked_times)

        # 🔹 Available slots
        available_slots = [
            slot.strftime("%H:%M")
            for slot in slots
            if slot not in booked_times
        ]

        return Response({
            "provider_id": provider_id,
            "date": appointment_date,
            "slot_duration_minutes": 30,
            "available_slots": available_slots
        })

class EncounterDocumentUploadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EncounterDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        patient_id = serializer.validated_data["patient_id"]
        documents = serializer.validated_data["documents"]

        folder_path = os.path.join(
            settings.MEDIA_ROOT,
            "patient_documents",
            str(patient_id)
        )

        os.makedirs(folder_path, exist_ok=True)

        saved_files = []

        for file in documents:
            file_path = os.path.join(folder_path, file.name)

            with open(file_path, "wb+") as destination:
                for chunk in file.chunks():
                    destination.write(chunk)

            saved_files.append(
                f"{settings.MEDIA_URL}patient_documents/{patient_id}/{file.name}"
            )

        return Response(
            {
                "message": "Documents uploaded successfully",
                "encounter_id": patient_id,
                "files": saved_files
            },
            status=status.HTTP_201_CREATED
        )


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, pk=None):
        documents = Document.objects.filter(patient_id=pk)
        serializer = self.get_serializer(documents, many=True)
        return Response(serializer.data, status=200)

    def _delete_old_file(self, document):
        if document.file_path:
            # file_path in DB contains something like: /media/patient_documents/.../file.pdf
            abs_path = os.path.join(settings.BASE_DIR, document.file_path.lstrip('/'))
            
            if os.path.exists(abs_path):
                os.remove(abs_path)

    def _save_file(self, patient_id, file):

        folder_path = os.path.join(
            settings.MEDIA_ROOT,
            "patient_documents",
            str(patient_id)
        )
        os.makedirs(folder_path, exist_ok=True)

        unique_name = f"{file.name}"
        abs_path = os.path.join(folder_path, unique_name)

        with open(abs_path, "wb+") as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        # return URL path to store in DB
        return f"/media/patient_documents/{patient_id}/{unique_name}"

    def create(self, request, *args, **kwargs):
        serializer = EncounterDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        patient_id = serializer.validated_data['patient']
        appointment_id = serializer.validated_data.get('appointment')
        file = serializer.validated_data['file']

        label = serializer.validated_data.get('label', "")
        notes = serializer.validated_data.get('notes', "")
        status_state = serializer.validated_data.get('status', "active")

        # -------- Save file to MEDIA --------
        folder = os.path.join(settings.MEDIA_ROOT, "patient_documents", str(patient_id))
        os.makedirs(folder, exist_ok=True)

        unique_name = file.name  # or use uuid if needed
        file_path = os.path.join(folder, unique_name)

        with open(file_path, "wb+") as dest:
            for chunk in file.chunks():
                dest.write(chunk)

        db_path = f"patient_documents/{patient_id}/{unique_name}"

        # -------- Save DB record --------
        document = Document.objects.create(
            patient_id=patient_id,
            appointment_id=appointment_id,
            file_name=file.name,
            file_path=f"{settings.MEDIA_URL}{db_path}",
            label=label,
            notes=notes,
            status=status_state
        )

        return Response({
            "id": document.id,
            "patient": document.patient_id,
            "appointment": document.appointment_id,
            "file_name": document.file_name,
            "file_path": f"{settings.MEDIA_URL}{db_path}",
            "label": document.label,
            "notes": document.notes,
            "status": document.status,
            "created_at": document.created_at,
        }, status=status.HTTP_201_CREATED)

    # @action(detail=True, methods=['put'])
    def update(self, request, *args, **kwargs):
        document = self.get_object()   # fetch existing row
        
        document.label = request.data.get('label', document.label)
        document.notes = request.data.get('notes', document.notes)
        document.status = request.data.get('status', document.status)
        document.appointment_id = request.data.get('appointment', document.appointment_id)

        new_file = request.FILES.get('file')
        if new_file:
            self._delete_old_file(document)
            file_path = self._save_file(document.patient_id, new_file)

            document.file_name = new_file.name
            document.file_path = file_path

        document.save()
        return Response(DocumentSerializer(document).data, status=status.HTTP_200_OK)


        # serializer = self.get_serializer(data=request.data)

        # if not serializer.is_valid():
        #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # # Custom Logic (optional)
        # print("Processing data:", request.data,flush=True)

        # instance = serializer.save()

        # # Optional Post-processing
        # print("Saved instance:", instance.id)

        # return Response(serializer.data, status=status.HTTP_201_CREATED)



class AppointmentsView_pagination(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        encounter = request.query_params.get("encounter")
        if encounter:
            status_filter = request.query_params.get("status")
            if status_filter == 'check_in':
                status_return = [
                    'in_session',
                    'roomed',
                    'in_progress',
                    'checked_in',
                    'arrived',
                    'checked_out',
                    'completed'
                ]
                qs = Appointment.objects.filter(
                    confirmationstatus__in=status_return
                )
            else:
                qs = Appointment.objects.filter(
                    confirmationstatus=status_filter
                )
        else:
            qs = Appointment.objects.all().order_by("id")

        from_date = request.query_params.get("from_date")
        to_date = request.query_params.get("to_date")

        appointment_id = request.query_params.get("id")
        patient_name = request.query_params.get("patient_name")
        provider_name = request.query_params.get("provider_name")
        appt_date = request.query_params.get("date")
        appt_time = request.query_params.get("time")
        duration = request.query_params.get("duration")
        appt_type = request.query_params.get("type")
        status = request.query_params.get("status")

        if appointment_id:
            qs = qs.filter(id=appointment_id)

        if patient_name:
            qs = qs.filter(
                Q(patient__first_name__icontains=patient_name) |
                Q(patient__last_name__icontains=patient_name)
            )

        if provider_name:
            qs = qs.filter(
                Q(provider__first_name__icontains=provider_name) |
                Q(provider__last_name__icontains=provider_name)
            )

        if appt_date:
            qs = qs.filter(date=appt_date)

        if appt_time:
            qs = qs.filter(time__icontains=appt_time)

        if duration:
            qs = qs.filter(duration__icontains=duration)

        if appt_type:
            qs = qs.filter(type=appt_type)

        # Safe fallback status filter (does not override encounter logic)
        if status and not encounter:
            qs = qs.filter(confirmationstatus=status)

        paginator = PageNumberPagination()
        paginated_qs = paginator.paginate_queryset(qs, request)

        if from_date:
            qs = qs.filter(date__gte=from_date)
        if to_date:
            qs = qs.filter(date__lte=to_date)

        serializer = AppointmentSerializer(paginated_qs, many=True)
        appointments = serializer.data

        for item in appointments:
            appointment = Appointment.objects.filter(
                id=item["id"]
            ).select_related("patient").first()

            if appointment and appointment.patient:
                item["insurance_name"] = appointment.patient.insurance_name

            file_data = Document.objects.filter(
                appointment_id=item["id"]
            ).values("file_name", "file_path")

            item["documents"] = list(file_data)

        response_data = {
            "count": len(appointments),
            "appointments": appointments
        }

        include_meeting_info = request.query_params.get(
            "include_meeting_info", "false"
        ).lower() == "true"

        if include_meeting_info:
            for appointment_data in response_data["appointments"]:
                appointment = Appointment.objects.filter(
                    id=appointment_data["id"]
                ).first()

                if not appointment:
                    continue

                meeting = TelehealthMeeting.objects.filter(
                    appoinment=appointment,
                    is_active=True
                ).first()

                if meeting:
                    appointment_data["meeting_info"] = {
                        "meeting_id": meeting.id,
                        "status": meeting.status,
                        "scheduled_start_time": meeting.scheduled_start_time,
                        "meeting_link": serializer.get_meeting_link(appointment),
                        "can_start": self._can_start_meeting(meeting)
                    }

        return Response(response_data)

    # --------------------------------------------------
    # CREATE
    # --------------------------------------------------
    def post(self, request):
        serializer = AppointmentSerializer(data=request.data)

        if serializer.is_valid():
            appointment = serializer.save()

            response_data = {
                "message": "Appointment created successfully",
                "appointment": AppointmentSerializer(appointment).data
            }

            meeting = TelehealthMeeting.objects.filter(
                appoinment=appointment,
                is_active=True
            ).first()

            if meeting:
                response_data["message"] = (
                    "Appointment and telehealth meeting created successfully"
                )
                response_data["telehealth_meeting"] = {
                    "meeting_id": meeting.id,
                    "scheduled_start_time": meeting.scheduled_start_time,
                    "status": meeting.status,
                    "emails_sent": meeting.creation_email_sent
                }

            return Response(response_data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # --------------------------------------------------
    # FULL UPDATE (PUT)
    # --------------------------------------------------
    def put(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        old_appointment = Appointment.objects.get(pk=pk)

        serializer = AppointmentSerializer(
            appointment,
            data=request.data,
            partial=False   # PUT = full update
        )

        if serializer.is_valid():
            serializer.save()
            changed_fields = get_changed_fields(
                old_appointment,
                serializer.validated_data
            )

            EmailService.send_appointment_updated_email(
                appointment,
                changed_fields
            )
            return Response(
                {
                    "message": "Appointment updated successfully",
                    "appointment": serializer.data
                }
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        old_appointment = Appointment.objects.get(pk=pk)
        
        serializer = AppointmentSerializer(
            appointment,
            data=request.data,
            partial=True    # PATCH = partial update
        )

        if serializer.is_valid():
            serializer.save()
            changed_fields = get_changed_fields(
                old_appointment,
                serializer.validated_data
            )

            EmailService.send_appointment_updated_email(
                appointment,
                changed_fields
            )
            return Response(
                {
                    "message": "Appointment partially updated successfully",
                    "appointment": serializer.data
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # --------------------------------------------------
    # Meeting start eligibility
    # --------------------------------------------------
    def _can_start_meeting(self, meeting):
        if meeting.status != "scheduled":
            return False

        now = timezone.now()
        minutes = (meeting.scheduled_start_time - now).total_seconds() / 60
        return -5 <= minutes <= 15

class PatientAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        # Get appointments for the specific patient
        qs = Appointment.objects.filter(patient_id=patient_id).order_by("-date", "-time")
        
        serializer = AppointmentSerializer(qs, many=True)
        return Response(serializer.data)
