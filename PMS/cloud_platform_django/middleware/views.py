from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import csv
from django.http import HttpResponse
from rest_framework.response import Response
from django.db import models
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Count
from accounts.models import Client  # adjust import
from .helper import StediClient
from .models import ClientApiUsage,ClientAIUsage
from .serializers import ClientApiUsageSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework.decorators import api_view
from .gemini_service import gemini_response, gemini_vision_response
from rest_framework.permissions import IsAuthenticated
from django.db.models.functions import TruncMonth, TruncDate
from rest_framework import status
from datetime import datetime
from PIL import Image
import tempfile
import urllib.parse

stedi = StediClient()


def validate_payload(types, payload):
    """Basic payload validation based on types"""
    errors = []

    if types == "insurance_eligibility":
        required_fields = ["encounter", "externalPatientId", "provider", "subscriber", "tradingPartnerServiceId"]
        for field in required_fields:
            if field not in payload:
                errors.append(f"Missing required field: {field}")
        # Nested checks
        if "encounter" in payload and "serviceTypeCodes" not in payload["encounter"]:
            errors.append("Missing encounter.serviceTypeCodes")
        if "provider" in payload:
            if "npi" not in payload["provider"]:
                errors.append("Missing provider.npi")
            if "organizationName" not in payload["provider"]:
                errors.append("Missing provider.organizationName")
        if "subscriber" in payload:
            for sub_field in ["dateOfBirth", "firstName", "lastName", "memberId"]:
                if sub_field not in payload["subscriber"]:
                    errors.append(f"Missing subscriber.{sub_field}")

    # Add other types validations if needed
    # elif types == "insurance_discovery":
    #     ...
    elif types == "insurance_discovery":
        required_fields = ["encounter", "provider", "subscriber"]
        for field in required_fields:
            if field not in payload:
                errors.append(f"Missing required field: {field}")

        # Nested: encounter
        if "encounter" in payload:
            for sub_field in ["beginningDateOfService", "endDateOfService"]:
                if sub_field not in payload["encounter"]:
                    errors.append(f"Missing encounter.{sub_field}")

        # Nested: provider
        if "provider" in payload and "npi" not in payload["provider"]:
            errors.append("Missing provider.npi")

        # Nested: subscriber
        if "subscriber" in payload:
            subscriber_required = ["dateOfBirth", "firstName", "lastName", "gender"]
            for sub_field in subscriber_required:
                if sub_field not in payload["subscriber"]:
                    errors.append(f"Missing subscriber.{sub_field}")

            # subscriber.address required fields
            if "address" in payload["subscriber"]:
                address_required = ["address1", "city", "postalCode", "state"]
                for sub_field in address_required:
                    if sub_field not in payload["subscriber"]["address"]:
                        errors.append(f"Missing subscriber.address.{sub_field}")
            else:
                errors.append("Missing subscriber.address")
        elif types == "coordination_of_benefits":
            required_fields = ["dependent", "encounter", "provider", "subscriber", "tradingPartnerServiceId"]
            for field in required_fields:
                if field not in payload:
                    errors.append(f"Missing required field: {field}")

            # dependent
            if "dependent" in payload:
                for sub_field in ["dateOfBirth", "firstName", "lastName"]:
                    if sub_field not in payload["dependent"]:
                        errors.append(f"Missing dependent.{sub_field}")

            # encounter
            if "encounter" in payload:
                for sub_field in ["dateOfService", "serviceTypeCode"]:
                    if sub_field not in payload["encounter"]:
                        errors.append(f"Missing encounter.{sub_field}")

            # provider
            if "provider" in payload:
                for sub_field in ["npi", "organizationName"]:
                    if sub_field not in payload["provider"]:
                        errors.append(f"Missing provider.{sub_field}")

            # subscriber
            if "subscriber" in payload:
                for sub_field in ["dateOfBirth", "firstName", "lastName", "memberId"]:
                    if sub_field not in payload["subscriber"]:
                        errors.append(f"Missing subscriber.{sub_field}")
    
    elif types == "professional_claims_837":
        required_top = ["billing", "claimInformation", "receiver", "submitter", "subscriber",
                        "tradingPartnerName", "tradingPartnerServiceId", "usageIndicator"]
        for field in required_top:
            if field not in payload:
                errors.append(f"Missing required field: {field}")

        # billing
        if "billing" in payload:
            addr = payload["billing"].get("address", {})
            for sub in ["address1", "city", "postalCode", "state"]:
                if sub not in addr:
                    errors.append(f"Missing billing.address.{sub}")

            ci = payload["billing"].get("contactInformation", {})
            for sub in ["name", "phoneNumber"]:
                if sub not in ci:
                    errors.append(f"Missing billing.contactInformation.{sub}")

            for sub in ["employerId", "npi", "organizationName", "providerType", "taxonomyCode"]:
                if sub not in payload["billing"]:
                    errors.append(f"Missing billing.{sub}")

        # claimInformation
        if "claimInformation" in payload:
            ci = payload["claimInformation"]
            ci_required = [
                "benefitsAssignmentCertificationIndicator", "claimChargeAmount",
                "claimFilingCode", "claimFrequencyCode", "patientControlNumber",
                "placeOfServiceCode", "planParticipationCode",
                "releaseInformationCode", "signatureIndicator"
            ]
            for sub in ci_required:
                if sub not in ci:
                    errors.append(f"Missing claimInformation.{sub}")

            # healthCareCodeInformation
            if "healthCareCodeInformation" in ci and isinstance(ci["healthCareCodeInformation"], list):
                hcc = ci["healthCareCodeInformation"][0]
                for sub in ["diagnosisCode", "diagnosisTypeCode"]:
                    if sub not in hcc:
                        errors.append(f"Missing claimInformation.healthCareCodeInformation.{sub}")
            else:
                errors.append("Missing claimInformation.healthCareCodeInformation")

            # serviceFacilityLocation
            sfl = ci.get("serviceFacilityLocation", {})
            addr = sfl.get("address", {})
            for sub in ["address1", "city", "postalCode", "state"]:
                if sub not in addr:
                    errors.append(f"Missing claimInformation.serviceFacilityLocation.address.{sub}")
            for sub in ["npi", "organizationName"]:
                if sub not in sfl:
                    errors.append(f"Missing claimInformation.serviceFacilityLocation.{sub}")

            # serviceLines
            if "serviceLines" in ci and isinstance(ci["serviceLines"], list):
                sl = ci["serviceLines"][0]
                ps = sl.get("professionalService", {})
                for sub in ["lineItemChargeAmount", "procedureCode", "procedureIdentifier", "serviceUnitCount"]:
                    if sub not in ps:
                        errors.append(f"Missing claimInformation.serviceLines.professionalService.{sub}")

                rp = sl.get("renderingProvider", {})
                for sub in ["firstName", "lastName", "npi", "providerType", "taxonomyCode"]:
                    if sub not in rp:
                        errors.append(f"Missing claimInformation.serviceLines.renderingProvider.{sub}")

                if "serviceDate" not in sl:
                    errors.append("Missing claimInformation.serviceLines.serviceDate")
            else:
                errors.append("Missing claimInformation.serviceLines")

        # receiver
        if "receiver" in payload and "organizationName" not in payload["receiver"]:
            errors.append("Missing receiver.organizationName")

        # submitter
        if "submitter" in payload:
            for sub in ["organizationName", "submitterIdentification"]:
                if sub not in payload["submitter"]:
                    errors.append(f"Missing submitter.{sub}")

            ci = payload["submitter"].get("contactInformation", {})
            for sub in ["name", "phoneNumber"]:
                if sub not in ci:
                    errors.append(f"Missing submitter.contactInformation.{sub}")

        # subscriber
        if "subscriber" in payload:
            addr = payload["subscriber"].get("address", {})
            for sub in ["address1", "city", "postalCode", "state"]:
                if sub not in addr:
                    errors.append(f"Missing subscriber.address.{sub}")

            for sub in ["dateOfBirth", "firstName", "lastName", "gender",
                        "memberId", "groupNumber", "paymentResponsibilityLevelCode", "subscriberGroupName"]:
                if sub not in payload["subscriber"]:
                    errors.append(f"Missing subscriber.{sub}")

    elif types == "dental_claims":
        required_top = [
            "billing", "claimInformation", "payerAddress", "receiver",
            "rendering", "submitter", "subscriber",
            "tradingPartnerName", "tradingPartnerServiceId", "usageIndicator"
        ]
        for field in required_top:
            if field not in payload:
                errors.append(f"Missing required field: {field}")

        # billing
        if "billing" in payload:
            addr = payload["billing"].get("address", {})
            for sub in ["address1", "city", "postalCode", "state"]:
                if sub not in addr:
                    errors.append(f"Missing billing.address.{sub}")
            ci = payload["billing"].get("contactInformation", {})
            for sub in ["name", "phoneNumber"]:
                if sub not in ci:
                    errors.append(f"Missing billing.contactInformation.{sub}")
            for sub in ["employerId", "npi", "organizationName", "providerType", "taxonomyCode"]:
                if sub not in payload["billing"]:
                    errors.append(f"Missing billing.{sub}")

        # claimInformation
        if "claimInformation" in payload:
            ci = payload["claimInformation"]
            ci_required = [
                "benefitsAssignmentCertificationIndicator", "claimChargeAmount",
                "claimFilingCode", "claimFrequencyCode", "patientControlNumber",
                "placeOfServiceCode", "planParticipationCode",
                "releaseInformationCode", "signatureIndicator"
            ]
            for sub in ci_required:
                if sub not in ci:
                    errors.append(f"Missing claimInformation.{sub}")

            # supplemental
            if "claimSupplementalInformation" not in ci or \
               "priorAuthorizationNumber" not in ci["claimSupplementalInformation"]:
                errors.append("Missing claimInformation.claimSupplementalInformation.priorAuthorizationNumber")

            # healthCareCodeInformation
            if "healthCareCodeInformation" in ci and isinstance(ci["healthCareCodeInformation"], list):
                hcc = ci["healthCareCodeInformation"][0]
                for sub in ["diagnosisCode", "diagnosisTypeCode"]:
                    if sub not in hcc:
                        errors.append(f"Missing claimInformation.healthCareCodeInformation.{sub}")
            else:
                errors.append("Missing claimInformation.healthCareCodeInformation")

            # serviceFacilityLocation
            sfl = ci.get("serviceFacilityLocation", {})
            addr = sfl.get("address", {})
            for sub in ["address1", "city", "postalCode", "state"]:
                if sub not in addr:
                    errors.append(f"Missing claimInformation.serviceFacilityLocation.address.{sub}")
            for sub in ["npi", "organizationName", "phoneNumber"]:
                if sub not in sfl:
                    errors.append(f"Missing claimInformation.serviceFacilityLocation.{sub}")

            # serviceLines
            if "serviceLines" in ci and isinstance(ci["serviceLines"], list):
                sl = ci["serviceLines"][0]
                ds = sl.get("dentalService", {})
                for sub in ["lineItemChargeAmount", "procedureCode", "procedureCount",
                            "placeOfServiceCode", "oralCavityDesignation", "prosthesisCrownOrInlayCode"]:
                    if sub not in ds:
                        errors.append(f"Missing claimInformation.serviceLines.dentalService.{sub}")

                rp = sl.get("renderingProvider", {})
                for sub in ["firstName", "lastName", "npi", "taxonomyCode"]:
                    if sub not in rp:
                        errors.append(f"Missing claimInformation.serviceLines.renderingProvider.{sub}")

                if "serviceDate" not in sl:
                    errors.append("Missing claimInformation.serviceLines.serviceDate")

                if "teethInformation" in sl and isinstance(sl["teethInformation"], list):
                    ti = sl["teethInformation"][0]
                    for sub in ["toothCode", "toothSurfaceCodes"]:
                        if sub not in ti:
                            errors.append(f"Missing claimInformation.serviceLines.teethInformation.{sub}")
                else:
                    errors.append("Missing claimInformation.serviceLines.teethInformation")
            else:
                errors.append("Missing claimInformation.serviceLines")

            # toothStatus
            if "toothStatus" in ci and isinstance(ci["toothStatus"], list):
                ts = ci["toothStatus"][0]
                for sub in ["toothNumber", "toothStatusCode"]:
                    if sub not in ts:
                        errors.append(f"Missing claimInformation.toothStatus.{sub}")
            else:
                errors.append("Missing claimInformation.toothStatus")

        # payerAddress
        if "payerAddress" in payload:
            addr = payload["payerAddress"]
            for sub in ["address1", "city", "postalCode", "state"]:
                if sub not in addr:
                    errors.append(f"Missing payerAddress.{sub}")

        # receiver
        if "receiver" in payload and "organizationName" not in payload["receiver"]:
            errors.append("Missing receiver.organizationName")

        # rendering
        if "rendering" in payload:
            for sub in ["firstName", "lastName", "npi", "providerType", "taxonomyCode"]:
                if sub not in payload["rendering"]:
                    errors.append(f"Missing rendering.{sub}")

        # submitter
        if "submitter" in payload:
            for sub in ["organizationName", "submitterIdentification"]:
                if sub not in payload["submitter"]:
                    errors.append(f"Missing submitter.{sub}")
            ci = payload["submitter"].get("contactInformation", {})
            for sub in ["name", "phoneNumber"]:
                if sub not in ci:
                    errors.append(f"Missing submitter.contactInformation.{sub}")

        # subscriber
        if "subscriber" in payload:
            addr = payload["subscriber"].get("address", {})
            for sub in ["address1", "city", "postalCode", "state"]:
                if sub not in addr:
                    errors.append(f"Missing subscriber.address.{sub}")
            for sub in ["dateOfBirth", "firstName", "lastName", "gender",
                        "memberId", "groupNumber", "paymentResponsibilityLevelCode"]:
                if sub not in payload["subscriber"]:
                    errors.append(f"Missing subscriber.{sub}")

    elif types == "institutional_claims":
        required_top = [
            "claimInformation", "providers", "receiver",
            "submitter", "subscriber",
            "tradingPartnerName", "tradingPartnerServiceId", "usageIndicator"
        ]
        for field in required_top:
            if field not in payload:
                errors.append(f"Missing required field: {field}")

        # claimInformation
        if "claimInformation" in payload:
            ci = payload["claimInformation"]
            ci_required = [
                "benefitsAssignmentCertificationIndicator", "claimChargeAmount",
                "claimFilingCode", "claimFrequencyCode", "patientControlNumber",
                "placeOfServiceCode", "planParticipationCode", "releaseInformationCode"
            ]
            for sub in ci_required:
                if sub not in ci:
                    errors.append(f"Missing claimInformation.{sub}")

            # claimCodeInformation
            cci = ci.get("claimCodeInformation", {})
            for sub in ["admissionSourceCode", "admissionTypeCode", "patientStatusCode"]:
                if sub not in cci:
                    errors.append(f"Missing claimInformation.claimCodeInformation.{sub}")

            # claimDateInformation
            cdi = ci.get("claimDateInformation", {})
            for sub in ["admissionDateAndHour", "statementBeginDate", "statementEndDate"]:
                if sub not in cdi:
                    errors.append(f"Missing claimInformation.claimDateInformation.{sub}")

            # principalDiagnosis
            pd = ci.get("principalDiagnosis", {})
            for sub in ["principalDiagnosisCode", "qualifierCode"]:
                if sub not in pd:
                    errors.append(f"Missing claimInformation.principalDiagnosis.{sub}")

            # serviceLines
            if "serviceLines" in ci and isinstance(ci["serviceLines"], list):
                sl = ci["serviceLines"][0]
                if "assignedNumber" not in sl:
                    errors.append("Missing claimInformation.serviceLines.assignedNumber")
                inst = sl.get("institutionalService", {})
                for sub in ["lineItemChargeAmount", "measurementUnit", "procedureCode",
                            "procedureIdentifier", "serviceLineRevenueCode", "serviceUnitCount"]:
                    if sub not in inst:
                        errors.append(f"Missing claimInformation.serviceLines.institutionalService.{sub}")
                for sub in ["lineItemControlNumber", "serviceDate", "serviceDateEnd"]:
                    if sub not in sl:
                        errors.append(f"Missing claimInformation.serviceLines.{sub}")
            else:
                errors.append("Missing claimInformation.serviceLines")

        # providers
        if "providers" in payload and isinstance(payload["providers"], list):
            billing = next((p for p in payload["providers"] if p.get("providerType") == "BillingProvider"), None)
            attending = next((p for p in payload["providers"] if p.get("providerType") == "AttendingProvider"), None)

            if not billing:
                errors.append("Missing BillingProvider in providers")
            else:
                addr = billing.get("address", {})
                for sub in ["address1", "city", "postalCode", "state"]:
                    if sub not in addr:
                        errors.append(f"Missing providers.BillingProvider.address.{sub}")
                ci = billing.get("contactInformation", {})
                for sub in ["name", "phoneNumber"]:
                    if sub not in ci:
                        errors.append(f"Missing providers.BillingProvider.contactInformation.{sub}")
                for sub in ["employerId", "npi", "organizationName", "providerType"]:
                    if sub not in billing:
                        errors.append(f"Missing providers.BillingProvider.{sub}")

            if not attending:
                errors.append("Missing AttendingProvider in providers")
            else:
                for sub in ["firstName", "lastName", "npi", "providerType"]:
                    if sub not in attending:
                        errors.append(f"Missing providers.AttendingProvider.{sub}")
        else:
            errors.append("Missing providers")

        # receiver
        if "receiver" in payload and "organizationName" not in payload["receiver"]:
            errors.append("Missing receiver.organizationName")

        # submitter
        if "submitter" in payload:
            for sub in ["organizationName", "taxId"]:
                if sub not in payload["submitter"]:
                    errors.append(f"Missing submitter.{sub}")
            ci = payload["submitter"].get("contactInformation", {})
            for sub in ["name", "phoneNumber"]:
                if sub not in ci:
                    errors.append(f"Missing submitter.contactInformation.{sub}")

        # subscriber
        if "subscriber" in payload:
            for sub in ["firstName", "lastName", "memberId", "groupNumber", "paymentResponsibilityLevelCode"]:
                if sub not in payload["subscriber"]:
                    errors.append(f"Missing subscriber.{sub}")

    elif types == "claims_acknowledgement":
        if not isinstance(payload, dict):
            errors.append("Payload must be a JSON object")
        else:
            if "data" not in payload:
                errors.append("Missing required field: data (transactionId)")
            elif not isinstance(payload["data"], str) or not payload["data"].strip():
                errors.append("Field 'data' (transactionId) must be a non-empty string")

    elif types == "real_time_claim_status":
        if not isinstance(payload, dict):
            errors.append("Payload must be a JSON object")
        else:
            encounter = payload.get("encounter")
            if not isinstance(encounter, dict):
                errors.append("Missing or invalid 'encounter'")
            else:
                if not encounter.get("beginningDateOfService"):
                    errors.append("Missing 'encounter.beginningDateOfService'")
                if not encounter.get("endDateOfService"):
                    errors.append("Missing 'encounter.endDateOfService'")

            providers = payload.get("providers")
            if not isinstance(providers, list) or not providers:
                errors.append("Missing or invalid 'providers'")
            else:
                for idx, p in enumerate(providers):
                    if not isinstance(p, dict):
                        errors.append(f"Provider {idx} must be an object")
                    else:
                        for f in ["npi", "organizationName", "providerType"]:
                            if not p.get(f):
                                errors.append(f"Provider {idx} missing '{f}'")

            subscriber = payload.get("subscriber")
            if not isinstance(subscriber, dict):
                errors.append("Missing or invalid 'subscriber'")
            else:
                for f in ["dateOfBirth", "firstName", "lastName", "memberId"]:
                    if not subscriber.get(f):
                        errors.append(f"subscriber missing '{f}'")

            if not payload.get("tradingPartnerServiceId"):
                errors.append("Missing 'tradingPartnerServiceId'")

    elif types == "payer_search":
        if "query" not in payload:
            errors.append("Missing required field: query")

    return errors


