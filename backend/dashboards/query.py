"""
Safe query engine for LLM-designed dashboard tiles.

A tile carries a *query spec* the LLM composes from the tenant's real database
schema (see schema.py) — a source, optional filters, and an aggregation. This
lets the model invent metrics that were never predefined while the backend only
ever runs safe, tenant-scoped ORM queries against whitelisted columns. The LLM
never writes SQL and can only touch fields the schema reader chose to expose.

A query spec looks like:

    {
      "source": "skill_run",
      "filters": [{"field": "skill_slug", "value": "claim-submission"},
                  {"field": "status", "value": "success"}],
      "aggregate": "sum",              # count | sum | avg | percent
      "field": "input.charge_amount",  # required for sum / avg (dotted = JSON key)
      "numerator": [{"field": "status", "value": "success"}]  # for percent
    }

``resolve_value`` returns a single number; ``resolve_series`` returns a daily
[{day, value}] list for chart tiles. Every spec is validated with
``validate_spec(spec, tenant)`` before it is ever saved or run.
"""
import importlib
from datetime import timedelta

from django.utils import timezone

from .schema import build_schema

AGGREGATES = ("count", "sum", "avg", "percent")


class BadSpec(ValueError):
    """Raised when a query spec references anything the schema didn't expose."""


def _model(source_meta):
    mod, name = source_meta["model"]
    return getattr(importlib.import_module(mod), name)


def _sources(tenant):
    return build_schema(tenant)


def _base_qs(meta, tenant):
    qs = _model(meta).objects.all()
    if tenant is not None:
        qs = qs.filter(tenant=tenant)
    return qs


def _apply_filters(qs, meta, filters):
    for f in filters or []:
        field = f.get("field")
        if field not in meta["filters"]:
            raise BadSpec(f"'{field}' is not a filterable field here.")
        qs = qs.filter(**{field: f.get("value")})
    return qs


def _read_number(obj, path):
    """Read a numeric field, supporting dotted paths into JSON columns."""
    cur = obj
    for part in path.split("."):
        cur = cur.get(part) if isinstance(cur, dict) else getattr(cur, part, None)
        if cur is None:
            return 0.0
    try:
        return float(cur or 0)
    except (TypeError, ValueError):
        return 0.0


def validate_spec(spec, tenant):
    """Raise BadSpec if anything in the spec is outside the tenant's schema."""
    if not isinstance(spec, dict):
        raise BadSpec("Query spec must be an object.")
    sources = _sources(tenant)
    source = spec.get("source")
    if source not in sources:
        raise BadSpec(f"Unknown data source '{source}'.")
    meta = sources[source]
    agg = spec.get("aggregate", "count")
    if agg not in AGGREGATES:
        raise BadSpec(f"Unknown aggregate '{agg}'.")
    for f in spec.get("filters", []) or []:
        if f.get("field") not in meta["filters"]:
            raise BadSpec(f"'{f.get('field')}' is not filterable on {source}.")
    if agg in ("sum", "avg") and spec.get("field") not in meta["numeric"]:
        raise BadSpec(f"'{spec.get('field')}' is not a numeric field on {source}.")
    if agg == "percent":
        for f in spec.get("numerator", []) or []:
            if f.get("field") not in meta["filters"]:
                raise BadSpec(f"'{f.get('field')}' is not filterable on {source}.")
    return meta


def _aggregate(qs, meta, spec):
    agg = spec.get("aggregate", "count")
    if agg == "count":
        return qs.count()
    if agg == "percent":
        base = qs.count()
        if not base:
            return 0
        num = _apply_filters(qs, meta, spec.get("numerator", [])).count()
        return round(100 * num / base)
    field = spec["field"]
    vals = [_read_number(o, field) for o in qs]
    if agg == "sum":
        return round(sum(vals), 2)
    return round(sum(vals) / len(vals), 2) if vals else 0


def resolve_value(spec, tenant):
    try:
        meta = validate_spec(spec, tenant)
        qs = _apply_filters(_base_qs(meta, tenant), meta, spec.get("filters"))
        return _aggregate(qs, meta, spec)
    except Exception:
        return 0


def resolve_series(spec, tenant, days=7):
    """Daily series over the last `days` days for the tile's query."""
    try:
        meta = validate_spec(spec, tenant)
        date_field = meta.get("date")
        if not date_field:
            return []
        today = timezone.now().date()
        out = []
        for i in range(days - 1, -1, -1):
            d = today - timedelta(days=i)
            qs = _apply_filters(_base_qs(meta, tenant), meta, spec.get("filters"))
            qs = qs.filter(**{f"{date_field}__date": d})
            out.append({"day": d.strftime("%m/%d"), "value": _aggregate(qs, meta, spec)})
        return out
    except Exception:
        return []
