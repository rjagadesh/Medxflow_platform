"""Helpers shared by the dashboard API and the dashboard chat handler.

Two kinds of tile can live in a tenant's config:
  * LLM-designed tiles carry a ``query`` spec (source/filters/aggregate) — the
    metric is composed on the fly, not chosen from a fixed list.
  * Legacy tiles carry a catalogue ``metric`` key — still supported so the
    manual "Add metric" picker and older saved dashboards keep working.
"""
import uuid

from . import query as q
from .metrics import BY_KEY, catalog_public, resolve_series, resolve_value
from .models import DEFAULT_TILES, DashboardConfig

CHART_DAYS = 7


def get_config(tenant):
    """Fetch (or create with defaults) the tenant's dashboard config."""
    config, created = DashboardConfig.objects.get_or_create(tenant=tenant)
    if created:
        config.tiles = [{"id": uuid.uuid4().hex[:8], **t} for t in DEFAULT_TILES]
        config.save()
    return config


def _tile_out(t, tenant):
    ttype = t.get("type", "stat")

    # LLM-designed tile — value/series come from the safe query engine.
    if t.get("query"):
        out = {
            "id": t.get("id"),
            "title": t.get("title") or "Metric",
            "size": "lg" if ttype == "chart" else t.get("size", "sm"),
            "type": ttype,
            "unit": t.get("unit", ""),
            "color": t.get("color") or "green",
            "value": q.resolve_value(t["query"], tenant),
        }
        if ttype == "chart":
            out["series"] = q.resolve_series(t["query"], tenant, days=CHART_DAYS)
        return out

    # Legacy catalogue tile.
    meta = BY_KEY.get(t.get("metric"))
    if not meta:
        return None
    out = {
        "id": t.get("id"),
        "metric": t["metric"],
        "title": t.get("title") or meta["label"],
        "size": t.get("size", "sm"),
        "type": ttype,
        "unit": meta["unit"],
        "color": t.get("color") or meta["color"],
        "value": resolve_value(t["metric"], tenant),
    }
    if ttype == "chart":
        out["series"] = resolve_series(t["metric"], tenant, days=CHART_DAYS)
        out["size"] = "lg"
    return out


def serialize(config, tenant):
    tiles = [x for x in (_tile_out(t, tenant) for t in config.tiles) if x]
    return {"tiles": tiles, "available": catalog_public()}


# --------------------------------------------------------------------------- #
# Applying an LLM plan
# --------------------------------------------------------------------------- #
def _find(tiles, match):
    """Match a tile by id (exact) or by title (case-insensitive substring)."""
    if not match:
        return None
    m = str(match).lower().strip()
    for t in tiles:
        if t.get("id") == match:
            return t
    for t in tiles:
        if m in (t.get("title") or "").lower():
            return t
    return None


def apply_operations(config, operations, tenant):
    """Apply an LLM-designed set of operations. Returns (changed_count, errors)."""
    tiles = list(config.tiles)
    changed, errors = 0, []

    for op in operations or []:
        kind = op.get("op")
        try:
            if kind == "clear":
                if tiles:
                    tiles = []
                    changed += 1

            elif kind == "add":
                spec = (op.get("tile") or {})
                query = spec.get("query")
                if not query:
                    errors.append("A tile was missing its query — skipped.")
                    continue
                q.validate_spec(query, tenant)  # raises BadSpec on anything not in the schema
                ttype = spec.get("type", "stat")
                tiles.append({
                    "id": uuid.uuid4().hex[:8],
                    "title": spec.get("title") or "Metric",
                    "type": ttype,
                    "size": "lg" if ttype == "chart" else "sm",
                    "color": spec.get("color") or "green",
                    "unit": spec.get("unit", ""),
                    "query": query,
                })
                changed += 1

            elif kind == "update":
                target = _find(tiles, op.get("match"))
                if not target:
                    errors.append(f"No tile matching '{op.get('match')}' to update.")
                    continue
                spec = op.get("tile") or {}
                if "query" in spec and spec["query"]:
                    q.validate_spec(spec["query"], tenant)
                    target["query"] = spec["query"]
                    target.pop("metric", None)  # became a composed tile
                for key in ("title", "type", "color", "unit"):
                    if spec.get(key) is not None:
                        target[key] = spec[key]
                if target.get("type") == "chart":
                    target["size"] = "lg"
                changed += 1

            elif kind == "remove":
                target = _find(tiles, op.get("match"))
                if not target:
                    errors.append(f"No tile matching '{op.get('match')}' to remove.")
                    continue
                tiles = [t for t in tiles if t is not target]
                changed += 1
        except q.BadSpec as e:
            errors.append(str(e))
        except Exception as e:  # pragma: no cover
            errors.append(str(e))

    if changed:
        config.tiles = tiles
        config.save()
    return changed, errors