@method_decorator(csrf_exempt, name="dispatch")
class StediProxyView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        types = request.data.get("types")
        payload = request.data.get("payload", {})

        if not types:
            return Response({"error": "Pls choose the dropdown"}, status=400)

        # Validate payload
        validation_errors = validate_payload(types, payload)
        if validation_errors:
            return Response({"error": "Invalid payload", "details": validation_errors}, status=400)

        # Determine the full URL
        if types == "insurance_eligibility":
            full_url = "https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/eligibility/v3"
        elif types == "insurance_discovery":
            full_url = "https://healthcare.us.stedi.com/2024-04-01/insurance-discovery/check/v1"
        elif types == "coordination_of_benefits":
            full_url = "https://healthcare.us.stedi.com/2024-04-01/coordination-of-benefits"
        elif types == "professional_claims_837":
            full_url = "https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/professionalclaims/v3/submission"
        elif types == "dental_claims":
            full_url = "https://healthcare.us.stedi.com/2024-04-01/dental-claims/submission"
        elif types == "institutional_claims":
            full_url = "https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/institutionalclaims/v1/submission"
        elif types == "claims_acknowledgement":
            full_url = f"https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/reports/v2/{payload['data']}/277"
        elif types == "claim_attachments":
            full_url = ""
        elif types == "real_time_claim_status":
            full_url = "https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/claimstatus/v2"
        elif types == "payer_search":
            query = payload.get("query", "")
            encoded_query = urllib.parse.quote(query)
            full_url = f"https://healthcare.us.stedi.com/2024-04-01/payers/search?query={encoded_query}"
        else:
            return Response({"error": "Pls choose a valid payer type"}, status=400)

        method = "GET" if types in ["claims_acknowledgement", "payer_search"] else "POST"

        api_key = request.headers.get("X-API-Key")
        if not full_url:
            return Response({"error": "Missing 'url'"}, status=400)

        response = stedi.request(full_url, method, payload, api_key)
        if isinstance(response, dict) and response.get("Status") == "Please Use Beta":
            return Response(response, status=400)  # Or appropriate status
            
        try:
            data = response.json()
        except Exception:
            data = {"raw": response.text}

        return Response(data, status=response.status_code)

