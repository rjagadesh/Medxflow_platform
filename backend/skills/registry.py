"""
Skill registry — the heart of the "everything is input -> output" concept.

Each skill declares:
  * metadata (slug, name, description, category, icon)
  * an ordered list of input fields (drives the UI form automatically)
  * a ``run(data, context)`` function that returns a structured output

Skills here simulate real healthcare RCM integrations (eligibility, prior-auth,
referrals, claims, telehealth) with **deterministic** results — the same input
always yields the same output — so the flow is demonstrable end-to-end without a
live payer connection. Swap a ``run`` body for a real API/MCP call to go live.
"""
from dataclasses import dataclass, field
import hashlib
import random
from datetime import timedelta

from django.utils import timezone


@dataclass
class InputField:
    name: str
    label: str
    type: str = "text"  # text | number | date | select | textarea | connector
    required: bool = True
    options: list = field(default_factory=list)
    placeholder: str = ""


@dataclass
class Skill:
    slug: str
    name: str
    description: str
    category: str
    icon: str
    inputs: list
    run: callable

    def as_dict(self):
        return {
            "slug": self.slug,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "icon": self.icon,
            "inputs": [
                {
                    "name": f.name,
                    "label": f.label,
                    "type": f.type,
                    "required": f.required,
                    "options": f.options,
                    "placeholder": f.placeholder,
                }
                for f in self.inputs
            ],
        }


REGISTRY: dict[str, Skill] = {}


def register(skill: Skill):
    REGISTRY[skill.slug] = skill
    return skill


# --------------------------------------------------------------------------
# Deterministic helpers — outputs are stable per-input (seeded by a hash).
# --------------------------------------------------------------------------
def _rng(data: dict) -> random.Random:
    seed = hashlib.sha256(
        "|".join(f"{k}={v}" for k, v in sorted(data.items())).encode()
    ).hexdigest()
    return random.Random(int(seed[:12], 16))


def _ref(rng, prefix, digits=8):
    return prefix + "".join(str(rng.randint(0, 9)) for _ in range(digits))


def _out(status, headline, fields, meta=None):
    return {"status": status, "headline": headline, "fields": fields, "meta": meta or {}}


# --------------------------------------------------------------------------
# Skill implementations
# --------------------------------------------------------------------------
def _eligibility(data, context):
    rng = _rng(data)
    eligible = rng.random() > 0.15
    copay = rng.choice([0, 10, 20, 25, 35, 50])
    deductible_total = rng.choice([500, 1000, 1500, 2000])
    deductible_met = rng.randint(0, deductible_total)
    if eligible:
        return _out(
            "success",
            "Active coverage — member is eligible",
            [
                {"label": "Eligibility", "value": "Active"},
                {"label": "Plan", "value": data.get("payer", "—")},
                {"label": "Copay", "value": f"${copay}"},
                {"label": "Deductible met", "value": f"${deductible_met} of ${deductible_total}"},
                {"label": "Service type", "value": data.get("service_type", "—")},
                {"label": "Verified on", "value": timezone.now().date().isoformat()},
            ],
        )
    return _out(
        "error",
        "Coverage not active for the service date",
        [
            {"label": "Eligibility", "value": "Inactive"},
            {"label": "Reason", "value": "Policy not effective on service date"},
            {"label": "Member ID", "value": data.get("member_id", "—")},
        ],
    )


def _prior_auth(data, context):
    rng = _rng(data)

    # An appeal submission with additional clinical documentation (feature #4).
    if data.get("_appeal"):
        overturned = rng.random() > 0.4
        if overturned:
            return _out(
                "success",
                "Appeal successful — authorization approved",
                [
                    {"label": "Decision", "value": "Approved on appeal"},
                    {"label": "Authorization #", "value": _ref(rng, "PA")},
                    {"label": "Basis", "value": "Reviewed additional clinical documentation"},
                    {"label": "Documentation", "value": (data.get("appeal_documentation") or "—")[:120]},
                ],
            )
        return _out(
            "error",
            "Appeal upheld — denial stands",
            [
                {"label": "Decision", "value": "Denied on appeal"},
                {"label": "Next steps", "value": "Escalate to a peer-to-peer review."},
            ],
        )

    roll = rng.random()
    if roll > 0.7:
        decision, status = "Approved", "success"
    elif roll > 0.3:
        decision, status = "Pended — clinical review", "warning"
    else:
        decision, status = "Denied", "error"
    valid_from = timezone.now().date()
    valid_to = valid_from + timedelta(days=90)
    fields = [
        {"label": "Decision", "value": decision},
        {"label": "Authorization #", "value": _ref(rng, "PA")},
        {"label": "Procedure (CPT)", "value": data.get("cpt_code", "—")},
        {"label": "Diagnosis (ICD-10)", "value": data.get("diagnosis_code", "—")},
    ]
    if status == "success":
        fields += [
            {"label": "Valid from", "value": valid_from.isoformat()},
            {"label": "Valid to", "value": valid_to.isoformat()},
        ]
    output = _out(status, f"Prior authorization: {decision}", fields)
    # Pended/denied authorizations can be appealed with documentation.
    if status in ("warning", "error"):
        output["actions"] = [{"label": "Appeal with documentation", "kind": "appeal"}]
    return output


