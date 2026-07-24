"""
The catalogue of metrics a tenant can put on their dashboard, plus matching and
time-series resolvers used by stat tiles and chart tiles.

Each metric has: key, label, unit, color, keywords, and either
  * ``qs``      — fn(tenant) -> queryset with a ``created_at`` (count + daily series), or
  * ``resolve`` + ``series`` — for computed metrics (success rate, revenue).

``tenant`` may be None (platform super admin) — resolvers then count globally.
"""
from datetime import timedelta

from django.utils import timezone


def _q(model, tenant):
    qs = model.objects.all()
    return qs if tenant is None else qs.filter(tenant=tenant)


# -- querysets (count-based metrics) ---------------------------------------
def _qs_runs(t):
    from skills.models import SkillRun
    return _q(SkillRun, t)


def _qs_completed(t):
    return _qs_runs(t).filter(status="success")


def _qs_review(t):
    return _qs_runs(t).filter(status__in=["warning", "error"], resolution="OPEN")


def _qs_skill(slug):
    def fn(t):
        return _qs_runs(t).filter(skill_slug=slug)
    return fn


def _qs_connectors(t):
    from connectors.models import Connector
    return _q(Connector, t)


def _qs_licenses(t):
    from licensing.models import License
    return _q(License, t)


def _qs_vob(t):
    from voiceai.models import VobCall
    return _q(VobCall, t)


def _qs_campaigns(t):
    from voiceai.models import Campaign
    return _q(Campaign, t)


def _qs_agents(t):
    from voiceai.models import VoiceAgent
    return _q(VoiceAgent, t)


def _qs_users(t):
    from accounts.models import User
    return User.objects.all() if t is None else User.objects.filter(tenant=t)


# -- daily bucketing --------------------------------------------------------
def _daily_counts(dts, days=7):
    today = timezone.now().date()
    buckets = {(today - timedelta(days=i)): 0 for i in range(days - 1, -1, -1)}
    for dt in dts:
        d = dt.date() if hasattr(dt, "date") else dt
        if d in buckets:
            buckets[d] += 1
    return [{"day": d.strftime("%m/%d"), "value": v} for d, v in sorted(buckets.items())]


def _series_from_qs(qs_fn):
    def fn(tenant, days=7):
        dts = list(qs_fn(tenant).values_list("created_at", flat=True))
        return _daily_counts(dts, days)
    return fn


# -- computed metrics -------------------------------------------------------
def _success_rate(t):
    total = _qs_runs(t).count()
    return round(100 * _qs_completed(t).count() / total) if total else 0


def _success_rate_series(tenant, days=7):
    from skills.models import SkillRun
    today = timezone.now().date()
    out = []
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        day_qs = _q(SkillRun, tenant).filter(created_at__date=d)
        total = day_qs.count()
        ok = day_qs.filter(status="success").count()
        out.append({"day": d.strftime("%m/%d"), "value": round(100 * ok / total) if total else 0})
    return out


def _revenue(t):
    total = 0.0
    for r in _qs_skill("claim-submission")(t).filter(status="success"):
        try:
            total += float(r.input.get("charge_amount", 0) or 0)
        except (TypeError, ValueError):
            pass
    return round(total, 2)


def _revenue_series(tenant, days=7):
    from skills.models import SkillRun
    today = timezone.now().date()
    out = []
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        total = 0.0
        for r in _q(SkillRun, tenant).filter(skill_slug="claim-submission", status="success", created_at__date=d):
            try:
                total += float(r.input.get("charge_amount", 0) or 0)
            except (TypeError, ValueError):
                pass
        out.append({"day": d.strftime("%m/%d"), "value": round(total, 2)})
    return out


