from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from .models import *
from tenant_app.models import Patient,Appointment
from django.shortcuts import get_object_or_404
from decimal import Decimal
from .serializers import PaymentDataSerializer
from payment_posting.models import PaymentLedger
from rest_framework.pagination import PageNumberPagination

# Create your views here.


class Payment_PostingAPIView(APIView):
    def post(self, request):
        data = request.data 

        payment_type = data.get("payment_type")
        patient_id = data.get("patient_id")
        appointment_id = data.get("appointment_id")
        payment_amount = data.get("payment_amount")
        check_number = data.get("check_number")


        if not all([payment_type, patient_id, appointment_id, payment_amount]):
            return Response(
                {"error": "payment_type, patient_id, appointment_id, payment_amount are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if payment_type == "Check" and not check_number:
            return Response(
                {"Error": "check_number is required for Check payments"},
                status=status.HTTP_400_BAD_REQUEST
            )

        patient = get_object_or_404(Patient, id=patient_id)
        appointment = get_object_or_404(Appointment, id=appointment_id)

        payment = PaymentData.objects.create(
            patient_id=patient,
            appointment_id=appointment,
            payment_type=payment_type,
            payment_amount=Decimal(payment_amount),
            check_number=check_number
        )

        payment_ledger = PaymentLedger.objects.create(
            patient = patient,
            entry_type = "PAYMENT", # need to change dynamically 
            amount = Decimal(payment_amount),
            responsibility_type = 'PATIENT',  # need to change dynamically 
            posting_date = timezone.now()
        )

        return Response(
            {
                "status": "success",
                "payment_id": payment.payment_id,
                "payment_type": payment.payment_type,
                "payment_amount": str(payment.payment_amount),
                "payment_date": payment.payment_date
            },
            status=status.HTTP_201_CREATED
        )

    def get(self, request):
        patient_id = request.query_params.get("patient_id")
        # page_size = request.query_params.get("page_size")

        if not patient_id:
            return Response({"error":"No Patient ID Found"},status=status.HTTP_400_BAD_REQUEST)
        
        payments = PaymentData.objects.filter(patient_id__id = patient_id).order_by("payment_date")

        if not payments.exists():
            return Response({"Error":"No Payments Found for this Patient"},status = status.HTTP_404_NOT_FOUND)
        
        serializer = PaymentDataSerializer(payments, many=True)
        
        return Response(
            {
                "status": "success",
                "count": payments.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
        
        # paginator = PageNumberPagination()
        # paginator.page_size = int(page_size) if page_size else 10

        # page = paginator.paginate_queryset(payments, request, view=self)

        # serializer = PaymentDataSerializer(
        #     page,
        #     many=True,
        #     context={"request": request}
        # )

        # return paginator.get_paginated_response(serializer.data)
