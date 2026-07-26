from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PaymentSerializer
from tenant_app.models import Patient,Appointment
from tenant_encounter.models import Encounter
from tenant_claim_submission.models import Claim
from tenant_claim_submission.models import Claim
from django.db.models import Q
from rest_framework.decorators import action
from decimal import Decimal


from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Q
from django.shortcuts import get_object_or_404

from .models import (
    Payment,
    Payment_EOB,
    Payment_EOB_Adjustment,
    PaymentLedger,
    ProviderLedger,
    AdjustmentCode,
)
from .serializers import (
    PaymentSerializer,
    PaymentEOBSerializer,
    PaymentEOBAggregatedSerializer,
    PaymentEOBAdjustmentSerializer,
    PaymentLedgerSerializer,
    ProviderLedgerSerializer,
    AdjustmentCodeSerializer,
)


# class PaymentListCreateAPIView(APIView):

#     def get(self, request):
#         qs = Payment.objects.all().order_by('created_at')
#         serializer = PaymentSerializer(qs, many=True)
#         return Response(serializer.data)

#     def post(self, request):
#         serializer = PaymentSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# class PaymentRetrieveUpdateDeleteAPIView(APIView):

#     def get_object(self, batch_no):
#         try:
#             return Payment.objects.get(batch_no=batch_no)
#         except Payment.DoesNotExist:
#             return None

#     def get(self, request, batch_no):
#         obj = self.get_object(batch_no)
#         if not obj:
#             return Response({"detail": "Not found"}, status=404)
#         serializer = PaymentSerializer(obj)
#         return Response(serializer.data)

#     def put(self, request, batch_no):
#         obj = self.get_object(batch_no)
#         if not obj:
#             return Response({"detail": "Not found"}, status=404)

#         serializer = PaymentSerializer(obj, data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         return Response(serializer.errors, status=400)

#     def patch(self, request, batch_no):
#         obj = self.get_object(batch_no)
#         if not obj:
#             return Response({"detail": "Not found"}, status=404)

#         serializer = PaymentSerializer(obj, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         return Response(serializer.errors, status=400)

#     def delete(self, request, batch_no):
#         obj = self.get_object(batch_no)
#         if not obj:
#             return Response({"detail": "Not found"}, status=404)
#         obj.delete()
#         return Response(status=status.HTTP_204_NO_CONTENT)

# # class Payment_EOBRetriveUpdateDeleteAPIView(APIView):
#     def get(self,request):
#         batch_no = request.GET.get("batch_no")
#         encounter_id = request.GET.get("encounter_id")
#         claim_id= request.GET.get("claim_id")

#         queryset = Payment_EOB.objects.select_related("payment_id", "encounter_id", "claim")

#         if claim_id:
#             queryset = queryset.filter(claim__id = claim_id)
        
#         elif batch_no:
#             queryset = queryset.filter(payment_id__batch_no=batch_no)

#         elif encounter_id:
#             queryset = queryset.filter(encounter_id__id=encounter_id)

#         # Paginate results
#         # paginator = PageNumberPagination()
#         # paginator.page_size = 20
#         # paginated_data = paginator.paginate_queryset(queryset, request)

#         serializer = Payment_EOBSerializer(queryset, many=True)
#         return Response(serializer.data)