class ClientApiUsageList(generics.ListAPIView):
    """List API usage logs"""

    serializer_class = ClientApiUsageSerializer
    queryset = ClientApiUsage.objects.select_related("apikey").all()

    def get_queryset(self):
        qs = super().get_queryset()
        api_key = self.request.query_params.get("api_key")
        if api_key:
            qs = qs.filter(apikey__api_key=api_key)
        return qs


class ClientApiUsageSummary(APIView):
    """Aggregated summary of API usage per client and date"""

    def get(self, request):
        api_key = request.query_params.get("api_key")
        export_csv = request.query_params.get("export", "").lower() == "csv"

        qs = ClientApiUsage.objects.all()
        if api_key:
            qs = qs.filter(apikey__api_key=api_key)

        summary = (
            qs.values("apikey__user__client__id", "apikey__user__client__client_name", "date")
            .annotate(total_calls=Sum("count"))
            .order_by("apikey__user__client__id", "date")
        )

        if export_csv:
            # --- CSV Export ---
            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = 'attachment; filename="api_usage_summary.csv"'

            writer = csv.writer(response)
            writer.writerow(["Client ID", "Client Name", "Date", "Total Calls"])  # header

            for row in summary:
                writer.writerow([
                    row["apikey__user__client__id"],
                    row["apikey__user__client__client_name"],
                    row["date"],
                    row["total_calls"]
                ])

            return response

        # --- Default JSON Response ---
        results = [
            {
                "client_id": row["apikey__user__client__id"],
                "client_name": row["apikey__user__client__client_name"],
                "date": row["date"],
                "total_calls": row["total_calls"],
            }
            for row in summary
        ]

        return Response(results)

