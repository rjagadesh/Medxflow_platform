"""
LLM-driven dashboard designer.

The page-scoped dashboard chat sends the user's free-form request here. Claude
interprets it against the tenant's live data model and returns a *plan* — a set
of operations that add / update / remove / clear dashboard tiles. Nothing is
pre-fixed: the model composes metrics (data source + filters + aggregation),
picks the tile type (number vs trend chart), colour and title. The backend then
validates every query against the whitelist (see query.py) before saving.

Uses the Anthropic Messages API with a single forced tool call for reliable
structured output (model: claude-opus-4-8, adaptive thinking).

If no Anthropic credentials are configured, ``plan`` raises ``LLMUnavailable``
and the chat handler falls back to a local keyword planner so the demo still
works offline.
"""
import json
import os

from .schema import schema_doc

MODEL = "claude-opus-4-8"

COLORS = ["green", "emerald", "amber", "rose", "violet", "blue"]

PLAN_TOOL = {
    "name": "design_dashboard",
    "description": "Apply a set of changes to the tenant's dashboard, then reply to the user.",
    "input_schema": {
        "type": "object",
        "properties": {
            "reply": {
                "type": "string",
                "description": "A short, friendly message to the user describing what you changed.",
            },
            "operations": {
                "type": "array",
                "description": "Ordered changes to apply. Empty if the request needs no change.",
                "items": {
                    "type": "object",
                    "properties": {
                        "op": {"type": "string", "enum": ["add", "update", "remove", "clear"]},
                        "match": {
                            "type": "string",
                            "description": "For update/remove: the title (or part of it) of the existing tile to change.",
                        },
                        "tile": {
                            "type": "object",
                            "description": "For add: the full tile. For update: only the fields to change.",
                            "properties": {
                                "title": {"type": "string"},
                                "type": {"type": "string", "enum": ["stat", "chart"]},
                                "color": {"type": "string", "enum": COLORS},
                                "unit": {"type": "string", "enum": ["", "$", "%"]},
                                "query": {
                                    "type": "object",
                                    "properties": {
                                        "source": {"type": "string"},
                                        "aggregate": {"type": "string", "enum": ["count", "sum", "avg", "percent"]},
                                        "field": {"type": "string", "description": "Numeric field for sum/avg, e.g. input.charge_amount"},
                                        "filters": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {"field": {"type": "string"}, "value": {}},
                                                "required": ["field"],
                                            },
                                        },
                                        "numerator": {
                                            "type": "array",
                                            "description": "For aggregate=percent: the filters that define the numerator subset.",
                                            "items": {
                                                "type": "object",
                                                "properties": {"field": {"type": "string"}, "value": {}},
                                                "required": ["field"],
                                            },
                                        },
                                    },
                                    "required": ["source", "aggregate"],
                                },
                            },
                        },
                    },
                    "required": ["op"],
                },
            },
        },
        "required": ["reply", "operations"],
    },
}


def _system_prompt(tenant):
    return f"""You are the design engine for a per-tenant, fully customizable analytics dashboard
in MedXFlow, a healthcare revenue-cycle automation platform. The user talks to you in a
page-scoped chat and asks — in their own words — to see, change, recolour or remove metrics.
You translate that into concrete dashboard changes by calling the `design_dashboard` tool.

You are NOT limited to a fixed list of metrics. You COMPOSE each metric from the DATA MODEL
below, which is read live from this tenant's own database schema. Pick a source, optional
filters, and an aggregation. Design the UI too: choose a tile type (a single number = "stat",
or a 7-day trend = "chart"), a colour, a unit and a concise title.

DATA MODEL — the ONLY sources and fields you may use (read from the live DB; never invent a
source, filter field, or numeric field that is not listed here):
{schema_doc(tenant)}

TILE = {{ title, type ("stat"|"chart"), color, unit ("" | "$" | "%"), query }}
QUERY = {{ source, filters:[{{field, value}}], aggregate ("count"|"sum"|"avg"|"percent"), field?, numerator?:[{{field,value}}] }}

RULES
- Use ONLY source keys, filter fields and numeric fields that appear in the DATA MODEL above. If the user asks for something not representable, say so in `reply` and return no operations.
- count: number of matching rows. sum/avg: needs `field` (a numeric field of that source). percent: needs `numerator` filters; the value is 100*numerator/base, use unit "%".
- Dollar amounts use unit "$". Percentages use unit "%". Counts use unit "".
- Use type "chart" when the user asks for a trend / over time / per day / graph; otherwise "stat".
- Pick a sensible colour: rose for denials/errors/negatives, emerald/green for healthy/success, amber for queues/attention, violet for voice/campaigns, blue only when asked.
- To CHANGE an existing tile (recolour, retitle, stat↔chart), use op "update" with `match` set to the existing tile's title and `tile` holding only the changed fields.
- To remove, use op "remove" with `match`. To wipe the board, use one op "clear".
- The user will be asked to CONFIRM before anything is applied, so phrase `reply` as a proposal ("I'll add…", "I'll recolour…"), keep it short and human. If the request is unclear or off-topic, return no operations and ask a clarifying question in `reply`.

Composition examples (adapt the exact keys/fields to the DATA MODEL above):
- "revenue from paid claims" -> source skill_run, filters [{{field:skill_slug,value:claim-submission}},{{field:status,value:success}}], aggregate sum, field input.charge_amount, unit "$".
- "how many connectors are active" -> source connector, filters [{{field:status,value:active}}], aggregate count.
- "share of runs that succeeded" -> source skill_run, aggregate percent, numerator [{{field:status,value:success}}], unit "%".
- "trend of denials per day" -> source skill_run, filters [{{field:skill_slug,value:denial-management}}], aggregate count, type chart, color rose."""


def _current_tiles_note(tiles):
    if not tiles:
        return "The dashboard is currently empty."
    lines = []
    for t in tiles:
        lines.append(f'- "{t.get("title","(untitled)")}" ({t.get("type","stat")}, {t.get("color","green")})')
    return "Current tiles on the dashboard:\n" + "\n".join(lines)


class LLMUnavailable(RuntimeError):
    """No Anthropic credentials / SDK, or the API call failed. Caller should fall back."""


def plan(message, tiles, tenant):
    """Ask Claude to design dashboard changes. Returns {"reply", "operations"} or raises LLMUnavailable."""
    try:
        import anthropic
    except Exception as e:  # pragma: no cover
        raise LLMUnavailable(f"anthropic SDK not installed: {e}")

    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        raise LLMUnavailable("No ANTHROPIC_API_KEY configured.")

    tenant_name = getattr(tenant, "name", "") or "this organisation"
    try:
        client = anthropic.Anthropic()
        resp = client.messages.create(
            model=MODEL,
            max_tokens=2000,
            thinking={"type": "adaptive"},
            system=_system_prompt(tenant),
            tools=[PLAN_TOOL],
            tool_choice={"type": "tool", "name": "design_dashboard"},
            messages=[{
                "role": "user",
                "content": f"Tenant: {tenant_name}.\n"
                           f"{_current_tiles_note(tiles)}\n\nUser request: {message}",
            }],
        )
    except Exception as e:
        raise LLMUnavailable(str(e))

    for block in resp.content:
        if getattr(block, "type", None) == "tool_use" and block.name == "design_dashboard":
            data = block.input
            if isinstance(data, str):
                data = json.loads(data)
            return {"reply": data.get("reply", ""), "operations": data.get("operations", [])}
    raise LLMUnavailable("Model did not return a dashboard plan.")