# --------------------------------------------------------------------------- #
# Confirm-before-apply: a proposed plan is stored on the config until the user
# says yes/no in the next chat turn.
# --------------------------------------------------------------------------- #
def _describe_query(query):
    if not isinstance(query, dict):
        return ""
    agg = query.get("aggregate", "count")
    src = query.get("source", "")
    filt = ", ".join(f"{f.get('field')}={f.get('value')}" for f in query.get("filters", []) or [])
    if agg == "count":
        head = f"count of {src}"
    elif agg == "percent":
        num = ", ".join(f"{f.get('field')}={f.get('value')}" for f in query.get("numerator", []) or [])
        head = f"% of {src} where {num}"
    else:
        head = f"{agg} of {query.get('field', '')} in {src}"
    return head + (f" (where {filt})" if filt else "")


def summarize_plan(operations):
    """Human-readable one-liners describing what a plan will do."""
    lines = []
    for op in operations or []:
        kind = op.get("op")
        tile = op.get("tile") or {}
        if kind == "clear":
            lines.append("Clear the entire dashboard")
        elif kind == "add":
            shape = "trend chart" if tile.get("type") == "chart" else "tile"
            lines.append(f'Add a {tile.get("color", "green")} {shape} "{tile.get("title", "Metric")}" — {_describe_query(tile.get("query"))}')
        elif kind == "update":
            changes = ", ".join(f"{k}→{tile[k]}" for k in ("title", "type", "color", "unit") if tile.get(k) is not None)
            if tile.get("query"):
                changes = (changes + ", " if changes else "") + _describe_query(tile["query"])
            lines.append(f'Update "{op.get("match")}"' + (f" ({changes})" if changes else ""))
        elif kind == "remove":
            lines.append(f'Remove "{op.get("match")}"')
    return lines


def set_pending(config, operations, reply):
    config.pending = {"operations": operations, "reply": reply, "summary": summarize_plan(operations)}
    config.save()


def clear_pending(config):
    if config.pending is not None:
        config.pending = None
        config.save()


# --------------------------------------------------------------------------- #
# Legacy helpers (manual "Add metric" picker + offline keyword fallback)
# --------------------------------------------------------------------------- #
def add_tile(config, metric, title=None, size="sm", ttype="stat", color=None):
    if metric not in BY_KEY:
        return None
    tile = {"id": uuid.uuid4().hex[:8], "metric": metric, "size": size, "type": ttype}
    if title:
        tile["title"] = title
    if color:
        tile["color"] = color
    config.tiles = [*config.tiles, tile]
    config.save()
    return tile


def set_color(config, metric, color):
    changed = 0
    tiles = []
    for t in config.tiles:
        if t.get("metric") == metric:
            t = {**t, "color": color}
            changed += 1
        tiles.append(t)
    config.tiles = tiles
    config.save()
    return changed


def has_metric(config, metric, ttype=None):
    return any(t.get("metric") == metric and (ttype is None or t.get("type", "stat") == ttype)
               for t in config.tiles)


def remove_metric(config, metric):
    before = len(config.tiles)
    config.tiles = [t for t in config.tiles if t.get("metric") != metric]
    config.save()
    return before - len(config.tiles)


def remove_tile(config, tile_id):
    before = len(config.tiles)
    config.tiles = [t for t in config.tiles if t.get("id") != tile_id]
    config.save()
    return before != len(config.tiles)


def clear(config):
    config.tiles = []
    config.save()