@api_view(["GET"])
def client_api_usage_summary(request):
    """
    Returns Client API usage counts
    Supports:
      - from_date (YYYY-MM-DD)
      - to_date (YYYY-MM-DD)
      - user_id
    """

    qs = ClientApiUsage.objects.all()

    # ✅ Date filter
    from_date = request.query_params.get("from_date")
    to_date = request.query_params.get("to_date")

    if from_date:
        qs = qs.filter(date__gte=parse_date(from_date))
    if to_date:
        qs = qs.filter(date__lte=parse_date(to_date))

    # ✅ User filter (via related Agent_API_SecretKeyss → User)
    user_id = request.query_params.get("user_id")
    if user_id:
        qs = qs.filter(apikey__user_id=user_id)

    # ✅ Aggregate total count
    total_count = qs.aggregate(total=Sum("count"))["total"] or 0

    # ✅ Detailed per-day/per-apikey usage
    details = qs.values("apikey__api_key", "date").annotate(total=Sum("count")).order_by("date")

    return Response({
        "total_usage": total_count,
        "records": list(details)
    })


@api_view(["GET"])
def client_api_usage_clientwise(request):
    """
    Returns Client API usage counts grouped by client name
    """
    qs = ClientApiUsage.objects.select_related(
        'apikey__user__client'
    )
 
    # Date filters
    from_date = request.query_params.get("from_date")
    to_date = request.query_params.get("to_date")
    month_param = request.query_params.get("month")

    if month_param == 'true':
        today = timezone.now().date()
        from_date_obj = today.replace(day=1)
        # To get the end of the month, we go to the first of next month and subtract one day
        if today.month == 12:
            to_date_obj = today.replace(year=today.year + 1, month=1, day=1) - timezone.timedelta(days=1)
        else:
            to_date_obj = today.replace(month=today.month + 1, day=1) - timezone.timedelta(days=1)
        
        qs = qs.filter(date__gte=from_date_obj, date__lte=to_date_obj)
    else:
        if from_date:
            qs = qs.filter(date__gte=parse_date(from_date))
        if to_date:
            qs = qs.filter(date__lte=parse_date(to_date))
 
    # Filter by client directly
    client_id = request.query_params.get("client_id")
    if client_id:
        qs = qs.filter(apikey__user__client__client_id=client_id)
 
    # Group by client (including null clients for users without client assignment)
    results = qs.values(
        'apikey__user__client__client_id',
        'apikey__user__client__client_name'
    ).annotate(
        total_usage=Sum('count'),
        api_key_count=models.Count('apikey', distinct=True),
        user_count=models.Count('apikey__user', distinct=True)
    ).order_by('apikey__user__client__client_name')
 
    # Format the response
    formatted_results = []
    for item in results:
        formatted_results.append({
            'client_id': item['apikey__user__client__client_id'],
            'client_name': item['apikey__user__client__client_name'] or 'No Client Assigned',
            'total_usage': item['total_usage'] or 0,
            'api_keys_count': item['api_key_count'],
            'users_count': item['user_count']
        })
 
    # Calculate overall total
    total_count = sum(item['total_usage'] for item in formatted_results)

    if month_param == 'true':
        # Send email with the records in a table
        subject = f"Monthly Client API Usage Report - {timezone.now().strftime('%B %Y')}"
        
        table_html = """
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th>Client ID</th>
                    <th>Client Name</th>
                    <th>Total Usage</th>
                    <th>API Keys</th>
                    <th>Users</th>
                </tr>
            </thead>
            <tbody>
        """
        for item in formatted_results:
            table_html += f"""
                <tr>
                    <td>{item['client_id']}</td>
                    <td>{item['client_name']}</td>
                    <td>{item['total_usage']}</td>
                    <td>{item['api_keys_count']}</td>
                    <td>{item['users_count']}</td>
                </tr>
            """
        
        table_html += f"""
            </tbody>
            <tfoot>
                <tr style="font-weight: bold; background-color: #f2f2f2;">
                    <td colspan="2">Overall Total</td>
                    <td>{total_count}</td>
                    <td colspan="2"></td>
                </tr>
            </tfoot>
        </table>
        """
        
        html_content = f"""
        <html>
            <body>
                <h2>Monthly API Usage Report</h2>
                <p>Please find the API usage summary for the current month below:</p>
                {table_html}
                <p>Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </body>
        </html>
        """
        
        # You might want to specify the recipient email here or get it from settings/request
        recipient_email = "cloud@droidal.com" 
        send_graph_email(recipient_email, subject, html_content)
 
    return Response({
        "total_usage": total_count,
        "clients": formatted_results
    })

