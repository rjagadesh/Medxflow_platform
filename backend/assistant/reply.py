"""
Developer-assistant reply generation.

The assistant is *section-aware*: it knows which screen developer mode was opened
on and tailors its guidance to that tab. Out of the box it runs a lightweight,
rule-based responder so the chat works end-to-end with no external dependency.

To make it a real code-editing copilot, set ``ANTHROPIC_API_KEY`` in the
environment and replace the body of :func:`generate_reply` with a call to the
Claude Messages API (model e.g. ``claude-sonnet-5``) — the section + message +
history are already assembled for you.
"""
SECTIONS = {
    "eligibility-verification": "the Eligibility Verification workflow (checks member coverage, copay and deductible)",
    "prior-authorization": "the Prior Authorization workflow (submits and clears procedure authorizations)",
    "referrals": "the Referrals workflow (creates specialist referrals)",
    "claim-submission": "the Claim Submission workflow (sends claims to the clearinghouse)",
    "telehealth": "the Telehealth workflow (schedules visits and creates join links)",
    "decision-engine": "the Decision Engine (executive KPIs and recommendations)",
    "voice-ai": "the Voice AI studio (build and configure voice agents)",
    "connectors": "the Connectors screen (MCP servers and REST APIs)",
    "licenses": "License management (allocate tiers to tenants)",
    "settings": "the Settings screen (profile, security, team and roles)",
    "dashboard": "the Dashboard",
}


def _describe(section):
    return SECTIONS.get(section, f"the {section} screen")


def generate_reply(section, message, history=None):
    """Return an assistant reply string for a developer-mode message."""
    text = (message or "").lower().strip()
    where = _describe(section)

    if not text:
        return f"I'm your developer copilot for {where}. Tell me what you'd like to change."

    def has(*words):
        return any(w in text for w in words)

    if has("help", "what can you", "how do", "?") and len(text) < 40:
        return (
            f"You're in developer mode on {where}. I can help you:\n"
            "• add, rename or remove input fields\n"
            "• change labels, placeholders or validation\n"
            "• adjust the layout, colours or copy\n"
            "• wire this screen to a connector or model\n"
            "Describe the change and I'll outline exactly what to edit."
        )

    if has("add") and has("field", "input", "column", "option"):
        return (
            f"Sure — to add a field to {where}, declare it in the screen's input "
            "schema (name, label, type, required). On save it renders automatically. "
            "What should the field be called and what type is it (text, number, date, select)?"
        )

    if has("remove", "delete", "hide") and has("field", "input", "column", "button"):
        return (
            f"Got it. I'll remove that element from {where}. Removing it from the "
            "schema also drops it from the form and the logged output. Which field "
            "should go?"
        )

    if has("rename", "label", "title", "wording", "copy", "text"):
        return (
            f"Happy to reword {where}. Tell me the exact new label or copy and where "
            "it should appear, and I'll update the schema/heading."
        )

    if has("colour", "color", "theme", "style", "layout", "design"):
        return (
            f"We can restyle {where} using the brand green tokens (--green-600, "
            "--green-100). Do you want a different accent, spacing, or card layout?"
        )

    if has("connector", "api", "mcp", "integrat"):
        return (
            f"To connect {where} to a live source, point its run step at one of your "
            "Connectors (MCP or REST) instead of the simulated response. Which "
            "connector should it use?"
        )

    if has("validate", "required", "rule", "logic"):
        return (
            f"I can adjust the logic on {where}. Tell me the rule — e.g. 'make the "
            "date required' or 'reject charges over $10,000' — and I'll wire it in."
        )

    # Default: acknowledge and ask a focused follow-up.
    return (
        f"Understood — you want to change {where}: “{message.strip()}”. "
        "I'll scope that to this screen. Can you confirm the exact fields or copy "
        "involved so I can make the precise edit?"
    )
