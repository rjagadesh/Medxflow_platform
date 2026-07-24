"""
Dashboard developer-chat handler.

Flow (primary, LLM path):
  1. The user describes a metric/change in their own words.
  2. Claude reads the tenant's live DB schema (schema.py) and DESIGNS a plan —
     composing metrics and choosing tile type/colour/title.
  3. We DON'T apply it yet: we store the plan as `pending` and reply with a
     preview + "Reply 'yes' to apply."
  4. On the next turn, "yes" applies the pending plan; "no" discards it; anything
     else is treated as a new request (replacing the pending plan).

Fallback: with no Anthropic credentials, a local keyword planner keeps the demo
working offline (applies immediately).

Returns (reply_text, action). action = {"type": "dashboard_updated"} only when
the dashboard actually changed (the UI listens for this to refresh live).
"""
from . import llm
from .metrics import catalog_public, detect_color, match_metric
from .service import (
    add_tile, apply_operations, clear, clear_pending, get_config, has_metric,
    remove_metric, set_color, set_pending,
)

ADDED = {"type": "dashboard_updated"}

_AFFIRM = {"yes", "y", "yep", "yeah", "yup", "ok", "okay", "sure", "confirm",
           "apply", "proceed", "approved", "confirmed", "do it", "go ahead",
           "looks good", "sounds good", "please do", "yes please", "apply it", "apply them"}
_NEG = {"no", "n", "nope", "cancel", "nevermind", "never mind", "discard",
        "stop", "scrap", "not now", "don't", "dont"}

REMOVE_WORDS = ("remove", "delete", "hide", "drop", "take off", "get rid")
CLEAR_WORDS = ("clear the dashboard", "reset the dashboard", "clear dashboard",
               "reset dashboard", "empty the dashboard", "start over")
LIST_WORDS = ("list", "what metrics", "what can", "available", "options", "help", "which metrics")
CHART_WORDS = ("chart", "trend", "graph", "over time", "vs days", "per day",
               "by day", "timeline", "time series", "line", "over days")


def _classify(text):
    t = (text or "").strip().lower().rstrip(" .!")
    if t in _AFFIRM:
        return "yes"
    if t in _NEG:
        return "no"
    first = t.split()[0] if t.split() else ""
    if first in {"yes", "yep", "yeah", "yup", "ok", "okay", "sure", "confirm", "apply", "proceed"}:
        return "yes"
    if first in {"no", "nope", "cancel", "stop", "discard"}:
        return "no"
    return "other"


def handle(user, message):
    tenant = getattr(user, "tenant", None)
    if tenant is None:
        return ("The platform dashboard is read-only. Sign in as a tenant user to customise it.", None)

    config = get_config(tenant)

    # --- Confirming (or rejecting) a previously proposed plan --------------
    if config.pending:
        verdict = _classify(message)
        if verdict == "yes":
            ops = config.pending.get("operations", [])
            changed, errors = apply_operations(config, ops, tenant)
            clear_pending(config)
            if changed:
                note = f" (Note: {errors[0]})" if errors else ""
                return (f"Done — your dashboard is updated.{note}", ADDED)
            return (f"I couldn't apply that: {errors[0] if errors else 'nothing changed'}.", None)
        if verdict == "no":
            clear_pending(config)
            return ("Okay, I won't make those changes. Tell me what you'd like instead.", None)
        # Anything else → treat as a brand-new request (falls through, replacing pending).

    # --- Design a new plan with the LLM (primary) -------------------------
    try:
        result = llm.plan(message, config.tiles, tenant)
    except llm.LLMUnavailable:
        clear_pending(config)
        return _offline_handle(message, config)

    ops = result.get("operations") or []
    reply = result.get("reply") or ""
    if not ops:
        clear_pending(config)
        return (reply or "Tell me which metric you'd like and I'll design a tile for it.", None)

    # Propose — store the plan and ask for confirmation. Nothing changes yet.
    set_pending(config, ops, reply)
    summary = "\n".join(f"• {s}" for s in config.pending["summary"])
    preview = (f"{reply}\n\nHere's what I'll do:\n{summary}\n\n"
               'Apply these changes? Reply "yes" to confirm, or tell me what to adjust.')
    return (preview, None)


# --------------------------------------------------------------------------- #
# Offline fallback — keyword planner over the legacy catalogue (applies now).
# --------------------------------------------------------------------------- #
def _offline_handle(message, config):
    text = (message or "").lower().strip()
    metric = match_metric(text)
    color = detect_color(text)
    wants_chart = any(w in text for w in CHART_WORDS)
    note = " (offline mode — set ANTHROPIC_API_KEY for full AI design)"

    def hasw(words):
        return any(w in text for w in words)

    if hasw(CLEAR_WORDS):
        clear(config)
        return ("Cleared your dashboard." + note, ADDED)
    if hasw(LIST_WORDS) and not metric:
        names = ", ".join(m["label"] for m in catalog_public())
        return (f"I can show these metrics offline: {names}." + note, None)
    if hasw(REMOVE_WORDS) and not wants_chart:
        if not metric:
            return ('Which metric should I remove? e.g. "remove revenue".', None)
        if remove_metric(config, metric["key"]):
            return (f"Removed the {metric['label']} tile.", ADDED)
        return (f"There's no {metric['label']} tile right now.", None)
    if color and metric and not wants_chart:
        if has_metric(config, metric["key"]):
            n = set_color(config, metric["key"], color)
            return (f"Made the {metric['label']} tile {color}.", ADDED if n else None)
        add_tile(config, metric["key"], color=color)
        return (f"Added a {color} {metric['label']} tile.", ADDED)
    if wants_chart and metric:
        if has_metric(config, metric["key"], ttype="chart"):
            return (f"You already have a {metric['label']} trend chart.", None)
        add_tile(config, metric["key"], ttype="chart", color=color)
        return (f"Added a {metric['label']} trend chart." + note, ADDED)
    if metric:
        if has_metric(config, metric["key"], ttype="stat"):
            return (f"You already have a {metric['label']} tile.", None)
        add_tile(config, metric["key"])
        return (f"Added a {metric['label']} tile." + note, ADDED)
    names = ", ".join(m["label"] for m in catalog_public()[:6])
    return (f"I'm in offline mode — set ANTHROPIC_API_KEY to let the AI design any metric. "
            f"For now I can add: {names}.", None)