import requests
def send_graph_email(to_email, subject, html_content, attachment=None, name=None):
    def format_recipients(to_email):
        # If single email → convert to list
        if isinstance(to_email, str):
            to_email = [to_email]

        # Now to_email is always a list
        return [{"emailAddress": {"address": email}} for email in to_email]
    
    if name == None:
        name = "license.pdf"

    TENANT_ID = '35800adc-eb69-4c43-b94c-66398463ce04'
    CLIENT_ID = '5aa2a216-4c93-4f35-a308-07fb498a463d'
    import os
    CLIENT_SECRET = os.getenv('AZURE_CLIENT_SECRET', '')
    SCOPE = 'https://graph.microsoft.com/.default'

    SENDER_EMAIL = 'cloud@droidal.com'

    # Step 1: Get OAuth2 access token
    token_url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    token_data = {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': 'https://graph.microsoft.com/.default',
    }

    token_response = requests.post(token_url, data=token_data)
    token_json = token_response.json()

    if 'access_token' not in token_json:
        print("Failed to get token:", token_json)
        exit(1)

    access_token = token_json['access_token']

    # Step 2: Prepare email
    email_url = f"https://graph.microsoft.com/v1.0/users/{SENDER_EMAIL}/sendMail"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }

    email_data = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "html",
                "content": html_content
            },
            "toRecipients": format_recipients(to_email)
        },
        "saveToSentItems": "true"
    }

    if attachment:
        attachment_content = base64.b64encode(attachment.getvalue()).decode('utf-8')
        
        email_data["message"]["attachments"] = [
            {
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": name,
                "contentType": "application/pdf",
                "contentBytes": attachment_content
            }
        ]

    # Step 3: Send the email
    response = requests.post(email_url, headers=headers, json=email_data)
    print("Status code:", response.status_code)
    print("Response:", response.text)
    return response
 

