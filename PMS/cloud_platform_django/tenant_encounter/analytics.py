"""
Billing / practice analytics aggregations for the PMS Analytics page.

Exposes one endpoint that returns headline metrics, time-series and
breakdowns computed live from encounters, service lines, claims and payments.
"""
from datetime import timedelta, date
from decimal import Decimal

from django.db.models import Sum, Count, F, DecimalField, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from django_tenants.utils import schema_context
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Encounter, EncounterServiceLine
from tenant_app.models import Appointment, Patient
from tenant_claim_submission.models import Claim

try:
    from payment_posting.models import Payment
except Exception:  # pragma: no cover - app should always be present
    Payment = None

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# how many days each range chip represents (for the headline metrics window)
RANGE_DAYS = {"1w": 7, "1m": 30, "6m": 182, "1y": 365, "MTD": None}

DEC = DecimalField(max_digits=16, decimal_places=2)


def _f(val):
    """Decimal/None -> float for JSON."""
    if val is None:
        return 0.0
    if isinstance(val, Decimal):
        return float(val)
    return float(val)


def _money(val):
    return f"${_f(val):,.0f}"


def _pct(curr, prev):
    curr, prev = _f(curr), _f(prev)
    if prev > 0:
        v = ((curr - prev) / prev) * 100
    else:
        v = 100.0 if curr > 0 else 0.0
    return {
        "percentage": round(abs(v), 1),
        "direction": "up" if v >= 0 else "down",
    }


def _metric(value, prev, formatter=_money):
    trend = _pct(value, prev)
    return {
        "value": _f(value),
        "display": formatter(value),
        "delta": trend["percentage"],
        "direction": trend["direction"],
    }


def _month_buckets(now, count):
    """Return [(year, month, 'Mon YY'), ...] for the trailing `count` months."""
    buckets = []
    y, m = now.year, now.month
    for _ in range(count):
        buckets.append((y, m, f"{MONTHS[m - 1]} {str(y)[2:]}"))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(buckets))


