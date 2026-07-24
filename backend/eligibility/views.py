"""
Eligibility Verification API.

  GET  /api/eligibility/service-types/       -> EDI service-type options
  GET  /api/eligibility/payers/?q=           -> payer directory search
  GET  /api/eligibility/checks/              -> list past checks
  POST /api/eligibility/checks/              -> run a coverage check (sim + AI VOB)
  GET  /api/eligibility/checks/<id>/         -> full detail
  POST /api/eligibility/checks/<id>/reparse/ -> regenerate the AI VOB from stored data
"""
import json
import urllib.parse
import urllib.request

from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role

from . import ai, sim
from .models import EligibilityCheck
from .serializers import EligibilityCheckListSerializer, EligibilityCheckSerializer


def _tscope(user):
    qs = EligibilityCheck.objects.all()
    return qs if user.role == Role.SUPER_ADMIN else qs.filter(tenant=user.tenant)


class ServiceTypesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(sim.SERVICE_TYPES)


class PayerSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(sim.search_payers(request.query_params.get("q", "")))


class ChecksView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tscope(self.request.user)

    def get_serializer_class(self):
        return EligibilityCheckSerializer if self.request.method == "POST" else EligibilityCheckListSerializer

    def perform_create(self, serializer):
        user = self.request.user
        if user.tenant is None:
            raise ValidationError("Sign in as a tenant user to run eligibility checks.")
        # 1) simulate the 270/271 coverage lookup
        result = sim.run_check(serializer.validated_data)
        # 2) AI Verification of Benefits
        summary, items, model = ai.generate_vob(result)
        serializer.save(
            tenant=user.tenant, created_by=user, status="completed",
            vob_summary=summary, action_items=items, ai_model=model, **result,
        )


class CheckDetailView(generics.RetrieveAPIView):
    serializer_class = EligibilityCheckSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _tscope(self.request.user)


class ReparseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        check = _tscope(request.user).filter(pk=pk).first()
        if not check:
            raise ValidationError("Check not found.")
        result = {
            "coverage_status": check.coverage_status, "plan_type": check.plan_type,
            "plan_name": check.plan_name, "group_number": check.group_number,
            "subscriber": check.subscriber, "effective_date": check.effective_date,
            "termination_date": check.termination_date, "benefits": check.benefits,
            "normalized": check.normalized,
        }
        summary, items, model = ai.generate_vob(result)
        check.vob_summary, check.action_items, check.ai_model = summary, items, model
        check.save(update_fields=["vob_summary", "action_items", "ai_model"])
        return Response(EligibilityCheckSerializer(check).data)


class NpiLookupView(APIView):
    """Proxy the public NPPES NPI registry so the embedded VOB portal's NPI
    lookup works without its own backend. Returns the registry JSON verbatim
    ({result_count, results:[...]}). Public data — no auth required."""
    permission_classes = [AllowAny]

    def get(self, request, npi):
        if not (npi.isdigit() and len(npi) == 10):
            return Response({"result_count": 0, "results": []})
        url = "https://npiregistry.cms.hhs.gov/api/?" + urllib.parse.urlencode(
            {"number": npi, "version": "2.1"}
        )
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "MedXFlow/1.0"})
            with urllib.request.urlopen(req, timeout=8) as r:
                return Response(json.load(r))
        except Exception:
            return Response({"result_count": 0, "results": [], "error": "registry_unreachable"})