class GeminiTextAPIView(APIView):
    permission_classes = [IsAuthenticated]  # requires JWT/session

    def post(self, request):
        input_text = request.data.get("input")
        response = gemini_response(request.user.client, input_text)
        return Response({"response": response})

class GeminiVisionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Synchronous view to handle multiple uploads and get full Gemini responses.
        Supports all file types (image, PDF, DOC/DOCX, text, etc.).
        """
        try:
            prompt_text = request.data.get("prompt", "").strip()
            uploaded_files = request.FILES.getlist("files")

            if not uploaded_files:
                return Response({"error": "No files uploaded"}, status=400)

            # --- Prepare image or binary objects ---
            processed_files = []
            for uploaded_file in uploaded_files:
                content_type = uploaded_file.content_type or ""
                filename = uploaded_file.name.lower()

                # If it's an image, open it directly
                if content_type.startswith("image/") or filename.endswith((".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".gif")):
                    try:
                        image = Image.open(uploaded_file)
                        processed_files.append(image)
                    except Exception as e:
                        return Response({"error": f"Invalid image {filename}: {e}"}, status=400)
                else:
                    # For non-images, keep Django UploadedFile as-is
                    processed_files.append(uploaded_file)

            # --- Call Gemini synchronous handler ---
            response_data = gemini_vision_response(
                client=request.user.client,
                prompt_text=prompt_text,
                uploaded_files=processed_files
            )

            return Response(response_data)

        except Exception as e:
            return Response({"error": f"Error processing request: {e}"}, status=500)
        

class CustomPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 200


class AIUsageSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination

    def get(self, request):
        user = request.user
        client = getattr(user, "client", None)
        user_role = getattr(user, "roles", "").lower()
        paginator = self.pagination_class()

        # --- Query params ---
        client_id = request.query_params.get("client_id")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        month = request.query_params.get("month")
        year = request.query_params.get("year")
        group_by = request.query_params.get("group_by", "date")

        # --- Determine queryset ---
        if user_role == "client":
            if not client:
                return Response({"error": "Authenticated user not linked to a client."}, status=403)
            usages = ClientAIUsage.objects.filter(client=client)
            client_name = client.client_name
        else:
            # Admin or staff
            if client_id:
                try:
                    selected_client = Client.objects.get(client_id=client_id)
                    usages = ClientAIUsage.objects.filter(client=selected_client)
                    client_name = selected_client.client_name
                except Client.DoesNotExist:
                    return Response({"error": f"Client with ID '{client_id}' not found."}, status=404)
            else:
                usages = ClientAIUsage.objects.all()
                client_name = "All Clients"

        # --- Date filters ---
        if start_date and end_date:
            start = parse_date(start_date)
            end = parse_date(end_date)
            if not (start and end):
                return Response({"error": "Invalid start_date or end_date format."}, status=400)
            usages = usages.filter(created_at__date__range=[start, end])
        elif month and year:
            try:
                usages = usages.filter(created_at__month=int(month), created_at__year=int(year))
            except ValueError:
                return Response({"error": "Invalid month/year values."}, status=400)
        elif year:
            usages = usages.filter(created_at__year=int(year))

        # --- Grouping ---
        usages_grouped = []

        if group_by == "month":
            usages_grouped = (
                usages.annotate(period=models.functions.TruncMonth("created_at"))
                .values("period")
                .annotate(total_tokens=Sum("tokens_used"), total_cost=Sum("cost"), total_requests=Count("id"))
                .order_by("period")
            )
            for u in usages_grouped:
                u["period"] = u["period"].strftime("%Y-%m")

        elif group_by == "year":
            usages_grouped = (
                usages.annotate(period=models.functions.TruncYear("created_at"))
                .values("period")
                .annotate(total_tokens=Sum("tokens_used"), total_cost=Sum("cost"), total_requests=Count("id"))
                .order_by("period")
            )
            for u in usages_grouped:
                u["period"] = u["period"].strftime("%Y")

        elif group_by == "request_type":
            usages_grouped = (
                usages.values("request_type")
                .annotate(total_tokens=Sum("tokens_used"), total_cost=Sum("cost"), total_requests=Count("id"))
                .order_by("request_type")
            )
            for u in usages_grouped:
                u["period"] = u.pop("request_type")

        elif group_by == "client" and user_role != "client":  # Only admins allowed
            usages_grouped = (
                usages.values("client__client_id", "client__client_name")
                .annotate(total_tokens=Sum("tokens_used"), total_cost=Sum("cost"), total_requests=Count("id"))
                .order_by("client__client_name")
            )
            for u in usages_grouped:
                u["period"] = u["client__client_name"]
                u["client_id"] = u.pop("client__client_id")
                u["client_name"] = u.pop("client__client_name")

        else:  # default group_by = date
            usages_grouped = (
                usages.annotate(period=models.functions.TruncDate("created_at"))
                .values("period")
                .annotate(total_tokens=Sum("tokens_used"), total_cost=Sum("cost"), total_requests=Count("id"))
                .order_by("period")
            )
            for u in usages_grouped:
                u["period"] = u["period"].strftime("%Y-%m-%d")

        usages_list = list(usages_grouped)

        # --- Totals ---
        total_tokens = sum(u["total_tokens"] for u in usages_list)
        total_cost = sum(float(u["total_cost"]) for u in usages_list)
        total_requests = sum(u["total_requests"] for u in usages_list)

        # --- Paginate breakdown ---
        paginated_data = paginator.paginate_queryset(usages_list, request)

        response_data = {
            "client": client_name,
            "filters": {
                "client_id": client_id,
                "start_date": start_date,
                "end_date": end_date,
                "month": month,
                "year": year,
                "group_by": group_by,
            },
            "summary": {
                "total_requests": total_requests,
                "total_tokens": total_tokens,
                "total_cost": round(total_cost, 4),
            },
            "breakdown": paginated_data,
        }

        return paginator.get_paginated_response(response_data)
