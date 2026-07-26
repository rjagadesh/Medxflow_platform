# pms/views.py
from rest_framework import viewsets, status, generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
import uuid
from django.db.models import Q,ForeignKey
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import ValidationError
from .models import Encounter
from .serializers import *
from rest_framework.permissions import IsAuthenticated
from tenant_claim_submission.serializers import EncounterSerializer
from tenant_claim_submission.models import Claim
from rest_framework.views import APIView
from django.apps import apps
from clinical_notes.models import ClinicalNote
from tenant_app.models import Appointment
from practicesettings.models import FeeScheduleEntry
from .services import get_cpt_codes_from_notes
from django.db.models import (
    CharField,
    TextField,
    EmailField
)


def get_all_related_models(model):
    """Dynamically get all foreign key relations from a model"""
    related_models = {}
    for field in model._meta.fields:
        if isinstance(field, ForeignKey):
            related_models[field.name] = field.related_model
    return related_models

def get_text_fields(model):
    """Get all text fields from a model"""
    fields = []
    for field in model._meta.fields:
        if isinstance(field, (CharField, TextField)):
            fields.append(field.name)
    return fields

def get_related_text_fields(model):
    """Get all text fields from related models"""
    fields = []
    related_models = get_all_related_models(model)
    
    for relation_name, related_model in related_models.items():
        for field in related_model._meta.fields:
            if isinstance(field, (CharField, TextField)):
                fields.append(f"{relation_name}__{field.name}")
    return fields

def apply_global_search(qs, value):
    """Apply global search across all text fields in main and related models"""
    q = Q()
    
    for field in get_text_fields(qs.model):
        q |= Q(**{f"{field}__icontains": value})
 
    for field in get_related_text_fields(qs.model):
        q |= Q(**{f"{field}__icontains": value})
    
    return qs.filter(q)

class EncounterPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class EncounterViewSet(viewsets.ModelViewSet):
    queryset = Encounter.objects.select_related(
        'patient', 'rendering_provider', 'primary_insurance'
    ).prefetch_related('diagnoses', 'service_lines')
    
    serializer_class = EncounterCreateUpdateSerializer
    pagination_class = EncounterPagination
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'  # UUID

    def get_serializer_class(self):
        if self.action == 'list':
            return EncounterListSerializer
        if self.action == 'retrieve':
            return EncounterDetailSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        # We use distinct() on the values of the fields we want to count/return 
        # to ensure the paginator count matches the unique records.
        qs = super().get_queryset().distinct()
        patient_id = self.request.query_params.get('patient')
        status_filter = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if date_from:
            qs = qs.filter(service_date_from__gte=date_from)
        if date_to:
            qs = qs.filter(service_date_from__lte=date_to)

        # -------------------------
        # COLUMN FILTERS (ADDED)
        # -------------------------
        encounter_number = self.request.query_params.get('encounter_number')
        batch_number = self.request.query_params.get('batch_number')
        service_date = self.request.query_params.get('service_date')
        patient_name = self.request.query_params.get('patient_name')
        provider_name = self.request.query_params.get('provider_name')
        insurance = self.request.query_params.get('primary_insurance')
        total_charges = self.request.query_params.get('total_charges')

        if encounter_number:
            qs = qs.filter(encounter_number__icontains=encounter_number)

        if batch_number:
            qs = qs.filter(batch_number__icontains=batch_number)

        if service_date:
            qs = qs.filter(service_date_from=service_date)

        if patient_name:
            qs = qs.filter(
                Q(patient__first_name__icontains=patient_name) |
                Q(patient__last_name__icontains=patient_name)
            )

        if provider_name:
            qs = qs.filter(
                Q(rendering_provider__first_name__icontains=provider_name) |
                Q(rendering_provider__last_name__icontains=provider_name)
            )

        # if insurance:
        #     qs = qs.filter(primary_insurance__name__icontains=insurance)

        if total_charges:
            qs = qs.filter(total_charges=total_charges)

        # -------------------------
        # EXISTING PARAMS LOGIC
        # -------------------------
        # use_params = self.request.query_params.get('params', 'false').lower() == 'true'
        # if not use_params:
        #     return qs.order_by('-service_date_from')

        global_search_value = self.request.query_params.get('all')
        if global_search_value:
            qs = qs.filter(
                Q(encounter_number__icontains=global_search_value) |
                Q(batch_number__icontains=global_search_value) |
                Q(service_date_from__icontains=global_search_value) |
                Q(patient__first_name__icontains=global_search_value) |
                Q(patient__last_name__icontains=global_search_value) |
                Q(rendering_provider__first_name__icontains=global_search_value) |
                Q(rendering_provider__last_name__icontains=global_search_value) |
                # Q(primary_insurance__name__icontains=global_search_value) |
                Q(status__icontains=global_search_value) |
                Q(total_charges__icontains=global_search_value)
            )

        orm_filters = {}
        for param, value in self.request.query_params.items():
            if param in [
                'params', 'page', 'page_size', 'all',
                'patient', 'status', 'date_from', 'date_to',
                'encounter_number', 'batch_number', 'service_date',
                'patient_name', 'provider_name',
                'total_charges'
            ]:
                continue
            orm_filters[param] = value

        if orm_filters:
            q = Q()
            for field, value in orm_filters.items():
                q &= Q(**{f"{field}__iexact": value})
            qs = qs.filter(q)

        return qs.order_by('-service_date_from', 'id')

    @action(detail=True, methods=['post'], url_path='duplicate')
    def duplicate(self, request, id=None):
        """Create a copy of existing encounter (useful for follow-ups)"""
        encounter = self.get_object()

        # Snapshot the originals BEFORE creating the copy. The nested querysets
        # must be materialised now, because once we re-point `encounter` at a
        # brand-new row its `diagnoses`/`service_lines` would resolve to the
        # (empty) copy and nothing would be duplicated.
        original_diagnoses = list(encounter.diagnoses.all())
        original_service_lines = list(encounter.service_lines.all())
        try:
            # Reverse OneToOne: raises RelatedObjectDoesNotExist (an
            # ObjectDoesNotExist, NOT AttributeError) when absent, so getattr's
            # default won't catch it.
            original_ambulance = encounter.ambulance_detail
        except ObjectDoesNotExist:
            original_ambulance = None

        with transaction.atomic():
            new_encounter = encounter
            new_encounter.pk = None
            new_encounter.id = uuid.uuid4()          # UUID PK: assign explicitly (default only fires at init)
            new_encounter._state.adding = True
            new_encounter.status = 'draft'
            new_encounter.encounter_number = None    # unique field — let save() regenerate a fresh one
            new_encounter.save()

            for diag in original_diagnoses:
                diag.pk = None
                diag._state.adding = True
                diag.encounter = new_encounter
                diag.save()

            for line in original_service_lines:
                line.pk = None
                line._state.adding = True
                line.encounter = new_encounter
                line.save()

            if original_ambulance is not None:
                original_ambulance.pk = None
                original_ambulance._state.adding = True
                original_ambulance.encounter = new_encounter
                original_ambulance.save()

        serializer = EncounterDetailSerializer(new_encounter)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # @action(detail=False, methods=['post'], url_path='filter')
    # def filter_encounters(self, request):
    #     """
    #     POST /encounters/filter/
    #     """
    #     filters = request.data.get("filters", {})

    #     if not filters:
    #         return Response(
    #             {"error": "filters are required"},
    #             status=status.HTTP_400_BAD_REQUEST
    #         )

    #     FILTER_FIELD_MAP = {
    #         "encounter_number": "encounter_number",
    #         "status": "status",

    #         "first_name": "patient__first_name",
    #         "last_name": "patient__last_name",
    #         "dob": "patient__dob",
    #     }

    #     orm_filters = {} 

    #     for field, value in filters.items():
    #         if field not in FILTER_FIELD_MAP:
    #             return Response(
    #                 {"error": f"Filtering by '{field}' is not allowed"},
    #                 status=400
    #             )
    #         orm_filters[FILTER_FIELD_MAP[field]] = value

    #     print(f"the field data is : {orm_filters}",flush=True)
    #     queryset = (
    #         self.get_queryset()
    #         .filter(**orm_filters)
    #     )
    #     print(f"the query aet data  :{queryset}",flush=True)

    #     serializer = EncounterListSerializer(queryset, many=True)
    #     return Response(serializer.data, status=status.HTTP_200_OK)
    

class ServiceLocationViewSet(viewsets.ModelViewSet):
    """
    Manage service locations (offices, clinics)
    Used for appointments, encounters, claims
    """
    queryset = ServiceLocation.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.action == 'list':
            return ServiceLocationListSerializer
        if self.action == 'retrieve':
            return ServiceLocationDetailSerializer
        return ServiceLocationCreateUpdateSerializer

    def get_queryset(self):
        # You can add tenant/practice filtering here later
        return super().get_queryset().order_by('name')

    # Optional: endpoint to get only active locations for dropdowns
    @action(detail=False, methods=['get'], url_path='active')
    def active(self, request):
        qs = self.get_queryset().filter(is_active=True)
        serializer = ServiceLocationListSerializer(qs, many=True)
        return Response(serializer.data)