def _referral(data, context):
    rng = _rng(data)
    specialists = ["Dr. A. Chen", "Dr. M. Okoro", "Dr. L. Rossi", "Dr. S. Patel", "Dr. K. Nguyen"]
    days = rng.randint(2, 21)
    return _out(
        "success",
        "Referral created and matched",
        [
            {"label": "Referral #", "value": _ref(rng, "REF")},
            {"label": "Specialty", "value": data.get("specialty", "—")},
            {"label": "Matched specialist", "value": rng.choice(specialists)},
            {"label": "Earliest appointment", "value": (timezone.now().date() + timedelta(days=days)).isoformat()},
            {"label": "Status", "value": "Pending acceptance"},
            {"label": "Referring provider", "value": data.get("referring_provider", "—")},
        ],
    )


def _claim(data, context):
    rng = _rng(data)
    accepted = rng.random() > 0.2
    try:
        charge = float(data.get("charge_amount", 0) or 0)
    except (TypeError, ValueError):
        charge = 0.0
    reimb = round(charge * rng.uniform(0.55, 0.85), 2)
    if accepted:
        return _out(
            "success",
            "Claim accepted by clearinghouse",
            [
                {"label": "Claim #", "value": _ref(rng, "CLM", 10)},
                {"label": "Status", "value": "Accepted (277CA)"},
                {"label": "Payer", "value": data.get("payer", "—")},
                {"label": "Billed", "value": f"${charge:,.2f}"},
                {"label": "Est. reimbursement", "value": f"${reimb:,.2f}"},
                {"label": "CPT codes", "value": data.get("cpt_codes", "—")},
            ],
        )
    return _out(
        "error",
        "Claim rejected — needs correction",
        [
            {"label": "Claim #", "value": _ref(rng, "CLM", 10)},
            {"label": "Status", "value": "Rejected (277CA)"},
            {"label": "Reason", "value": rng.choice([
                "Missing modifier", "Invalid diagnosis pointer", "Member ID mismatch",
            ])},
            {"label": "Billed", "value": f"${charge:,.2f}"},
        ],
    )


def _telehealth(data, context):
    rng = _rng(data)
    room = _ref(rng, "room-", 6).lower()
    return _out(
        "success",
        "Telehealth session scheduled",
        [
            {"label": "Session #", "value": _ref(rng, "TH")},
            {"label": "Join link", "value": f"https://visit.eirim.io/{room}"},
            {"label": "Patient", "value": data.get("patient_name", "—")},
            {"label": "Provider", "value": data.get("provider", "—")},
            {"label": "When", "value": data.get("appointment_datetime", "—")},
            {"label": "Status", "value": "Confirmed"},
        ],
    )


# Common denial reason codes -> (meaning, suggested correction, status).
DENIAL_CORRECTIONS = {
    "CO-16": ("Claim/service lacks information", "Attach the missing documentation, then resubmit.", "warning"),
    "CO-97": ("Service bundled into another", "Append modifier 59 to unbundle, or remove the line.", "warning"),
    "CO-11": ("Diagnosis inconsistent with procedure", "Correct the ICD-10 to support the CPT, then resubmit.", "warning"),
    "CO-4": ("Procedure missing a required modifier", "Add the required modifier, then resubmit.", "warning"),
    "PR-1": ("Deductible amount (patient responsibility)", "Bill the member — do not resubmit.", "error"),
    "CO-18": ("Duplicate claim or service", "Verify the original claim status — do not resubmit.", "error"),
}


