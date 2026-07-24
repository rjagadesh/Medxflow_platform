"""
AI Verification of Benefits.

Given a (simulated) coverage result, Claude writes a plain-English VOB summary
and a list of Action Items / billing flags — mirroring the reference portal's
"/api/ai/parse-benefits" + "Action Items" feature. Uses claude-opus-4-8 with a
forced tool call for reliable structure. Falls back to a deterministic summary
when no Anthropic credentials are configured.
"""
import json
import os

MODEL = "claude-opus-4-8"

VOB_TOOL = {
    "name": "verification_of_benefits",
    "description": "Summarize the coverage result and flag billing action items.",
    "input_schema": {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "A 2-4 sentence plain-English Verification of Benefits: is coverage active, plan type, key cost shares, and anything notable.",
            },
            "action_items": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Concrete billing / front-desk flags, e.g. 'Prior auth required for inpatient', 'Collect $40 specialist copay', 'Deductible not yet met — patient owes coinsurance'.",
            },
        },
        "required": ["summary", "action_items"],
    },
}


def _fallback(result):
    status = result.get("coverage_status", "Unknown")
    plan = result.get("plan_name", "the plan")
    n = result.get("normalized", {})
    summary = (f"Coverage is {status.lower()} on {plan} ({result.get('plan_type','')}). "
               f"Copay {n.get('copay','N/A')}, coinsurance {n.get('coinsurance','N/A')}, "
               f"deductible remaining {n.get('deductible_remaining','N/A')}, "
               f"out-of-pocket remaining {n.get('oop_remaining','N/A')}.")
    items = []
    if n.get("authorization_required"):
        items.append("Prior authorization required for one or more requested services.")
    if n.get("referral_required"):
        items.append("Referral required for specialist services.")
    if n.get("copay") and n["copay"] != "$0":
        items.append(f"Collect {n['copay']} copay at time of service.")
    if status.lower() != "active":
        items.append("Coverage is not active — verify member details before scheduling.")
    return summary, items or ["No billing flags identified."], ""


def generate_vob(result):
    """Return (summary, action_items, model). Never raises — falls back offline."""
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        return _fallback(result)
    try:
        import anthropic
        client = anthropic.Anthropic()
        resp = client.messages.create(
            model=MODEL, max_tokens=1200, thinking={"type": "adaptive"},
            system=("You are a healthcare revenue-cycle specialist writing a Verification of "
                    "Benefits (VOB) for a provider's billing team. Base everything ONLY on the "
                    "coverage data provided — never invent numbers."),
            tools=[VOB_TOOL], tool_choice={"type": "tool", "name": "verification_of_benefits"},
            messages=[{"role": "user", "content": "Coverage result:\n" + json.dumps(result, default=str)}],
        )
        for block in resp.content:
            if getattr(block, "type", None) == "tool_use":
                data = block.input
                if isinstance(data, str):
                    data = json.loads(data)
                return data.get("summary", ""), data.get("action_items", []), MODEL
    except Exception:
        pass
    return _fallback(result)
