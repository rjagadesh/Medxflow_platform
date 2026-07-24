"""
Simulated Availity-style 270/271 coverage lookup.

Given member/payer/service-type input, ``run_check`` returns a deterministic
coverage result normalised into the same shape the Availity portal renders:
a coverage/plan header plus a per-service-type benefit table with in-network and
out-of-network copay / coinsurance / deductible-remaining / OOP-remaining and
auth/referral requirements. Deterministic (seeded by member+payer) so the same
member always returns the same result. Swap ``run_check`` for a real Availity
call to go live — the returned shape is unchanged.
"""
import hashlib
import random

# EDI service-type codes surfaced in the UI.
SERVICE_TYPES = [
    {"code": "30", "label": "Health Benefit Plan Coverage (general)"},
    {"code": "98", "label": "Professional (Physician) Visit — Office"},
    {"code": "UC", "label": "Urgent Care"},
    {"code": "86", "label": "Emergency Services"},
    {"code": "47", "label": "Hospital — Inpatient"},
    {"code": "50", "label": "Hospital — Outpatient"},
    {"code": "MH", "label": "Mental Health"},
    {"code": "PT", "label": "Physical Therapy"},
    {"code": "35", "label": "Dental Care"},
    {"code": "AL", "label": "Vision (Optometry)"},
    {"code": "88", "label": "Pharmacy"},
    {"code": "AD", "label": "Diagnostic Lab"},
]
_ST_LABEL = {s["code"]: s["label"] for s in SERVICE_TYPES}

# A small payer directory for search / auto-fill of payerId.
PAYERS = [
    {"payerId": "60054", "name": "Aetna"},
    {"payerId": "62308", "name": "Cigna"},
    {"payerId": "87726", "name": "UnitedHealthcare"},
    {"payerId": "47198", "name": "Anthem Blue Cross Blue Shield"},
    {"payerId": "84980", "name": "BCBS Illinois"},
    {"payerId": "61101", "name": "Humana"},
    {"payerId": "68069", "name": "Oscar Health"},
    {"payerId": "14163", "name": "Wellcare"},
    {"payerId": "39026", "name": "Molina Healthcare"},
    {"payerId": "25133", "name": "Kaiser Permanente"},
    {"payerId": "22099", "name": "Ambetter"},
    {"payerId": "95567", "name": "Devoted Health"},
]


def search_payers(q):
    q = (q or "").strip().lower()
    if not q:
        return PAYERS[:8]
    return [p for p in PAYERS if q in p["name"].lower() or q in p["payerId"]][:12]


def _rng(member_id, payer_id):
    seed = f"{member_id}|{payer_id}"
    return random.Random(int(hashlib.sha256(seed.encode()).hexdigest()[:12], 16))


def _benefit_row(code, rng, deductible_ind, ded_met, oop_max, oop_met):
    """One service-type row with in-network and out-of-network cost shares."""
    copay_in = rng.choice([0, 15, 20, 25, 30, 40, 50])
    coins_in = rng.choice([0, 10, 20, 30])
    coins_oon = min(coins_in + rng.choice([10, 20, 30]), 60)
    auth = code in ("47", "50", "86", "MH") and rng.random() > 0.4
    referral = code in ("98", "MH", "PT") and rng.random() > 0.6
    visit_codes = {"PT": "20 visits/yr", "MH": "30 visits/yr", "AL": "1 exam/yr"}
    return {
        "code": code,
        "label": _ST_LABEL.get(code, code),
        "in_network": {
            "copay": f"${copay_in}" if copay_in else "$0",
            "coinsurance": f"{coins_in}%",
            "deductible_remaining": f"${max(0, deductible_ind - ded_met):,}",
            "oop_remaining": f"${max(0, oop_max - oop_met):,}",
            "auth_required": "Yes" if auth else "No",
            "referral_required": "Yes" if referral else "No",
        },
        "out_of_network": {
            "copay": f"${copay_in + rng.choice([20, 30, 40])}",
            "coinsurance": f"{coins_oon}%",
            "deductible_remaining": f"${max(0, deductible_ind * 2 - ded_met):,}",
            "oop_remaining": f"${max(0, oop_max * 2 - oop_met):,}",
            "auth_required": "Yes" if auth else "No",
            "referral_required": "Yes" if referral else "No",
        },
        "visit_limit": visit_codes.get(code),
    }


def run_check(payload):
    """Return a dict of coverage + benefits for the given input payload."""
    member_id = payload.get("member_id") or "MEMBER123"
    payer_id = payload.get("payer_id") or payload.get("payer") or "00000"
    rng = _rng(member_id, payer_id)

    codes = payload.get("service_types") or ["30", "98"]
    active = rng.random() > 0.1
    plan_type = rng.choice(["PPO", "HMO", "EPO", "POS"])
    subscriber = rng.choice(["Self", "Spouse", "Dependent"])
    deductible_ind = rng.choice([500, 1000, 1500, 2500, 5000])
    ded_met = rng.randint(0, deductible_ind)
    oop_max = rng.choice([3000, 5000, 8000, 10000])
    oop_met = rng.randint(0, oop_max)

    benefits = [_benefit_row(c, rng, deductible_ind, ded_met, oop_max, oop_met) for c in codes]

    # Top-level normalized snapshot (used by AI + summary rows), from the first row.
    first = benefits[0]["in_network"] if benefits else {}
    normalized = {
        "copay": first.get("copay"),
        "coinsurance": first.get("coinsurance"),
        "deductible_individual": f"${deductible_ind:,}",
        "deductible_remaining": f"${max(0, deductible_ind - ded_met):,}",
        "oop_max": f"${oop_max:,}",
        "oop_remaining": f"${max(0, oop_max - oop_met):,}",
        "authorization_required": any(b["in_network"]["auth_required"] == "Yes" for b in benefits),
        "referral_required": any(b["in_network"]["referral_required"] == "Yes" for b in benefits),
    }

    payer_name = payload.get("payer") or next((p["name"] for p in PAYERS if p["payerId"] == payer_id), "Payer")

    return {
        "coverage_status": "Active" if active else "Inactive",
        "plan_type": plan_type,
        "plan_name": f"{payer_name} {plan_type}",
        "group_number": payload.get("group_number") or f"GRP{rng.randint(10000, 99999)}",
        "subscriber": subscriber,
        "effective_date": "01/01/2026",
        "termination_date": rng.choice(["", "", "12/31/2026"]),
        "benefits": benefits,
        "normalized": normalized,
    }