def _denial_management(data, context):
    rng = _rng(data)
    claim_id = data.get("claim_id", "—")
    code = (data.get("denial_reason_code", "") or "").upper().strip()

    # A corrected resubmission (triggered by the Resubmit action on a run).
    if data.get("_resubmit"):
        return _out(
            "success",
            "Corrected claim resubmitted — accepted",
            [
                {"label": "Claim / Auth #", "value": claim_id},
                {"label": "Resubmission #", "value": _ref(rng, "RSB", 8)},
                {"label": "Status", "value": "Accepted (277CA)"},
                {"label": "Payer", "value": data.get("payer", "—")},
                {"label": "Original denial", "value": code or "—"},
            ],
        )

    meaning, correction, status = DENIAL_CORRECTIONS.get(
        code, ("Unrecognised denial reason", "Route to a specialist for manual review.", "warning")
    )
    fields = [
        {"label": "Claim / Auth #", "value": claim_id},
        {"label": "Denial reason", "value": f"{code or '—'} — {meaning}"},
        {"label": "Payer", "value": data.get("payer", "—")},
        {"label": "Suggested correction", "value": correction},
        {"label": "Recommended action", "value": "Resubmit with correction" if status == "warning" else "Appeal or member bill"},
    ]
    output = _out(
        status,
        "Denial triaged — correction suggested" if status == "warning" else "Denial not auto-correctable",
        fields,
    )
    # Correctable denials expose a one-click resubmit action in the output.
    if status == "warning":
        output["actions"] = [
            {"label": "Resubmit corrected claim", "kind": "resubmit", "params": {"_resubmit": "1"}}
        ]
    return output


def _claim_status(data, context):
    rng = _rng(data)
    roll = rng.random()
    if roll > 0.55:
        state, status = "Paid", "success"
    elif roll > 0.30:
        state, status = "In process", "success"
    elif roll > 0.12:
        state, status = "Pended — additional information required", "warning"
    else:
        state, status = "Denied", "error"

    billed = rng.choice([180, 220, 320, 540, 1250])
    fields = [
        {"label": "Claim #", "value": data.get("claim_id", "—")},
        {"label": "Member ID", "value": data.get("member_id", "—")},
        {"label": "Status", "value": state},
        {"label": "Billed", "value": f"${billed:,.2f}"},
    ]

    if state == "Paid":
        paid = round(billed * rng.uniform(0.6, 0.85), 2)
        fields += [
            {"label": "Paid", "value": f"${paid:,.2f}"},
            {"label": "Patient responsibility", "value": f"${billed - paid:,.2f}"},
            {"label": "Payer response", "value": "Claim adjudicated and paid."},
            {"label": "Next steps", "value": "Post the payment (ERA) and close the claim."},
        ]
    elif state == "In process":
        fields += [
            {"label": "Payer response", "value": "Claim received and under review."},
            {"label": "Next steps", "value": "No action needed — check back in 3–5 business days."},
        ]
    elif state.startswith("Pended"):
        fields += [
            {"label": "Payer response", "value": "Additional documentation requested (medical records)."},
            {"label": "Next steps", "value": "Submit the requested records to release the claim."},
        ]
    else:  # Denied
        fields += [
            {"label": "Payer response", "value": rng.choice([
                "Non-covered service", "Timely filing exceeded", "Prior auth not on file",
            ])},
            {"label": "Next steps", "value": "Route to Denial Management for correction or appeal."},
        ]

    return _out(status, f"Claim status: {state}", fields)


def _era_reconciliation(data, context):
    rng = _rng(data)
    total_lines = rng.randint(4, 9)
    matched = rng.randint(max(1, total_lines - 3), total_lines)
    unmatched = total_lines - matched
    billed = round(rng.uniform(1200, 8000), 2)
    paid = round(billed * rng.uniform(0.7, 0.95), 2)
    variance = round(billed - paid, 2)
    status = "success" if unmatched == 0 else "warning"
    fields = [
        {"label": "ERA reference", "value": data.get("era_reference", "—")},
        {"label": "Line items", "value": str(total_lines)},
        {"label": "Matched", "value": str(matched)},
        {"label": "Unmatched", "value": str(unmatched)},
        {"label": "Billed", "value": f"${billed:,.2f}"},
        {"label": "Paid", "value": f"${paid:,.2f}"},
        {"label": "Variance", "value": f"${variance:,.2f}"},
        {"label": "Next steps", "value": (
            "All lines reconciled — post payments."
            if unmatched == 0
            else f"Review {unmatched} unmatched line(s) before posting."
        )},
    ]
    headline = "ERA fully reconciled" if unmatched == 0 else "ERA reconciled with exceptions"
    return _out(status, headline, fields)


# --------------------------------------------------------------------------
# Registration — declaring inputs here auto-builds each skill's UI form.
# --------------------------------------------------------------------------
register(Skill(
    slug="eligibility-verification",
    name="Eligibility Verification",
    description="Check a member's active coverage, copay and deductible in real time.",
    category="Workflows",
    icon="shield-check",
    inputs=[
        InputField("member_id", "Member ID", placeholder="e.g. ABC123456789"),
        InputField("payer", "Payer / Plan", placeholder="e.g. Aetna PPO"),
        InputField("service_type", "Service type", type="select",
                   options=["Office visit", "Imaging", "Surgery", "Lab", "Therapy"]),
        InputField("service_date", "Service date", type="date"),
        InputField("connector", "Run via connector", type="connector", required=False),
    ],
    run=_eligibility,
))

