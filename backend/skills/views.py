"""
Skills API.

  GET  /api/skills/                 -> catalogue (metadata + input schema)
  GET  /api/skills/<slug>/          -> one skill's schema
  POST /api/skills/<slug>/run/      -> execute: validate input, run, log, return output
  GET  /api/skill-runs/             -> recent runs (tenant-scoped)
  GET  /api/decision-engine/        -> executive aggregates + recommendations
"""
from collections import Counter, defaultdict

from django.utils import timezone
from rest_framework import generics, status as http_status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role
from audit.models import record
from connectors.models import Connector

from .models import SkillRun
from .registry import REGISTRY
from .serializers import SkillRunSerializer


def _run_skill(skill, data, user, connector=None):
    """Execute a skill and persist a SkillRun. Shared by single + batch runs."""
    output = skill.run(data, {"user": user, "connector": connector})
    if connector:
        output.setdefault("meta", {})["via_connector"] = connector.name
    run = SkillRun.objects.create(
        tenant=user.tenant,
        skill_slug=skill.slug,
        skill_name=skill.name,
        input=data,
        output=output,
        status=output.get("status", "success"),
        connector=connector,
        created_by=user,
    )
    return run, output


def _runs_qs(user):
    qs = SkillRun.objects.select_related("tenant", "connector", "created_by")
    if user.role == Role.SUPER_ADMIN:
        return qs
    return qs.filter(tenant=user.tenant)


