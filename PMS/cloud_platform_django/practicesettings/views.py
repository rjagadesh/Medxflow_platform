from django.shortcuts import render
from rest_framework.views import APIView
from django_tenants.utils import schema_context
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import *
from .serializers import *
from django.db import transaction
import pandas as pd
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter
from decimal import Decimal


# Create your views here.
class TenantAPIView(APIView):

    def dispatch(self, request, *args, **kwargs):

        tenant = getattr(request, "tenant", None)

        if tenant and tenant.schema_name:
            with schema_context(tenant.schema_name):
                return super().dispatch(request, *args, **kwargs)

        return super().dispatch(request, *args, **kwargs)


class InsuranceCompanyViewSet(viewsets.ModelViewSet):
    queryset = InsuranceCompany.objects.all().order_by('-created_at')
    serializer_class = InsuranceCompanySerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name', 'payer_id', 'stedi_id', 'clearinghouse', 'electronic_submit']
    search_fields = ['name', 'payer_id', 'clearinghouse']
    ordering_fields = ['created_at', 'name', 'payer_id']

    def create(self, request, *args, **kwargs):
        if isinstance(request.data, list):
            serializer = self.get_serializer(data=request.data, many=True)
            serializer.is_valid(raise_exception=True)
            
            saved_instances = []
            for attrs in serializer.validated_data:
                instance = InsuranceCompany(**attrs)
                instance.created_by = request.user
                instance.save()
                saved_instances.append(instance)
            
            serializer.instance = saved_instances
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class InsurancePlanViewSet(viewsets.ModelViewSet):
    queryset = InsurancePlan.objects.all().order_by('plan_name')
    serializer_class = InsurancePlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['plan_name', 'insurance_company']
    search_fields = ['plan_name', 'insurance_company__name']
    ordering_fields = ['created_at', 'plan_name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class InsurancePolicyViewSet(viewsets.ModelViewSet):
    queryset = InsurancePolicy.objects.all().order_by('-created_at')
    serializer_class = InsurancePolicySerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['insurance_company_id', 'patient', 'policy_number']
    search_fields = ['policy_number', 'insurance_company_id__name', 'patient__first_name', 'patient__last_name']
    ordering_fields = ['created_at', 'policy_number']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class PracticeInformationView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = PracticeInformation.objects.all().order_by("id")
        serializer = PracticeInformationSerializer(
            qs,
            many=True,
            context={"request": request}
        )

        return Response({
            "count": qs.count(),
            "practices": serializer.data
        })

    def post(self, request):
        if PracticeInformation.objects.exists():
            return Response(
                {"error": "Practice information already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = PracticeInformationSerializer(
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Practice created",
                    "practice": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class PracticeInformationDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(PracticeInformation, pk=pk)

    # 🔹 PUT – Full update
    def put(self, request, pk):
        practice = self.get_object(pk)

        serializer = PracticeInformationSerializer(
            practice,
            data=request.data,
            context={"request": request}   # ✅ IMPORTANT
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Practice information updated",
                    "practice": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PATCH – Partial update
    def patch(self, request, pk):
        practice = self.get_object(pk)

        serializer = PracticeInformationSerializer(
            practice,
            data=request.data,
            partial=True,
            context={"request": request}   # ✅ IMPORTANT
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Practice information partially updated",
                    "practice": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        practice = self.get_object(pk)

        # optional: delete logo file
        if practice.logo:
            practice.logo.delete(save=False)

        practice.delete()

        return Response(
            {"message": "Practice information deleted"},
            status=status.HTTP_204_NO_CONTENT
        )
    
class PracticeSchedulingSettingsView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = PracticeSchedulingSettings.objects.all()
        serializer = PracticeSchedulingSettingsSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "settings": serializer.data
        })

    # 🔹 CREATE or UPDATE (one row per PatientProvider)
    def post(self, request):
        patient_provider_id = request.data.get("patient_provider")

        if not patient_provider_id:
            return Response(
                {"error": "patient_provider is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance = PracticeSchedulingSettings.objects.filter(
            patient_provider_id=patient_provider_id
        ).first()

        if instance:
            serializer = PracticeSchedulingSettingsSerializer(
                instance,
                data=request.data,
                partial=True
            )
        else:
            serializer = PracticeSchedulingSettingsSerializer(
                data=request.data
            )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Scheduling settings saved",
                    "settings": serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PracticeSchedulingSettingsDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(
            PracticeSchedulingSettings,
            pk=pk
        )

    # 🔹 RETRIEVE
    def get(self, request, pk):
        settings = self.get_object(pk)
        serializer = PracticeSchedulingSettingsSerializer(settings)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        settings = self.get_object(pk)
        serializer = PracticeSchedulingSettingsSerializer(
            settings,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Scheduling settings updated",
                "settings": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        settings = self.get_object(pk)
        serializer = PracticeSchedulingSettingsSerializer(
            settings,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Scheduling settings partially updated",
                "settings": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        settings = self.get_object(pk)
        settings.delete()
        return Response(
            {"message": "Scheduling settings deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class StaffScheduleView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = StaffSchedule.objects.all().order_by("staff_name")
        serializer = StaffScheduleSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "staff_schedules": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = StaffScheduleSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Staff schedule created",
                    "staff_schedule": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class StaffScheduleDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(StaffSchedule, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        staff_schedule = self.get_object(pk)
        serializer = StaffScheduleSerializer(staff_schedule)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        staff_schedule = self.get_object(pk)
        serializer = StaffScheduleSerializer(
            staff_schedule, data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Staff schedule updated",
                    "staff_schedule": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        staff_schedule = self.get_object(pk)
        serializer = StaffScheduleSerializer(
            staff_schedule,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Staff schedule partially updated",
                    "staff_schedule": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        staff_schedule = self.get_object(pk)
        staff_schedule.delete()

        return Response(
            {"message": "Staff schedule deleted"},
            status=status.HTTP_204_NO_CONTENT
        )

class StaffTimeOffView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST (optionally filter by staff)
    def get(self, request):
        qs = StaffTimeOff.objects.all().order_by("-start_datetime")

        staff_id = request.query_params.get("staff")
        if staff_id:
            qs = qs.filter(staff_id=staff_id)

        serializer = StaffTimeOffSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "time_offs": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = StaffTimeOffSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Time off created",
                    "time_off": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class StaffTimeOffDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(StaffTimeOff, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        time_off = self.get_object(pk)
        serializer = StaffTimeOffSerializer(time_off)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        time_off = self.get_object(pk)
        serializer = StaffTimeOffSerializer(
            time_off,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Time off updated",
                    "time_off": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        time_off = self.get_object(pk)
        serializer = StaffTimeOffSerializer(
            time_off,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Time off partially updated",
                    "time_off": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        time_off = self.get_object(pk)
        time_off.delete()

        return Response(
            {"message": "Time off deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class RoomView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = Room.objects.all().order_by("name")
        serializer = RoomSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "rooms": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = RoomSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Room created",
                    "room": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class RoomDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Room, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        room = self.get_object(pk)
        serializer = RoomSerializer(room)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        room = self.get_object(pk)
        serializer = RoomSerializer(room, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Room updated",
                    "room": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        room = self.get_object(pk)
        serializer = RoomSerializer(
            room,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Room partially updated",
                    "room": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        room = self.get_object(pk)
        room.delete()

        return Response(
            {"message": "Room deleted"},
            status=status.HTTP_204_NO_CONTENT
        )

class EquipmentView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = Equipment.objects.all().order_by("name")
        serializer = EquipmentSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "equipment": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = EquipmentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Equipment created",
                    "equipment": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EquipmentDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Equipment, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        equipment = self.get_object(pk)
        serializer = EquipmentSerializer(equipment)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        equipment = self.get_object(pk)
        serializer = EquipmentSerializer(equipment, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Equipment updated",
                    "equipment": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        equipment = self.get_object(pk)
        serializer = EquipmentSerializer(
            equipment,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Equipment partially updated",
                    "equipment": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        equipment = self.get_object(pk)
        equipment.delete()

        return Response(
            {"message": "Equipment deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class PracticeHolidayView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = PracticeHoliday.objects.all().order_by("date")
        serializer = PracticeHolidaySerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "holidays": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = PracticeHolidaySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Practice holiday created",
                    "holiday": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PracticeHolidayDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(PracticeHoliday, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        holiday = self.get_object(pk)
        serializer = PracticeHolidaySerializer(holiday)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        holiday = self.get_object(pk)
        serializer = PracticeHolidaySerializer(
            holiday,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Practice holiday updated",
                    "holiday": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        holiday = self.get_object(pk)
        serializer = PracticeHolidaySerializer(
            holiday,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Practice holiday partially updated",
                    "holiday": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        holiday = self.get_object(pk)
        holiday.delete()

        return Response(
            {"message": "Practice holiday deleted"},
            status=status.HTTP_204_NO_CONTENT
        )

class ProviderScheduleBlockView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST (filter by provider optional)
    def get(self, request):
        qs = ProviderScheduleBlock.objects.all().order_by(
            "start_date", "from_time"
        )

        provider_id = request.query_params.get("provider")
        if provider_id:
            qs = qs.filter(provider_id=provider_id)
        
        service_location_id = request.query_params.get("service_location")
        if service_location_id:
            qs = qs.filter(service_location_id=service_location_id)

        serializer = ProviderScheduleBlockSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "blocks": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = ProviderScheduleBlockSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Provider schedule block created",
                    "block": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ProviderScheduleBlockDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(ProviderScheduleBlock, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        block = self.get_object(pk)
        serializer = ProviderScheduleBlockSerializer(block)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        block = self.get_object(pk)
        serializer = ProviderScheduleBlockSerializer(
            block,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Provider schedule block updated",
                    "block": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        block = self.get_object(pk)
        serializer = ProviderScheduleBlockSerializer(
            block,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Provider schedule block partially updated",
                    "block": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        block = self.get_object(pk)
        block.delete()

        return Response(
            {"message": "Provider schedule block deleted"},
            status=status.HTTP_204_NO_CONTENT
        )

class ServiceCodeView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = ServiceCode.objects.all().order_by("name")
        serializer = ServiceCodeSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "service_codes": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = ServiceCodeSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Service code created",
                    "service_code": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ServiceCodeDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(ServiceCode, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        service_code = self.get_object(pk)
        serializer = ServiceCodeSerializer(service_code)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        service_code = self.get_object(pk)
        serializer = ServiceCodeSerializer(
            service_code,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Service code updated",
                    "service_code": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        service_code = self.get_object(pk)
        serializer = ServiceCodeSerializer(
            service_code,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Service code partially updated",
                    "service_code": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        service_code = self.get_object(pk)
        service_code.delete()

        return Response(
            {"message": "Service code deleted"},
            status=status.HTTP_204_NO_CONTENT
        )

class VisitReasonView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = VisitReason.objects.all().order_by("name")

        service_id = request.query_params.get("service")
        if service_id:
            qs = qs.filter(service_id=service_id)

        serializer = VisitReasonSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "visit_reasons": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = VisitReasonSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Visit reason created",
                    "visit_reason": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class VisitReasonDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(VisitReason, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        visit_reason = self.get_object(pk)
        serializer = VisitReasonSerializer(visit_reason)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        visit_reason = self.get_object(pk)
        serializer = VisitReasonSerializer(
            visit_reason,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Visit reason updated",
                    "visit_reason": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        visit_reason = self.get_object(pk)
        serializer = VisitReasonSerializer(
            visit_reason,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Visit reason partially updated",
                    "visit_reason": serializer.data
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        visit_reason = self.get_object(pk)
        visit_reason.delete()

        return Response(
            {"message": "Visit reason deleted"},
            status=status.HTTP_204_NO_CONTENT
        )



class FeeScheduleEntryListCreateView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Optional filters
        search = request.query_params.get("search", "")
        status = request.query_params.get("status")
        state = request.query_params.get("state")
        schedule_type = request.query_params.get("schedule_type")

        queryset = FeeScheduleEntry.objects.all()

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(procedure_code__icontains=search) |
                Q(payer_name__icontains=search)
            )
        if status:
            queryset = queryset.filter(status=status)
        if state:
            queryset = queryset.filter(state=state)
        if schedule_type:
            queryset = queryset.filter(schedule_type=schedule_type)

        serializer = FeeScheduleEntrySerializer(queryset, many=True)
        return Response({
            "count": queryset.count(),
            "entries": serializer.data
        })

    def post(self, request):
        serializer = FeeScheduleEntrySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Entry created successfully",
                "entry": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FeeScheduleEntryDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(FeeScheduleEntry, pk=pk)

    def get(self, request, pk):
        entry = self.get_object(pk)
        serializer = FeeScheduleEntrySerializer(entry)
        return Response(serializer.data)

    def put(self, request, pk):
        entry = self.get_object(pk)
        serializer = FeeScheduleEntrySerializer(entry, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Entry updated",
                "entry": serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        entry = self.get_object(pk)
        serializer = FeeScheduleEntrySerializer(entry, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Entry partially updated",
                "entry": serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        entry = self.get_object(pk)
        entry.delete()
        return Response({"message": "Entry deleted"}, status=status.HTTP_204_NO_CONTENT)


class BulkFeeScheduleUploadView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # ================= CSV HEADER → MODEL FIELD MAP =================
    HEADER_MAP = {
        "Note": "note",
        "Procedure Code": "procedure_code",
        "Modifier": "modifier",
        "Par Amount": "par_amount",
        "Non-Par Amount": "non_par_amount",
        "Limiting Charge Amount": "limiting_charge_amount",
    }

    REQUIRED_HEADERS = {
        "Procedure Code",
        "Par Amount",
        "Non-Par Amount",
        "Limiting Charge Amount",
    }

    def post(self, request):
        serializer = BulkFeeScheduleUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]

        # ================= READ FILE =================
        try:
            if file.name.lower().endswith(".csv"):
                df = pd.read_csv(file)
            else:
                df = pd.read_excel(file)
        except Exception as e:
            return Response(
                {"error": f"Invalid file format: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ================= VALIDATE HEADERS =================
        incoming_headers = set(df.columns)
        missing_headers = self.REQUIRED_HEADERS - incoming_headers

        if missing_headers:
            return Response(
                {
                    "error": "Missing required columns",
                    "details": sorted(list(missing_headers)),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        entries = []
        errors = []

        # ================= ROW PROCESSING =================
        for idx, row in df.iterrows():
            try:
                raw_data = row.to_dict()
                cleaned_data = {}

                for csv_header, model_field in self.HEADER_MAP.items():
                    value = raw_data.get(csv_header)

                    if pd.isna(value):
                        cleaned_data[model_field] = None
                    else:
                        cleaned_data[model_field] = value

                # ================= TYPE CONVERSIONS =================
                cleaned_data["procedure_code"] = (
                    str(cleaned_data["procedure_code"]).strip().upper()
                )

                if cleaned_data.get("modifier") is not None:
                    cleaned_data["modifier"] = (
                        str(cleaned_data["modifier"]).strip().upper()
                    )

                cleaned_data["par_amount"] = Decimal(
                    cleaned_data["par_amount"]
                )
                cleaned_data["non_par_amount"] = Decimal(
                    cleaned_data["non_par_amount"]
                )
                cleaned_data["limiting_charge_amount"] = Decimal(
                    cleaned_data["limiting_charge_amount"]
                )

                # Default flags
                cleaned_data["is_active"] = True

                entries.append(FeeScheduleEntry(**cleaned_data))

            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")

        # ================= ERROR RESPONSE =================
        if errors:
            return Response(
                {
                    "error": "Some rows failed validation",
                    "details": errors[:20],  # prevent huge responses
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ================= BULK CREATE =================
        with transaction.atomic():
            FeeScheduleEntry.objects.bulk_create(
                entries,
                batch_size=1000,
                ignore_conflicts=True,
            )

        return Response(
            {
                "message": "Bulk upload successful",
                "total_uploaded": len(entries),
                "skipped_duplicates": len(df) - len(entries),
            },
            status=status.HTTP_201_CREATED,
        )