register(Skill(
    slug="prior-authorization",
    name="Prior Authorization",
    description="Submit and clear prior authorizations for procedures.",
    category="Workflows",
    icon="stamp",
    inputs=[
        InputField("member_id", "Member ID", placeholder="e.g. ABC123456789"),
        InputField("cpt_code", "Procedure code (CPT)", placeholder="e.g. 70551"),
        InputField("diagnosis_code", "Diagnosis (ICD-10)", placeholder="e.g. M54.5"),
        InputField("provider", "Ordering provider", placeholder="e.g. Dr. Smith"),
        InputField("connector", "Run via connector", type="connector", required=False),
    ],
    run=_prior_auth,
))

register(Skill(
    slug="referrals",
    name="Referrals",
    description="Create specialist referrals and match to the earliest availability.",
    category="Workflows",
    icon="share",
    inputs=[
        InputField("patient_name", "Patient name", placeholder="e.g. Jane Doe"),
        InputField("referring_provider", "Referring provider", placeholder="e.g. Dr. Lee"),
        InputField("specialty", "Specialty", type="select",
                   options=["Cardiology", "Orthopedics", "Dermatology", "Neurology", "GI"]),
        InputField("reason", "Reason", type="textarea", placeholder="Clinical reason for referral"),
    ],
    run=_referral,
))

register(Skill(
    slug="claim-submission",
    name="Claim Submission",
    description="Submit claims to the clearinghouse and track acceptance.",
    category="Workflows",
    icon="file-invoice",
    inputs=[
        InputField("patient_name", "Patient name", placeholder="e.g. Jane Doe"),
        InputField("payer", "Payer", placeholder="e.g. UnitedHealthcare"),
        InputField("cpt_codes", "CPT codes", placeholder="e.g. 99213, 93000"),
        InputField("charge_amount", "Charge amount (USD)", type="number", placeholder="e.g. 320"),
        InputField("connector", "Run via connector", type="connector", required=False),
    ],
    run=_claim,
))

register(Skill(
    slug="telehealth",
    name="Telehealth",
    description="Schedule a telehealth visit and generate a secure join link.",
    category="Workflows",
    icon="video",
    inputs=[
        InputField("patient_name", "Patient name", placeholder="e.g. Jane Doe"),
        InputField("provider", "Provider", placeholder="e.g. Dr. Smith"),
        InputField("appointment_datetime", "Date & time", placeholder="e.g. 2026-07-20 14:30"),
        InputField("reason", "Reason for visit", type="textarea", placeholder="Chief complaint"),
    ],
    run=_telehealth,
))

register(Skill(
    slug="denial-management",
    name="Denial Management",
    description="Triage claim denials, suggest a correction and resubmit.",
    category="Workflows",
    icon="retry",
    inputs=[
        InputField("claim_id", "Claim / Auth ID", placeholder="e.g. CLM0099123456"),
        InputField("denial_reason_code", "Denial reason code", placeholder="e.g. CO-16"),
        InputField("payer", "Payer", placeholder="e.g. Aetna"),
        InputField("connector", "Run via connector", type="connector", required=False),
    ],
    run=_denial_management,
))

register(Skill(
    slug="claim-status-inquiry",
    name="Claim Status Inquiry",
    description="Check the status of a previously submitted claim.",
    category="Workflows",
    icon="search",
    inputs=[
        InputField("claim_id", "Claim ID", placeholder="e.g. CLM0099123456"),
        InputField("member_id", "Member ID (optional)", placeholder="e.g. ABC123456789", required=False),
        InputField("date_from", "Service date from", type="date", required=False),
        InputField("date_to", "Service date to", type="date", required=False),
        InputField("connector", "Run via connector", type="connector", required=False),
    ],
    run=_claim_status,
))

register(Skill(
    slug="payment-posting",
    name="Payment Posting / ERA",
    description="Reconcile remittance advice (ERA) against submitted claims.",
    category="Workflows",
    icon="file-invoice",
    inputs=[
        InputField("era_reference", "ERA file reference", placeholder="e.g. ERA-2026-000123"),
        InputField("claim_id", "Claim ID (optional)", placeholder="e.g. CLM0099123456", required=False),
        InputField("connector", "Run via connector", type="connector", required=False),
    ],
    run=_era_reconciliation,
))