class SkillListView(APIView):
    """The skill catalogue — drives the menu and the runner pages."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response([s.as_dict() for s in REGISTRY.values()])


class SkillDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        skill = REGISTRY.get(slug)
        if not skill:
            return Response({"detail": "Unknown skill."}, status=404)
        return Response(skill.as_dict())


class SkillRunView(APIView):
    """Execute a skill: validate required inputs, run it, log the run, return output."""

    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        skill = REGISTRY.get(slug)
        if not skill:
            return Response({"detail": "Unknown skill."}, status=404)

        user = request.user
        if user.tenant is None:
            raise ValidationError("Sign in as a tenant user to run skills.")

        data = request.data or {}

        # Validate required inputs declared by the skill.
        missing = [
            f.label
            for f in skill.inputs
            if f.required and not str(data.get(f.name, "")).strip()
        ]
        if missing:
            raise ValidationError({"detail": f"Missing required fields: {', '.join(missing)}"})

        # Resolve an optional connector (must belong to the tenant).
        connector = None
        connector_id = data.get("connector")
        if connector_id:
            connector = Connector.objects.filter(
                pk=connector_id, tenant=user.tenant
            ).first()

        run, output = _run_skill(skill, data, user, connector)
        record(user, "RUN", f"Ran {skill.name}", f"Result: {output.get('status')}")
        return Response({"run_id": run.id, "output": output}, status=201)


class SkillBatchRunView(APIView):
    """
    Batch mode (feature #6): run a skill over many rows at once.
    POST /api/skills/<slug>/batch/  body: {"rows": [{...}, {...}]}
    Returns each row's result + an aggregate summary.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        skill = REGISTRY.get(slug)
        if not skill:
            return Response({"detail": "Unknown skill."}, status=404)
        user = request.user
        if user.tenant is None:
            raise ValidationError("Sign in as a tenant user to run skills.")

        rows = request.data.get("rows") or []
        if not isinstance(rows, list) or not rows:
            raise ValidationError({"detail": "Provide a non-empty 'rows' list."})
        rows = rows[:500]  # safety cap

        results, summary = [], Counter()
        for i, row in enumerate(rows):
            data = row if isinstance(row, dict) else {}
            missing = [
                f.label for f in skill.inputs
                if f.required and not str(data.get(f.name, "")).strip()
            ]
            if missing:
                summary["error"] += 1
                results.append({"row": i + 1, "status": "error",
                                "headline": f"Missing: {', '.join(missing)}", "input": data})
                continue
            _, output = _run_skill(skill, data, user)
            summary[output.get("status", "success")] += 1
            results.append({"row": i + 1, "status": output.get("status"),
                            "headline": output.get("headline"), "input": data})

        record(user, "RUN", f"Batch ran {skill.name}", f"{len(results)} rows")
        return Response({
            "count": len(results),
            "summary": dict(summary),
            "results": results,
        }, status=201)


class ReviewQueueView(generics.ListAPIView):
    """Feature #5: open (unresolved) runs with a warning/error status."""

    serializer_class = SkillRunSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _runs_qs(self.request.user).filter(
            status__in=["warning", "error"],
            resolution=SkillRun.Resolution.OPEN,
        )


class ResolveRunView(APIView):
    """Take an action on a queued run: approve / retry / escalate / resolve."""

    permission_classes = [IsAuthenticated]

    ACTIONS = {
        "approve": SkillRun.Resolution.APPROVED,
        "retry": SkillRun.Resolution.RETRIED,
        "escalate": SkillRun.Resolution.ESCALATED,
        "resolve": SkillRun.Resolution.RESOLVED,
    }

    def post(self, request, pk):
        run = _runs_qs(request.user).filter(pk=pk).first()
        if not run:
            return Response({"detail": "Not found."}, status=404)
        action = str(request.data.get("action", "")).lower()
        resolution = self.ACTIONS.get(action)
        if not resolution:
            raise ValidationError({"detail": "Unknown action."})
        run.resolution = resolution
        run.resolved_at = timezone.now()
        run.save(update_fields=["resolution", "resolved_at"])
        record(request.user, "RUN", f"{action.title()} run #{run.id}", run.skill_name)
        return Response(SkillRunSerializer(run).data)


class NotificationsView(APIView):
    """
    Feature #10: computed alerts for the top-bar bell. Derived from live state —
    the review queue, pended authorizations, and disconnected connectors.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        runs = _runs_qs(user)
        alerts = []

        queue = runs.filter(status__in=["warning", "error"],
                            resolution=SkillRun.Resolution.OPEN).count()
        if queue:
            alerts.append({
                "level": "warning",
                "title": f"{queue} item{'s' if queue != 1 else ''} in the review queue",
                "detail": "Runs with warnings or errors need attention.",
                "link": "/review-queue",
            })

        pended = runs.filter(skill_slug="prior-authorization", status="warning",
                             resolution=SkillRun.Resolution.OPEN).count()
        if pended:
            alerts.append({
                "level": "info",
                "title": f"{pended} prior auth{'s' if pended != 1 else ''} pending review",
                "detail": "Pended authorizations may need documentation.",
                "link": "/skills/prior-authorization",
            })

        down = Connector.objects.filter(status="ERROR")
        if user.role != Role.SUPER_ADMIN:
            down = down.filter(tenant=user.tenant)
        down_count = down.count()
        if down_count:
            alerts.append({
                "level": "critical",
                "title": f"{down_count} connector{'s' if down_count != 1 else ''} disconnected",
                "detail": "A connector failed its last health check.",
                "link": "/connectors",
            })

        return Response({"count": len(alerts), "alerts": alerts})


class SkillRunListView(generics.ListAPIView):
    """Recent skill runs, tenant-scoped. Optional ?skill=<slug> filter."""

    serializer_class = SkillRunSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = _runs_qs(self.request.user)
        slug = self.request.query_params.get("skill")
        if slug:
            qs = qs.filter(skill_slug=slug)
        return qs[:50]


class DecisionEngineView(APIView):
    """
    Executive rollup for leadership: volumes, success/approval rates and simple
    rule-based recommendations derived from recent skill runs.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        runs = list(_runs_qs(request.user)[:500])
        total = len(runs)
        by_status = Counter(r.status for r in runs)
        by_skill = defaultdict(lambda: Counter())
        for r in runs:
            by_skill[r.skill_name][r.status] += 1

        def rate(counter):
            n = sum(counter.values())
            return round(100 * counter.get("success", 0) / n) if n else 0

        skills_summary = [
            {
                "skill": name,
                "total": sum(counter.values()),
                "success": counter.get("success", 0),
                "warning": counter.get("warning", 0),
                "error": counter.get("error", 0),
                "success_rate": rate(counter),
            }
            for name, counter in sorted(by_skill.items())
        ]

        # Estimated revenue processed from claim submissions.
        revenue = 0.0
        for r in runs:
            if r.skill_slug == "claim-submission" and r.status == "success":
                try:
                    revenue += float(r.input.get("charge_amount", 0) or 0)
                except (TypeError, ValueError):
                    pass

        recommendations = self._recommend(skills_summary, by_status, total)

        return Response(
            {
                "totals": {
                    "runs": total,
                    "success": by_status.get("success", 0),
                    "warning": by_status.get("warning", 0),
                    "error": by_status.get("error", 0),
                    "overall_success_rate": rate(by_status),
                    "revenue_processed": round(revenue, 2),
                },
                "skills": skills_summary,
                "recommendations": recommendations,
            }
        )

    def _recommend(self, skills_summary, by_status, total):
        recs = []
        if total == 0:
            return [{
                "level": "info",
                "title": "No activity yet",
                "detail": "Run a workflow to start generating decision insights.",
            }]
        for s in skills_summary:
            if s["total"] >= 3 and s["success_rate"] < 60:
                recs.append({
                    "level": "warning",
                    "title": f"Low success rate in {s['skill']}",
                    "detail": f"Only {s['success_rate']}% succeeded across {s['total']} runs. Review inputs or the connector.",
                })
        if by_status.get("error", 0) > by_status.get("success", 0):
            recs.append({
                "level": "critical",
                "title": "Errors are outpacing successes",
                "detail": "More runs are failing than passing platform-wide. Investigate connectors and payer data.",
            })
        if not recs:
            recs.append({
                "level": "good",
                "title": "Operations are healthy",
                "detail": "Success rates are within target across all workflows.",
            })
        return recs
