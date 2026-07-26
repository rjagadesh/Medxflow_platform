import os
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from tenant_encounter.models import Encounter,EncounterServiceLine
from .services import ClaimBuilderService
from .services import *
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Claim
from rest_framework import viewsets
from django.db import transaction
from .serializers import ClaimSerializer
from rest_framework.decorators import api_view, permission_classes
from .serializers import *
from rest_framework import status
from django.conf import settings
from django.http import FileResponse
from tenant_encounter.serializers import *
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.db.models import Prefetch

# Create your views here.
@api_view(["POST"])
def submit_claims_bulk(request):
    encounter_ids = request.data.get("encounter_ids", [])

    if not encounter_ids:
        return Response(
            {"error": "encounter_ids list is required"},
            status=400
        )
    
    results = []

    for encounter_id in encounter_ids:
        try:
            with transaction.atomic():
                encounter = (
                    Encounter.objects
                    .select_for_update()
                    .get(id=encounter_id)
                )

                claim = ClaimBuilderService.build_from_encounter(encounter)

                if claim.status == "submitted":
                    results.append({
                        "encounter_id": str(encounter_id),
                        "status": "already_submitted",
                        "claim_id": str(claim.id),
                        "claim_number": claim.claim_number
                    })
                    continue

                edi = EDI837Generator().generate(claim)

                claim.status = "submitted"
                claim.submitted_at = timezone.now()
                claim.save(update_fields=["status", "submitted_at"])

                results.append({
                    "encounter_id": str(encounter_id),
                    "status": "submitted",
                    "claim_id": str(claim.id),
                    "claim_number": claim.claim_number,
                    "edi" :edi
                })

        except Encounter.DoesNotExist:
            results.append({
                "encounter_id": str(encounter_id),
                "status": "encounter_not_found"
            })

        except Exception as e:
            results.append({
                "encounter_id": str(encounter_id),
                "status": "error",
                "error": str(e)
            })

    return Response({
        "message": "Bulk claim submission processed",
        "results": results
    })

class ClaimViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/claims/
    GET /api/claims/{id}/
    """
    serializer_class = ClaimSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Claim.objects
            .select_related("encounter","encounter__patient")
            .order_by("-created_at")
        )

# class ClaimServiceLineViewSet(viewsets.ReadOnlyModelViewSet):
#     """
#     GET /api/claim-lines/
#     GET /api/claim-lines/{id}/
#     """
#     serializer_class = ClaimServiceLineSerializer
#     permission_classes = [IsAuthenticated]

# def get_queryset(self):
#     queryset = (
#         ClaimServiceLine.objects
#         .select_related(
#             "claim",
#             "claim__encounter",
#             "claim__encounter__patient"
#         )
#     )

#     claim_id = self.request.query_params.get("claim_id")
#     if claim_id:
#         queryset = queryset.filter(claim_id=claim_id)