#     def post(self,request):
#         serializer = Payment_EOBSerializer(data = request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class Payment_patient_search_APIView(APIView):

    def search_patient(self, data):
        patients = Patient.objects.filter(
            Q(first_name__icontains=data) |
            Q(last_name__icontains=data)
        ).values("id", "first_name", "last_name")

        return Response(list(patients), status=status.HTTP_200_OK)
    
    def search_appointment(self, data):
        appointment = (
        Appointment.objects.filter(id__icontains=data)
        .values("id")
        )

        return Response(list(appointment), status=status.HTTP_200_OK)

    def search_encounter(self,data):
        # encounters = Encounter.objects.filter(
        #     Q(encounter_number__icontains = data)
        # ).values("id",'encounter_number','patient_id')
        encounters = (
        Encounter.objects.filter(encounter_number__icontains=data)
        .filter(status="submitted")
        .values("id", "encounter_number", "patient_id")
        )

        return Response(list(encounters),status=status.HTTP_200_OK)

    def search_claims(self,data):
        claims_data = Claim.objects.filter(
            Q(claim_number__icontains = data)
        ).values("id",'claim_number')

        return Response(list(claims_data),status=status.HTTP_200_OK)
    
    def get(self,request):
        p_type = request.GET.get("type")
        data = request.GET.get("name")

        list_type =  ['patient','encounter','claims',"appointment"]

        if p_type not in list_type:
            return Response([{"error": "Invalid type"}], status=status.HTTP_400_BAD_REQUEST)

        if p_type == "patient":
            return self.search_patient(data)

        elif p_type == "encounter":
            return self.search_encounter(data)

        elif p_type == "claims":
            return self.search_claims(data)
        
        elif p_type == "appointment":
            return self.search_appointment(data)
        