class BillingAnalyticsView(APIView):
    """GET /app/encounter/analytics/billing/?range=6m"""
    permission_classes = [IsAuthenticated]

    def dispatch(self, request, *args, **kwargs):
        tenant = getattr(request, "tenant", None)
        if tenant and tenant.schema_name:
            with schema_context(tenant.schema_name):
                return super().dispatch(request, *args, **kwargs)
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        rng = request.query_params.get("range", "6m")
        now = timezone.now()
        today = now.date()

        # ---- headline metric window (current vs previous equal period) ----
        if rng == "MTD":
            cur_start = today.replace(day=1)
            prev_end = cur_start - timedelta(days=1)
            prev_start = prev_end.replace(day=1)
        else:
            days = RANGE_DAYS.get(rng, 182)
            cur_start = today - timedelta(days=days)
            prev_start = cur_start - timedelta(days=days)
            prev_end = cur_start

        lines = EncounterServiceLine.objects.filter(is_voided=False)
        claims = Claim.objects.all()
        payments = Payment.objects.all() if Payment else None

        def charges_between(start, end):
            return lines.filter(date_from__gte=start, date_from__lt=end).aggregate(
                s=Coalesce(Sum("total_charge"), Value(0), output_field=DEC))["s"]

        def collections_between(start, end):
            if payments is not None:
                return payments.filter(
                    received_date__gte=start, received_date__lt=end
                ).aggregate(s=Coalesce(Sum("total_amount"), Value(0), output_field=DEC))["s"]
            return claims.filter(
                created_at__date__gte=start, created_at__date__lt=end
            ).aggregate(s=Coalesce(Sum("paid"), Value(0), output_field=DEC))["s"]

        def encounters_between(start, end):
            return Encounter.objects.filter(
                created_at__date__gte=start, created_at__date__lt=end).count()

        cur_charges = charges_between(cur_start, today + timedelta(days=1))
        prev_charges = charges_between(prev_start, prev_end)
        cur_coll = collections_between(cur_start, today + timedelta(days=1))
        prev_coll = collections_between(prev_start, prev_end)
        cur_enc = encounters_between(cur_start, today + timedelta(days=1))
        prev_enc = encounters_between(prev_start, prev_end)

        ar_balance = claims.aggregate(
            s=Coalesce(Sum("balance_due"), Value(0), output_field=DEC))["s"]
        # DRO = A/R balance / average daily collections over the window
        window_days = max((today - cur_start).days, 1)
        avg_daily_coll = _f(cur_coll) / window_days
        dro = round(_f(ar_balance) / avg_daily_coll, 1) if avg_daily_coll > 0 else 0.0

        top_metrics = {
            "gross_charges": _metric(cur_charges, prev_charges),
            "net_collections": _metric(cur_coll, prev_coll),
            "ar_balance": _metric(ar_balance, ar_balance),
            "total_encounters": _metric(cur_enc, prev_enc, formatter=lambda v: f"{int(_f(v))}"),
        }

        # ---- trailing 12-month time series ----
        series_charges = []          # [{date, charges, collections}]
        avg_per_encounter = []       # [{month, value}]
        for (y, m, label) in _month_buckets(now, 12):
            mc = lines.filter(date_from__year=y, date_from__month=m).aggregate(
                s=Coalesce(Sum("total_charge"), Value(0), output_field=DEC))["s"]
            if payments is not None:
                mcol = payments.filter(received_date__year=y, received_date__month=m).aggregate(
                    s=Coalesce(Sum("total_amount"), Value(0), output_field=DEC))["s"]
            else:
                mcol = claims.filter(created_at__year=y, created_at__month=m).aggregate(
                    s=Coalesce(Sum("paid"), Value(0), output_field=DEC))["s"]
            menc = Encounter.objects.filter(created_at__year=y, created_at__month=m).count()
            series_charges.append({
                "date": label, "charges": _f(mc), "collections": _f(mcol),
            })
            avg_per_encounter.append({
                "month": label,
                "value": round(_f(mc) / menc, 2) if menc else 0.0,
            })

        # ---- top procedures (by charge) ----
        top_procedures = [
            {
                "code": r["procedure_code"] or "—",
                "description": (r["description"] or "").strip() or "Procedure",
                "amount": _money(r["amt"]),
                "value": _f(r["amt"]),
            }
            for r in lines.values("procedure_code", "description")
            .annotate(amt=Coalesce(Sum("total_charge"), Value(0), output_field=DEC))
            .order_by("-amt")[:6]
        ]

        # ---- top payers (by collected amount) ----
        if payments is not None:
            payer_rows = (payments.values("payer_name")
                          .annotate(amt=Coalesce(Sum("total_amount"), Value(0), output_field=DEC))
                          .order_by("-amt")[:6])
            top_payers = [
                {"name": r["payer_name"] or "Unknown", "amount": _money(r["amt"]), "value": _f(r["amt"])}
                for r in payer_rows
            ]
        else:
            top_payers = []

        # ---- breakdowns ----
        claims_by_status = [
            {"status": r["status"] or "unknown", "count": r["c"]}
            for r in claims.values("status").annotate(c=Count("id")).order_by("-c")
        ]
        appts_by_status = [
            {"status": r["confirmationstatus"] or "unknown", "count": r["c"]}
            for r in Appointment.objects.values("confirmationstatus")
            .annotate(c=Count("id")).order_by("-c")
        ]

        # ---- summary counts ----
        summary = {
            "total_patients": Patient.objects.count(),
            "new_patients_month": Patient.objects.filter(
                created_at__year=now.year, created_at__month=now.month).count(),
            "total_appointments": Appointment.objects.count(),
            "total_encounters": Encounter.objects.count(),
            "total_claims": claims.count(),
            "open_ar": _money(ar_balance),
            "days_revenue_outstanding": dro,
        }

        return Response({
            "range": rng,
            "top_metrics": top_metrics,
            "charges_vs_collections": series_charges,
            "avg_gross_charges_per_encounter": avg_per_encounter,
            "top_procedures": top_procedures,
            "top_payers": top_payers,
            "claims_by_status": claims_by_status,
            "appointments_by_status": appts_by_status,
            "summary": summary,
        })