#     return queryset

    
class EncounterServiceLineViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EncounterServiceLineSerializer_claim
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            EncounterServiceLine.objects
            .select_related(
                "encounter",
                "encounter__patient",
                "encounter__submitted_claim"
            )
        )
    

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_claim_status(request, claim_id):
    claim = get_object_or_404(Claim, id=claim_id)

    serializer = ClaimStatusUpdateSerializer(
        claim, data=request.data, partial=True
    )

    if serializer.is_valid():
        serializer.save()

        # Auto-set submitted_at when submitted
        if serializer.validated_data.get("status") == "submitted":
            claim.submitted_at = timezone.now()
            claim.save(update_fields=["submitted_at"])

        return Response(
            {
                "message": "Claim status updated successfully",
                "claim_id": str(claim.id),
                "new_status": claim.status
            },
            status=status.HTTP_200_OK
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_new_claim_status(request, claim_id):
    claim = get_object_or_404(Claim, id=claim_id)

    status_value = request.data.get("status")
    if not status_value:
        return Response(
            {"error": "status is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    claim.status = status_value
    claim.save(update_fields=["status"])

    return Response(
        {
            "message": "Claim status updated successfully",
            "claim_id": str(claim.id),
            "new_status": claim.status,
        },
        status=status.HTTP_200_OK,
    )



def writing_837(x12_format,patient_id):
    # patient_id = json_data[0]["patient"]["id"]

    # media/837_files/ 
    base_dir = os.path.join(settings.MEDIA_ROOT, "Encounter_837")

    os.makedirs(base_dir, exist_ok=True)

    # x12_format = build_837(json_data)

    file_path = os.path.join(base_dir, f"{patient_id}.txt")

    with open(file_path, "w", encoding="utf-8") as text_file:
        text_file.write(x12_format)

    return os.path.relpath(file_path, settings.MEDIA_ROOT)


@api_view(['POST'])
def get_837_file(request):
    encounder_ids = request.data.get("encounter_id",[])

    if not encounder_ids:
        resp = {"error":"need encounter ids to generate"}
        return Response (resp,status=404)
    
    print(f"the input encounter is  : {encounder_ids}",flush = True)

    list_encounter = []

    for single_encounter in encounder_ids:
        enc = Encounter.objects.filter(id=single_encounter).first()
        if enc.do_not_send_electronically == False:
            list_encounter.append(single_encounter)
    
    if not list_encounter:
        resp = {"status":"not generating 837 due to the encounter deos not need electronic 837's"}
        return Response (resp,status=status.HTTP_200_OK)

    # encounter = (
    #     Encounter.objects
    #     .select_related(
    #         "patient",
    #         "rendering_provider",
    #         "supervising_provider",
    #         "referring_provider",
    #         "primary_insurance__payer",
    #         "appointment"
    #     )
    #     .prefetch_related(
    #         "diagnoses",
    #         "service_lines",
    #         "ambulance_detail"   # if OneToOne or reverse FK
    #     )
    #     .filter(id__in=list_encounter)
    # )

    encounter = (
    Encounter.objects
    .select_related(
        "patient",
        "rendering_provider",
        "supervising_provider",
        "referring_provider",
        "primary_insurance__payer",
        "appointment"
    )
    .prefetch_related(
        "diagnoses",
        Prefetch(
            "service_lines",
            queryset=EncounterServiceLine.objects.filter(is_voided=False)
        ),
        "ambulance_detail"
    )
    .filter(id__in=list_encounter)
    )

    updated_count = encounter.filter(status__in=['accepted']).update(status='submitted')
    print(f"Updated {updated_count} encounter(s) to submitted", flush=True)

    updated_claims = Claim.objects.filter(
        encounter__in=encounter,
    ).update(
        status='Pending Insurance',
        submitted_at=timezone.now()
    )
    print(f"Updated {updated_claims} claim(s) to 'Pending Insurance'", flush=True)

    serializer = EncounterDetailSerializer(encounter, many=True)

    # converting the JSON to correct format
    validated_json = transform_db_to_input(serializer.data)

    # converting to 837  from the extarcted JSON
    generator = EDI837Generator()
    edi_output = generator.generate(validated_json)

    # writing on the text file and returning it
    text_file_path = writing_837(edi_output,serializer.data[0]['id'])

    # output = {"text_file_path": text_file_path}
    file_path = os.path.join(settings.MEDIA_ROOT, text_file_path)

    if not os.path.exists(file_path):
        return Response(
            {"error": "File not found"},
            status=404
        )

    return FileResponse(
        open(file_path, "rb"),
        as_attachment=True,
        filename=os.path.basename(file_path),
        content_type="text/plain"
    )

    # data = {"file_path":"D:\PMS_EHR\cloud_platform_django\media\Encounter_837\6344fb2a-bf3e-4331-8f6e-af19128c181e.txt"}
    # return Response (serializer.data)


@api_view(['POST'])
def get_837_data(request):
    encounder_ids = request.data.get("encounter_id",[])

    if not encounder_ids:
        resp = {"error":"need encounter ids to generate"}
        return Response (resp,status=404)
    
    print(f"the input encounter is  : {encounder_ids}",flush = True)

    encounter = (
        Encounter.objects
        .select_related(
            "patient",
            "rendering_provider",
            "supervising_provider",
            "referring_provider",
            "primary_insurance__payer",
            "appointment"
        )
        .prefetch_related(
            "diagnoses",
            "service_lines",
            "ambulance_detail"  
        )
        .filter(id__in=encounder_ids)
    )

    serializer = EncounterDetailSerializer(encounter, many=True)
    return Response (serializer.data)


@api_view(['POST'])
def get_835_file(request):
    try:
        uploaded = request.FILES.get("file")
        encounter_id = request.data.get("encounter_id")

        if not uploaded:
            return Response({"error": "File missing"}, status=400)
        if encounter_id is None:
            return Response(
                {"error": "Encounter ID not found in 835 file"},
                status=400
            )

        era_dir = os.path.join(settings.MEDIA_ROOT, "835_files")
        file_dir = os.path.join(era_dir,encounter_id)
        os.makedirs(file_dir, exist_ok=True)

        file_path = os.path.join(file_dir, uploaded.name)
        with open(file_path, "wb+") as f:
            for chunk in uploaded.chunks():
                f.write(chunk)

        db_file_path =  f"/media/835_files/{uploaded.name}"

        return Response({
            "message": "835 file uploaded successfully",
            "saved_file":db_file_path,
            "encounter_id": encounter_id
        }, status=200)
    
    except:
        import traceback as tr
        return Response({"error":str(tr.format_exc())},status=404)




class SFTPConfigurationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = SFTPConfiguration.objects.all().order_by("-created_at")
        serializer = SFTPConfigurationSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SFTPConfigurationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        return Response(
            {"id": instance.id, "message": "Created"},
            status=201
        )
    
# from django.shortcuts import get_object_or_404

class SFTPConfigurationDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        instance = get_object_or_404(SFTPConfiguration, pk=pk)
        serializer = SFTPConfigurationSerializer(instance)
        return Response(serializer.data)

    # Full update
    def put(self, request, pk):
        instance = get_object_or_404(SFTPConfiguration, pk=pk)
        serializer = SFTPConfigurationSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Updated successfully"})

    # Partial update
    def patch(self, request, pk):
        instance = get_object_or_404(SFTPConfiguration, pk=pk)
        serializer = SFTPConfigurationSerializer(
            instance,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Partially updated successfully"})