class Payment_Patient_EOB_details_APIView(APIView):

    def search_via_patient(self,data):
        pat_obj = Patient.objects.filter(id = data).first()
        if not pat_obj:
            return Response({"error": "patient not found"}, status=status.HTTP_404_NOT_FOUND)
        
        encounters = Encounter.objects.filter(patient=pat_obj)
        if not encounters.exists():
            return Response({"error": "No encounters found"}, status=status.HTTP_404_NOT_FOUND)

        results = []

        for encounter in encounters:

            service_line = encounter.service_lines.first()
            from_date = service_line.date_from if service_line else None
            to_date = service_line.date_to if service_line else None

            claims = Claim.objects.filter(encounter=encounter)

            if not claims.exists():
                continue

            for claim in claims:
                results.append({
                    "patient_id": str(pat_obj.id),
                    "patient_first_name": pat_obj.first_name,
                    "patient_last_name": pat_obj.last_name,
                    "encounter_id": str(encounter.id),
                    "encounter_number": encounter.encounter_number,
                    "claim_id": str(claim.id),
                    "claim_number": claim.claim_number,
                    "total_charge": str(claim.charge_amount),
                    "allowed":str(claim.allowed),
                    "balance_due": str(claim.balance_due),
                    "paid": str(claim.paid),
                    "code":str(claim.procedure_code),
                    "payer_claim_id": str(claim.payer_claim_id),
                    "from_date":from_date,
                    "to_date":to_date,


                })

        # for encounter in encounters:
        #     claim = Claim.objects.filter(encounter=encounter)
        #     if not claim:
        #         continue

        #     # service_lines = ClaimServiceLine.objects.filter(claim_id=claim.id).values(
        #     #     "claim",
        #     #     "procedure_code",
        #     #     "charge_amount",
        #     #     "units",
        #     #     "modifiers",
        #     #     "date_from",
        #     # )

        #     results.append({
        #         "patient_id": str(pat_obj.id),
        #         "patient_first_name": pat_obj.first_name,
        #         "patient_last_name": pat_obj.last_name,
        #         "encounter_id": str(encounter.id),
        #         "encounter_number": encounter.encounter_number,
        #         "claim_id": str(claim.id),
        #         "claim_number": claim.claim_number,
        #         "total_charge": str(claim.total_charge),
        #         "balance_due": str(claim.balance_due),
        #         "payer_claim_id": str(claim.payer_claim_id)
        #     })

        if not results:
            return Response({"error": "No claims or service lines found for this patient"}, status=status.HTTP_404_NOT_FOUND)

        return Response(results, status=status.HTTP_200_OK)

    def search_via_encounter(self, data):
        encounter_obj = Encounter.objects.filter(id=data).first()

        first_service_line = encounter_obj.service_lines.first()

        first_from = first_service_line.date_from
        first_to = first_service_line.date_to
        if not encounter_obj:
            return Response({"error": "Encounter not found"}, status=status.HTTP_404_NOT_FOUND)

        claims = Claim.objects.filter(encounter=encounter_obj)
        if not claims.exists():
            return Response({"error": "No claims found for this encounter"}, status=status.HTTP_404_NOT_FOUND)

        results = []

        for claim in claims:
        #     service_lines = list(
        #     ClaimServiceLine.objects.filter(claim_id=claim.id).values(
        #         "claim",
        #         "procedure_code",
        #         "charge_amount",
        #         "units",
        #         "modifiers",
        #         "date_from",
        #     )
        # )

            results.append({
                "claim_id": str(claim.id),
                "claim_number": claim.claim_number,
                "total_charge": str(claim.charge_amount),
                "balance_due": str(claim.balance_due),
                "payer_claim_id": str(claim.payer_claim_id),
                # "service_line": service_lines,
                "patient_first_name": encounter_obj.patient.first_name,
                "patient_last_name": encounter_obj.patient.last_name,
                "encounter_number": encounter_obj.encounter_number,
                "from_date":first_from,
                "to_date":first_to,

            })

        return Response(results, status=status.HTTP_200_OK)

    def search_via_claim(self, data):
        claims = Claim.objects.filter(id=data)
        results = []

        for claim in claims:
            encounter = claim.encounter

            service_line = encounter.service_lines.first()

            from_date = service_line.date_from if service_line else None
            to_date = service_line.date_to if service_line else None

            results.append({
                "claim_id": str(claim.id),
                "claim_number": claim.claim_number,
                "total_charge": str(claim.charge_amount),
                "balance_due": str(claim.balance_due),
                "payer_claim_id": str(claim.payer_claim_id),
                "patient_first_name": encounter.patient.first_name,
                "patient_last_name": encounter.patient.last_name,
                "encounter_number": encounter.encounter_number,
                "from_date": from_date,
                "to_date": to_date,
            })

        return Response(results, status=status.HTTP_200_OK)
    def search_via_appointment(self, appointment_id):
        results = []

        encounters = Encounter.objects.filter(appointment_id=appointment_id)

        claims = (
            Claim.objects
            .select_related("encounter", "encounter__patient")
            .prefetch_related("encounter__service_lines")
            .filter(encounter__in=encounters)
        )

        for claim in claims:
            encounter = claim.encounter
            service_line = encounter.service_lines.first()

            results.append({
                "claim_id": str(claim.id),
                "claim_number": claim.claim_number,
                "total_charge": str(claim.charge_amount),
                "balance_due": str(claim.balance_due),
                "payer_claim_id": str(claim.payer_claim_id),
                "patient_first_name": encounter.patient.first_name,
                "patient_last_name": encounter.patient.last_name,
                "encounter_number": encounter.encounter_number,
                "from_date": service_line.date_from if service_line else None,
                "to_date": service_line.date_to if service_line else None,
            })

        return Response(results, status=status.HTTP_200_OK)

    
    def get(self,request):
        p_type = request.GET.get("type")
        data = request.GET.get("name")

        list_type =  ['patient','encounter','claims','appointment']

        if p_type not in list_type:
            return Response([{"error": "Invalid type"}], status=status.HTTP_400_BAD_REQUEST)
        
        if p_type == 'patient':
            return self.search_via_patient(data)
        elif p_type == 'encounter':
            return self.search_via_encounter(data)
        elif p_type == 'claims':
            return self.search_via_claim(data)
        elif p_type == 'appointment':
            return self.search_via_appointment(data)




