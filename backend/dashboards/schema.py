"""
Tenant DB schema reader.

Instead of a hand-maintained whitelist, this introspects the live database:
every model that is tenant-scoped (has a ``tenant`` FK) becomes a queryable
"source", and its columns are exposed to the LLM as filterable / numeric fields.
JSON columns are *sampled* so numeric keys that only exist in a given tenant's
data (e.g. ``input.charge_amount`` on a claim submission) are discovered too.

Safety: only enum / boolean / slug-like columns are ever filterable and only
true number columns are aggregatable, so free-text secrets (api keys, encrypted
blobs, MFA secrets, PII text) never surface. A name denylist is applied on top
as defense-in-depth. Everything stays tenant-scoped at query time (see query.py).
"""
import re

from django.apps import apps

# Field names we never expose, even if they'd otherwise qualify.
_SENSITIVE = ("password", "secret", "mfa", "token", "encrypted", "api_key",
              "apikey", "recording", "transcript", "hash", "npi", "dob",
              "member_id", "group_number")

# JSON columns we don't sample (PII / large / structural).
_JSON_SKIP = {"transcript", "vob_data", "keys", "phone_numbers",
              "end_call_messages", "forward_messages", "steps", "graph"}

# Slug-like identifier columns that are safe & useful to filter on even though
# they have no `choices` (they hold short machine values, not free text/PII).
_SAFE_IDENT = {"skill_slug", "trigger_skill", "action_skill", "category",
               "feature", "cadence", "section", "sender", "kind"}

_NUMERIC_TYPES = {"IntegerField", "PositiveIntegerField", "PositiveSmallIntegerField",
                  "PositiveBigIntegerField", "SmallIntegerField", "BigIntegerField",
                  "DecimalField", "FloatField"}


def _snake(name):
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


def _sensitive(name):
    return any(p in name for p in _SENSITIVE)


def _choices(field):
    ch = getattr(field, "choices", None)
    if not ch:
        return None
    return [str(c[0]) for c in ch]


def _filterable(field):
    name = field.name
    if _sensitive(name):
        return False  # never expose sensitive columns as filters
    itype = field.get_internal_type()
    if itype == "BooleanField":
        return [True, False]
    if itype in ("CharField", "SlugField"):
        ch = _choices(field)
        if ch:
            return ch
        if name.endswith("_slug") or name in _SAFE_IDENT:
            return None  # free-form, but safe to filter (machine value)
    return False  # sentinel: not filterable


def _sample_json_keys(model, tenant, field_name, limit=50):
    """Discover top-level numeric keys inside a JSON column from recent rows."""
    keys = set()
    try:
        qs = model.objects.all()
        if tenant is not None:
            qs = qs.filter(tenant=tenant)
        for row in qs.order_by("-id").values_list(field_name, flat=True)[:limit]:
            if isinstance(row, dict):
                for k, v in row.items():
                    if isinstance(v, (int, float)) and not isinstance(v, bool):
                        keys.add(k)
                    elif isinstance(v, str):
                        try:
                            float(v)
                            keys.add(k)
                        except (TypeError, ValueError):
                            pass
    except Exception:
        pass
    return sorted(keys)


def _date_field(model):
    names = {f.name for f in model._meta.concrete_fields}
    for pref in ("created_at", "date_joined", "completed_at", "updated_at"):
        if pref in names:
            return pref
    for f in model._meta.concrete_fields:
        if f.get_internal_type() == "DateTimeField":
            return f.name
    return None


def build_schema(tenant):
    """Introspect the tenant's queryable sources. Returns {key: source_meta}."""
    sources = {}
    for model in apps.get_models():
        if model._meta.label in ("dashboards.DashboardConfig", "assistant.DevChatMessage"):
            continue
        if not any(f.name == "tenant" for f in model._meta.get_fields()):
            continue

        filters, numeric = {}, {}
        for f in model._meta.concrete_fields:
            itype = f.get_internal_type()
            if itype == "JSONField":
                if f.name in _JSON_SKIP or _sensitive(f.name):
                    continue
                for k in _sample_json_keys(model, tenant, f.name):
                    numeric[f"{f.name}.{k}"] = f"'{k}' inside {f.name}"
                continue
            if itype in _NUMERIC_TYPES and not _sensitive(f.name):
                numeric[f.name] = f.verbose_name if hasattr(f, "verbose_name") else f.name
                continue
            filt = _filterable(f)
            if filt is not False:  # None (free slug) or a list of choices
                filters[f.name] = filt

        key = _snake(model.__name__)
        sources[key] = {
            "model": (model.__module__, model.__name__),
            "describe": model._meta.verbose_name_plural.title(),
            "filters": filters,
            "numeric": numeric,
            "date": _date_field(model),
        }
    return sources


def schema_doc(tenant):
    """A compact description of every source/field for the LLM system prompt."""
    lines = []
    for src, meta in build_schema(tenant).items():
        filt = []
        for field, vals in meta["filters"].items():
            filt.append(field + (f" ({'/'.join(map(str, vals))})" if vals else " (free text)"))
        num = ", ".join(meta["numeric"].keys()) or "none"
        lines.append(f"- {src}: {meta['describe']}\n"
                     f"    filterable: {', '.join(filt) or 'none'}\n"
                     f"    numeric fields (sum/avg): {num}")
    return "\n".join(lines)
