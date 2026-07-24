"""
AI kiosk-screen editor.

Given the current kiosk HTML and a plain-language instruction, Claude returns the
updated HTML (a single, self-contained document) plus a short reply. Uses
claude-opus-4-8 with a forced tool call so the HTML comes back cleanly. Falls
back to leaving the HTML unchanged when no Anthropic credentials are configured.
"""
import json
import os

from .templates import DEFAULT_HTML

# Cheapest current Anthropic model — cost-effective for straightforward HTML
# edits. Haiku 4.5 does not support adaptive thinking, so no `thinking` param.
MODEL = "claude-haiku-4-5"

EDIT_TOOL = {
    "name": "update_kiosk",
    "description": "Return the updated kiosk screen HTML and a short reply to the user.",
    "input_schema": {
        "type": "object",
        "properties": {
            "html": {
                "type": "string",
                "description": "The COMPLETE updated kiosk screen as a single self-contained HTML document (inline CSS, minimal JS).",
            },
            "reply": {
                "type": "string",
                "description": "A short, friendly one-line summary of what you changed.",
            },
        },
        "required": ["html", "reply"],
    },
}

SYSTEM = (
    "You design touchscreen KIOSK screens for a healthcare front desk (patient check-in / "
    "intake). You are given the CURRENT kiosk screen as a full HTML document and an instruction "
    "from the user, and you return the UPDATED full HTML document.\n\n"
    "RULES:\n"
    "- Always return ONE complete, self-contained HTML document: `<!doctype html>` … `</html>` "
    "with all CSS inline in a <style> tag and any JS inline in a <script> tag. No external files, "
    "CDNs, images, or network requests.\n"
    "- Preserve everything the user didn't ask to change. Apply their change precisely.\n"
    "- Keep it kiosk-friendly: large touch targets, big fonts, clear fields, and multi-step "
    "flows with Next/Back/Submit where appropriate.\n"
    "- Default brand color is #1a5dad (blue) with a #17c3b2 teal accent, but honour any colour the "
    "user requests.\n"
    "- Common requests: add/remove form fields (name, DOB, phone, email, insurance, member ID, "
    "reason for visit, signature, consent checkbox), change colours/logo/heading, add steps, "
    "reorder fields, change button labels. Do exactly what is asked.\n"
    "- Return the full HTML via the update_kiosk tool."
)


class KioskAIUnavailable(RuntimeError):
    pass


def edit(current_html, message):
    """Return (new_html, reply). Raises KioskAIUnavailable if no credentials/SDK."""
    try:
        import anthropic
    except Exception as e:  # pragma: no cover
        raise KioskAIUnavailable(f"anthropic SDK not installed: {e}")
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        raise KioskAIUnavailable("No ANTHROPIC_API_KEY configured.")

    html = current_html or DEFAULT_HTML
    try:
        client = anthropic.Anthropic()
        resp = client.messages.create(
            model=MODEL, max_tokens=8000,
            system=SYSTEM, tools=[EDIT_TOOL],
            tool_choice={"type": "tool", "name": "update_kiosk"},
            messages=[{
                "role": "user",
                "content": f"CURRENT KIOSK HTML:\n{html}\n\nINSTRUCTION: {message}",
            }],
        )
    except Exception as e:
        raise KioskAIUnavailable(str(e))

    for block in resp.content:
        if getattr(block, "type", None) == "tool_use" and block.name == "update_kiosk":
            data = block.input
            if isinstance(data, str):
                data = json.loads(data)
            return data.get("html") or html, data.get("reply", "Updated the kiosk screen.")
    raise KioskAIUnavailable("Model did not return updated HTML.")