#written by kaarthik
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by("-created_at")
    serializer_class = PaymentSerializer

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def finalize(self, request, pk=None):
        payment = self.get_object()

        claim_payments = (
            PaymentLedger.objects.filter(
                batch=payment, entry_type="PAYMENT"
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )

        plb_total = (
            ProviderLedger.objects.filter(batch=payment)
            .aggregate(total=Sum("amount"))["total"]
            or 0
        )

        if claim_payments + plb_total != payment.total_amount:
            return Response(
                {"error": "Batch is not reconciled"},
            )

        payment.status = "POSTED"
        payment.save(update_fields=["status"])

        return Response({"status": "POSTED"})

class PaymentEOBViewSet(viewsets.ModelViewSet):
    queryset = Payment_EOB.objects.all().order_by("-created_at")
    serializer_class = PaymentEOBSerializer
    http_method_names = ["get", "post"]

    def get_queryset(self):
        qs = super().get_queryset()
        payment_id = self.request.query_params.get("payment_id")
        claim_id = self.request.query_params.get("claim_id")

        if payment_id:
            qs = qs.filter(payment_id=payment_id)
        if claim_id:
            qs = qs.filter(claim_id=claim_id)

        return qs

    def perform_create(self, serializer):
        with transaction.atomic():
            eob = serializer.save()

            if not eob.claim_id:
                return

            data = self.request.data
            updates = {}

            # Update only if explicitly present
            if "allowed" in data and data["allowed"] is not None:
                updates["allowed"] = Decimal(data["allowed"])

            if "paid" in data and data["paid"] is not None:
                updates["paid"] = Decimal(data["paid"])

            if "balance" in data and data["balance"] is not None:
                updates["balance_due"] = Decimal(data["balance"])


            if (
                "allowed" in data
                and "paid" in data
                and data["allowed"] is not None
                and data["paid"] is not None
            ):
                allowed = Decimal(data["allowed"])
                paid = Decimal(data["paid"])

                if allowed - paid <= 0:
                    updates["status"] = "Completed"
                else:
                    updates["status"] = "Pending Patient"


            if updates:
                (
                    eob.claim.__class__.objects
                    .filter(pk=eob.claim_id)
                    .update(**updates)
                )

class PaymentEOBAggregatedView(APIView):
    def get(self, request, eob_id):
        eob = get_object_or_404(Payment_EOB, id=eob_id)
        serializer = PaymentEOBAggregatedSerializer(eob)
        return Response(serializer.data)

class PaymentEOBAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = Payment_EOB_Adjustment.objects.all()
    serializer_class = PaymentEOBAdjustmentSerializer
    http_method_names = ["get", "post"]

    def get_queryset(self):
        qs = super().get_queryset()
        eob_id = self.request.query_params.get("eob_id")
        if eob_id:
            qs = qs.filter(eob_id=eob_id)
        return qs

class PaymentEOBLineViewSet(viewsets.ModelViewSet):

    def get_queryset(self):
        qs = super().get_queryset()
        eob_id = self.request.query_params.get("eob_id")
        if eob_id:
            qs = qs.filter(eob_id=eob_id)
        return qs


class AdjustmentCodeViewSet(viewsets.ModelViewSet):
    queryset = AdjustmentCode.objects.filter(is_active=True)
    serializer_class = AdjustmentCodeSerializer



class PatientLedgerView(APIView):
    def get(self, request, patient_id):
        ledgers = (
            PaymentLedger.objects
            .filter(claim__encounter__patient_id=patient_id)
            .select_related("claim__encounter")
            .order_by("posting_date", "created_at")
        )

        rows = []
        seen_claims = set()

        for ledger in ledgers:
            claim = ledger.claim
            encounter = claim.encounter

            # 1. Add CHARGE row once per claim
            if claim.id not in seen_claims:
                seen_claims.add(claim.id)

                rows.append({
                    "date": claim.created_at.date().isoformat(),
                    "encounter": encounter.encounter_number,
                    "type": "CHARGE",
                    "description": claim.procedure_code or "Claim Charge",
                    "charge": float(claim.charge_amount or 0),
                    "payment": 0,
                    "adjustment": 0,
                })

            # 2. Add ledger row
            row = {
                "date": ledger.posting_date.isoformat(),
                "encounter": encounter.encounter_number,
                "type": ledger.entry_type.replace("_", " "),
                "description": (
                    ledger.adjustment_code.code
                    if ledger.adjustment_code
                    else ledger.source
                ),
                "charge": 0,
                "payment": 0,
                "adjustment": 0,
            }

            if ledger.entry_type == "PAYMENT":
                row["payment"] = float(ledger.amount)
                row["adjustment"] = float(abs(ledger.adj_amount or 0))


            if ledger.entry_type == "CHARGE":
                row["adjustment"] = float(abs(ledger.amount))

            rows.append(row)

        return Response(rows)


class PaymentLedgerViewSet(viewsets.ModelViewSet):
    queryset = PaymentLedger.objects.all().order_by("-created_at")
    serializer_class = PaymentLedgerSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        claim_id = self.request.query_params.get("claim_id")
        batch_id = self.request.query_params.get("batch_id")

        if claim_id:
            qs = qs.filter(claim_id=claim_id)
        if batch_id:
            qs = qs.filter(batch_id=batch_id)

        return qs

    def update(self, request, *args, **kwargs):
        return Response(
            {"error": "Ledger entries are immutable. Use reversal."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"error": "Ledger entries cannot be deleted."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class ProviderLedgerViewSet(viewsets.ModelViewSet):
    queryset = ProviderLedger.objects.all().order_by("-created_at")
    serializer_class = ProviderLedgerSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        batch_id = self.request.query_params.get("batch_id")
        if batch_id:
            qs = qs.filter(batch_id=batch_id)
        return qs

    def update(self, request, *args, **kwargs):
        return Response(
            {"error": "Ledger entries are immutable. Use reversal."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"error": "Ledger entries cannot be deleted."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class ClaimBalanceView(APIView):
    def get(self, request, claim_id):
        totals = PaymentLedger.objects.filter(
            claim_id=claim_id
        ).aggregate(
            total=Sum("amount"),
            patient=Sum("amount", filter=Q(responsibility_type="PATIENT")),
            payer=Sum("amount", filter=Q(responsibility_type="PAYER")),
        )

        return Response({
            "claim_id": claim_id,
            "claim_balance": totals["total"] or 0,
            "patient_balance": totals["patient"] or 0,
            "payer_balance": totals["payer"] or 0,
        })


class ReverseClaimLedgerEntry(APIView):
    @transaction.atomic
    def post(self, request, ledger_id):
        original = get_object_or_404(PaymentLedger, id=ledger_id)

        reversal = PaymentLedger.objects.create(
            batch=original.batch,
            claim=original.claim,
            claim_line_id=original.claim_line_id,
            entry_type="REVERSAL",
            amount=-original.amount,
            responsibility_type=original.responsibility_type,
            adjustment_code=original.adjustment_code,
            reference_id=str(original.id),
            posting_date=original.posting_date,
        )

        return Response({"reversal_id": reversal.id})

class ReverseProviderLedgerEntry(APIView):
    @transaction.atomic
    def post(self, request, ledger_id):
        original = get_object_or_404(ProviderLedger, id=ledger_id)

        reversal = ProviderLedger.objects.create(
            batch=original.batch,
            entry_type="REVERSAL",
            amount=-original.amount,
            plb_reason_code=original.plb_reason_code,
            plb_identifier=str(original.id),
            posting_date=original.posting_date,
        )

        return Response({"reversal_id": reversal.id})



def reconcile_batch(payment):
    claim_payments = (
        PaymentLedger.objects.filter(
            batch=payment, entry_type="PAYMENT"
        ).aggregate(total=Sum("amount"))["total"]
        or 0
    )

    plb_total = (
        ProviderLedger.objects.filter(batch=payment)
        .aggregate(total=Sum("amount"))["total"]
        or 0
    )

    reconciled_total = claim_payments + plb_total

    return {
        "batch_total": payment.total_amount,
        "claim_payments_total": claim_payments,
        "plb_total": plb_total,
        "reconciled_total": reconciled_total,
        "is_balanced": reconciled_total == payment.total_amount,
    }