# Pending Insurance
class EncounterFormDataView(generics.RetrieveAPIView):
    queryset = Encounter.objects.select_related(
        'patient', 'rendering_provider', 'supervising_provider', 
        'referring_provider', 'primary_insurance', 'appointment'
    ).prefetch_related('diagnoses', 'service_lines', 'ambulance_detail')
    serializer_class = EncounterFullDetailSerializer
    lookup_field = 'id'
    permission_classes = [IsAuthenticated]


class EncounterstatusupdateViewSet(viewsets.ModelViewSet):
    serializer_class = EncounterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Encounter.objects.select_related("patient")

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-submit"
    )
    def bulk_submit(self, request):
        """
        POST /api/encounters/bulk-submit/
        """
        encounter_ids = request.data.get("encounter_ids", [])

        if not encounter_ids:
            return Response(
                {"detail": "encounter_ids is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        encounters = Encounter.objects.filter(id__in=encounter_ids)

        submitted = []
        skipped = []

        with transaction.atomic():
            for encounter in encounters:
                if encounter.status == "accepted":
                    encounter.status = "submitted"

                    encounter.save(update_fields=["status"])
                    submitted.append(str(encounter.id))
                    try:
                        claim = Claim.objects.select_for_update().get(encounter=encounter)
                    except Claim.DoesNotExist:
                        raise ValidationError(
                            f"No claim found for encounter {encounter.id}"
                        )
                    claim.status = "pending_insurance"
                    claim.save(update_fields=["status"])
                else:
                    skipped.append({
                        "encounter_id": str(encounter.id),
                        "current_status": encounter.status
                    })

        return Response(
            {
                "submitted_count": len(submitted),
                "submitted_encounters": submitted,
                "skipped": skipped
            },
            status=status.HTTP_200_OK
        )


class Autofill_appointment_APIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        appointment_id = request.GET.get('id')

        if not appointment_id:
            return Response([{"error": "Please Give valid ID"}], status=status.HTTP_400_BAD_REQUEST)
        
        note = ClinicalNote.objects.filter(appointment_id=appointment_id).first()
        if not note:
            return Response({"error": "clinical note not found"}, status=404)
        
        if not note.sections_notes:
            return Response({"error": "Section note not found"}, status=404)
        
        if not note.is_signed:
            return Response({"error": "The Appointment is not signed OFF"}, status=status.HTTP_400_BAD_REQUEST)
        
        extracted_result = get_cpt_codes_from_notes({"section notes":note.sections_notes})

        # geting the charge from practice settings 

        cpt_datas = extracted_result.get("Cpt_codes", [])
        if cpt_datas:
            cpt_codes = [str(c['cpt']).replace("-","").replace(":","").replace(",","").replace(".","") for c in cpt_datas if c.get('cpt')]

            fees = FeeScheduleEntry.objects.filter(
                procedure_code__in=cpt_codes
            ).values(
                'procedure_code',
                'par_amount'
            )

            fee_map = {f['procedure_code']: f for f in fees}

            for item in cpt_datas:
                code = item.get('cpt')
                if code and code in fee_map:
                    item['charge'] = fee_map[code]['par_amount']
                    item['is_fee'] = True
                else:
                    item['charge'] = ""
                    item['is_fee'] = False

        return Response(extracted_result, status=status.HTTP_200_OK)


class FeeScheduleListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Look for 'search' or 'code' params
        search_value = request.query_params.get('search') or request.query_params.get('code')
        
        if search_value:
            # Search by procedure_code starting with the value (more relevant than icontains)
            # and limit to 30 as requested. 
            # istartswith is usually faster and more relevant for CPT codes
            qs = FeeScheduleEntry.objects.filter(
                procedure_code__istartswith=search_value,
                is_active=True
            ).only('procedure_code', 'par_amount').order_by('procedure_code')[:30]
        else:
            # Default: list first 50
            qs = FeeScheduleEntry.objects.filter(
                is_active=True
            ).only('procedure_code', 'par_amount').order_by('procedure_code')[:50]
        
        serializer = FeeScheduleEntryMinimalSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
        