CATALOG = [
    {"key": "skill_runs", "label": "Total Workflow Runs", "unit": "", "color": "green",
     "keywords": ["runs", "workflow", "skill", "total", "executions", "activity"], "qs": _qs_runs},
    {"key": "completed_runs", "label": "Completed Runs", "unit": "", "color": "emerald",
     "keywords": ["completed", "done", "finished"], "qs": _qs_completed},
    {"key": "review_queue", "label": "Review Queue", "unit": "", "color": "amber",
     "keywords": ["review", "queue", "pending", "attention"], "qs": _qs_review},
    {"key": "success_rate", "label": "Success Rate", "unit": "%", "color": "emerald",
     "keywords": ["success", "rate", "completion", "percentage", "percent"],
     "resolve": _success_rate, "series": _success_rate_series},
    {"key": "revenue", "label": "Revenue Processed", "unit": "$", "color": "green",
     "keywords": ["revenue", "money", "dollars", "income", "billed", "billing"],
     "resolve": _revenue, "series": _revenue_series},
    {"key": "eligibility", "label": "Eligibility Verification", "unit": "", "color": "green",
     "keywords": ["eligibility", "coverage", "eligibility verification", "verifications"], "qs": _qs_skill("eligibility-verification")},
    {"key": "prior_auth", "label": "Prior Authorizations", "unit": "", "color": "green",
     "keywords": ["prior authorization", "prior auth", "authorization", "authorizations"], "qs": _qs_skill("prior-authorization")},
    {"key": "claims", "label": "Claims Submitted", "unit": "", "color": "green",
     "keywords": ["claim", "claims", "submission", "submitted"], "qs": _qs_skill("claim-submission")},
    {"key": "denials", "label": "Denials Handled", "unit": "", "color": "rose",
     "keywords": ["denial", "denials", "rejected", "rejection"], "qs": _qs_skill("denial-management")},
    {"key": "referrals", "label": "Referrals", "unit": "", "color": "violet",
     "keywords": ["referral", "referrals"], "qs": _qs_skill("referrals")},
    {"key": "connectors", "label": "API Connectors", "unit": "", "color": "green",
     "keywords": ["connector", "connectors", "integration", "integrations", "mcp", "api connection", "api connections", "connections"], "qs": _qs_connectors},
    {"key": "licenses", "label": "Licenses", "unit": "", "color": "green",
     "keywords": ["license", "licenses", "licence", "subscription", "tier"], "qs": _qs_licenses},
    {"key": "vob_calls", "label": "VOB Calls", "unit": "", "color": "green",
     "keywords": ["vob", "vob call", "vob calls", "voice call"], "qs": _qs_vob},
    {"key": "campaigns", "label": "Voice Campaigns", "unit": "", "color": "violet",
     "keywords": ["campaign", "campaigns", "outbound"], "qs": _qs_campaigns},
    {"key": "voice_agents", "label": "Voice Agents", "unit": "", "color": "green",
     "keywords": ["agent", "agents", "voice agent"], "qs": _qs_agents},
    {"key": "users", "label": "Team Members", "unit": "", "color": "green",
     "keywords": ["user", "users", "team", "member", "members", "staff", "people"], "qs": _qs_users},
]

BY_KEY = {m["key"]: m for m in CATALOG}

# Colour words the chat understands -> tile tone.
COLORS = {
    "blue": "blue", "green": "green", "emerald": "emerald", "teal": "emerald",
    "red": "rose", "rose": "rose", "pink": "rose",
    "amber": "amber", "orange": "amber", "yellow": "amber", "gold": "amber",
    "violet": "violet", "purple": "violet",
}

_STOP = {"the", "a", "an", "of", "for", "me", "show", "add", "tile", "chart", "trend",
         "graph", "count", "vs", "days", "day", "per", "over", "time", "and", "display",
         "create", "in", "color", "colour", "as", "with", "keep", "make"}


def resolve_value(key, tenant):
    m = BY_KEY.get(key)
    if not m:
        return 0
    try:
        if m.get("resolve"):
            return m["resolve"](tenant)
        return m["qs"](tenant).count()
    except Exception:
        return 0


def resolve_series(key, tenant, days=7):
    m = BY_KEY.get(key)
    if not m:
        return []
    try:
        if m.get("series"):
            return m["series"](tenant, days)
        if m.get("qs"):
            return _series_from_qs(m["qs"])(tenant, days)
    except Exception:
        pass
    return []


def match_metric(text):
    """Best-matching metric for a chat phrase (specificity-weighted)."""
    t = (text or "").lower()
    words = set(w.strip(".,!?") for w in t.split())
    best, best_score = None, 0
    for m in CATALOG:
        score = 0
        if m["key"].replace("_", " ") in t:
            score += 3
        for lw in m["label"].lower().split():
            if lw not in _STOP and lw in words:
                score += 2
        for kw in m["keywords"]:
            if kw in t:
                score += 2 if " " in kw else 1
        if score > best_score:
            best, best_score = m, score
    return best if best_score >= 1 else None


def detect_color(text):
    for word, tone in COLORS.items():
        if word in (text or "").lower():
            return tone
    return None


def catalog_public():
    return [{"key": m["key"], "label": m["label"], "unit": m["unit"], "color": m["color"]} for m in CATALOG]
