"""
Simulated VOB call pipeline.

The original module places a real outbound call (Twilio -> LiveKit -> Deepgram/
GPT), navigates the payer IVR with DTMF, talks to a live rep, and extracts
verification-of-benefits data live. That telephony stack can't run here, so this
module *simulates* a completed call deterministically: given the member info it
produces a realistic IVR-then-human transcript, extracts VOB fields with
confidence scores, and makes the auto-push / flag-for-review decision.

Swap ``simulate_call`` for a real dispatch to go live; the data shape is the
same one the UI already renders.
"""
import hashlib
import random


def _rng(call):
    seed = f"{call.member_id}|{call.payer}|{call.patient_name}"
    return random.Random(int(hashlib.sha256(seed.encode()).hexdigest()[:12], 16))


def _turn(speaker, text, kind="speech"):
    return {"speaker": speaker, "text": text, "kind": kind}


def simulate_call(call):
    """Return (transcript, vob_data, confidence, decision, mode, recording_url)."""
    rng = _rng(call)
    payer = call.payer or "the payer"
    name = call.patient_name or "the patient"
    npi = call.npi or "1234567890"
    member = call.member_id or "MEMBER123"

    # --- IVR navigation phase (DTMF, no small talk) ---
    transcript = [
        _turn("system", f"Dialing {payer} at {call.insurance_phone or '1-800-000-0000'}…", "status"),
        _turn("system", "Call connected — starting in IVR mode.", "status"),
        _turn("ivr", "Thank you for calling. For claims say or press 1, for eligibility and benefits press 2."),
        _turn("agent", "Pressed 2", "dtmf"),
        _turn("ivr", "Please enter the 10-digit provider NPI followed by the pound key."),
        _turn("agent", f"Entered NPI {npi} #", "dtmf"),
        _turn("ivr", "Please enter the member ID."),
        _turn("agent", f"Entered member ID {member} #", "dtmf"),
        _turn("ivr", "Please hold while we connect you to a representative."),
        _turn("system", "Detected a live representative — switching to conversational mode.", "mode"),
    ]

    # --- Human conversation phase ---
    transcript += [
        _turn("rep", "Thank you for holding, this is Karen. How can I help you today?"),
        _turn("agent", f"Hi Karen, this is Sarah Miller from Droidal Health. I'm verifying benefits for {name}, member ID {member}."),
        _turn("rep", "Sure, let me pull that up. Can you confirm the date of birth?"),
        _turn("agent", f"Yes, it's {call.dob or '01/01/1980'}."),
        _turn("rep", "Great, I have the member. What would you like to verify?"),
    ]

    # --- VOB extraction (deterministic) ---
    active = rng.random() > 0.05
    ded_ind = rng.choice([500, 1000, 1500, 2500])
    ded_met = rng.randint(0, ded_ind)
    oop = rng.choice([3000, 5000, 8000])
    oop_met = rng.randint(0, oop)
    copay = rng.choice([20, 30, 40, 50])
    coins = rng.choice([10, 20, 30])
    prior_auth = rng.choice(["Not required", "Required"])
    in_network = rng.choice(["In-network", "In-network", "Out-of-network"])
    plan_type = rng.choice(["PPO", "HMO", "EPO", "POS"])

    def conf():
        return round(rng.uniform(0.85, 0.99), 2)

    vob = {
        "eligibility": {"value": "Active" if active else "Inactive", "confidence": conf()},
        "plan_type": {"value": plan_type, "confidence": conf()},
        "in_network": {"value": in_network, "confidence": conf()},
        "deductible_individual": {"value": f"${ded_ind:,}", "confidence": conf()},
        "deductible_met": {"value": f"${ded_met:,}", "confidence": conf()},
        "out_of_pocket_max": {"value": f"${oop:,}", "confidence": conf()},
        "out_of_pocket_met": {"value": f"${oop_met:,}", "confidence": conf()},
        "copay": {"value": f"${copay}", "confidence": conf()},
        "coinsurance": {"value": f"{coins}%", "confidence": conf()},
        "prior_auth": {"value": prior_auth, "confidence": conf()},
        "effective_date": {"value": "01/01/2026", "confidence": conf()},
    }

    for field, data in [
        ("eligibility", "Yes, the plan is active and effective January 1st, 2026."),
        ("deductible_individual", f"The individual deductible is ${ded_ind:,}, and ${ded_met:,} has been met."),
        ("copay", f"The specialist copay is ${copay}."),
        ("coinsurance", f"Coinsurance is {coins}% after the deductible."),
        ("prior_auth", f"Prior authorization is {prior_auth.lower()} for that service."),
    ]:
        transcript.append(_turn("agent", f"And the {field.replace('_', ' ')}?"))
        transcript.append(_turn("rep", data))

    transcript += [
        _turn("agent", "Perfect, let me read that back to confirm…"),
        _turn("rep", "That's all correct."),
        _turn("agent", "Thank you so much for your help, Karen. Have a great day."),
        _turn("system", "Call ended.", "status"),
    ]

    # Overall confidence + decision (auto-push >= 0.92).
    confidence = round(sum(v["confidence"] for v in vob.values()) / len(vob), 2)
    decision = "Auto-pushed to EHR" if confidence >= 0.92 else "Flagged for human review"
    recording_url = f"https://recordings.eirim.io/vob/{_rng(call).randint(10**7, 10**8)}.mp3"

    return transcript, vob, confidence, decision, "human", recording_url
