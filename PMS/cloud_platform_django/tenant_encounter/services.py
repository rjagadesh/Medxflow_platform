from django.db import transaction
from django.utils import timezone
from tenant_claim_submission.models import Claim
import google.generativeai as genai
from datetime import datetime,date
import json
from pathlib import Path
import os
from dotenv import load_dotenv
from payment_posting.models import PaymentLedger

# API_KEY is read from the GEMINI_API_KEY environment variable (see below)
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

@transaction.atomic
def create_claim_from_encounter(encounter):
    service_lines = encounter.service_lines.all()
    
    if not service_lines.exists():
        raise Exception("Encounter has no service lines to submit")

    created_claims = []

    for esl in service_lines:
        claim_number = f"CLM-{timezone.now().strftime('%Y%m%d%H%M%S')}-{esl.id}"
        if not esl.is_voided:
            claim = Claim.objects.create(
                encounter=encounter,
                claim_number=claim_number,

                claim_type="837P",
                status="submitted",

                # total_charge=esl.total_charge,
                balance_due=esl.total_charge,

                submitted_at=timezone.now(),

                # service line data
                procedure_code=esl.procedure_code,
                modifiers=esl.modifiers,
                units=esl.units,
                charge_amount=esl.total_charge,
                allowed = esl.total_charge,
                paid = 0.00, 

                diagnosis_pointers=esl.diag_pointers,
                rendering_provider=esl.rendering_provider or encounter.rendering_provider,

                date_from=esl.date_from,
                date_to=esl.date_to
            )

        # amount = esl.total_charge
        # amount = amount * -1 
        # ledger = PaymentLedger.objects.create(
        #     claim=claim,
        #     entry_type="CLAIMS",          # or whatever makes sense initially
        #     responsibility_type="PATIENT",  # optional, depends on flow
        #     claim_line_id=esl.id,
        #     amount = amount           
        # )
        created_claims.append(claim)

        # payment ledger  claim id ,total_charge is in minus ,entry type = payment,responsibility type = patient ,source = claims

    return created_claims

# @transaction.atomic
# def create_claim_from_encounter(encounter):
#     if hasattr(encounter, "submitted_claim"):
#         return encounter.submitted_claim  # safety guard

#     claim = Claim.objects.create(
#         encounter=encounter,
#         claim_number=f"CLM-{timezone.now().strftime('%Y%m%d%H%M%S')}",

#         claim_type="837P",
#         status="submitted",
#         total_charge=encounter.total_charges,
#         balance_due=encounter.total_charges,
#         submitted_at=timezone.now(),
#         procedure_code = encounter.procedure_code,
#         modifiers = encounter.modifiers,
#         units = encounter.units,
#         charge_amount = encounter.total_charge,
#         diagnosis_pointers = encounter.diag_pointers,
#         rendering_provider = encounter.rendering_provider,
#         date_from = encounter.date_from,
#         date_to = encounter.date_to
#     )

    # for esl in encounter.service_lines.all():
    #     ClaimServiceLine.objects.create(
    #         claim=claim,
    #         procedure_code=esl.procedure_code,
    #         modifiers=esl.modifiers,
    #         units=esl.units,
    #         charge_amount=esl.total_charge,
    #         diagnosis_pointers=esl.diag_pointers,
    #         rendering_provider=esl.rendering_provider or encounter.rendering_provider,
    #         date_from=esl.date_from,
    #         date_to=esl.date_to,
    #     )

    # return claim


def extract_clinical_summary(section_notes):
    summary = []

    for section, data in section_notes.items():
        note_text = data.get('note', '').strip()
        generated_note = data.get('generated_note', '').strip()
        combined_note = f"{note_text}\n{generated_note}".strip()

        if combined_note:
            summary.append({
                "section": section,
                "from_date": data.get("from", ""),
                "to_date": data.get("to", ""),
                "note": combined_note
            })

    return summary


def get_cpt_codes_from_notes(input_data):
    section_notes = input_data.get('section notes', {})
    clinical_summary = extract_clinical_summary(section_notes)

    generation_config = {
        "temperature": 0,
        "response_mime_type": "application/json"
    }

    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        generation_config=generation_config
    )


    prompt = f"""
    You are a certified medical coder.

    IMPORTANT RULES (STRICT – NO EXCEPTIONS):

    1. Only return CPT codes that are EXPLICITLY DOCUMENTED in the clinical text.
    2. DO NOT infer, assume, predict, or extrapolate any service.
    3. If documentation is ambiguous, incomplete, or future-dated, EXCLUDE the code.
    4. Prefer UNDER-CODING over over-coding.
    5. Every CPT code MUST have:
    - Direct textual evidence copied from the notes
    - Clear justification tied to that evidence
    6. If a CPT code cannot be supported with certainty, DO NOT include it.
    7. Do NOT include “possible”, “likely”, or “suggested” services.
    8. Do NOT add modifiers unless explicitly required by the documentation.
    9. Do NOT add diagnosis codes unless explicitly stated in the text.
    10. Ignore orders marked as “Future”.

    DATE RULES:
    - If a section contains a documented encounter date, use it.
    - Otherwise, use this Current date for BOTH from_date and to_date: {date.today().strftime('%m-%d-%Y')}

    CLINICAL SECTIONS (verbatim source of truth):
    {clinical_summary}

    OUTPUT FORMAT RULES:
    - Output STRICT JSON only
    - No markdown
    - No explanations outside JSON
    - No empty fields
    - Use arrays for modifier and diagnosis_code ONLY if more than one exists

    RETURN THIS STRUCTURE EXACTLY:

    {{
    "encounter_type": "Office Visit - Established Patient",
    "Cpt_codes": [
        {{
        "cpt": "Cpt Code",
        "from_date": "MM-DD-YYYY",
        "to_date": "MM-DD-YYYY",
        "modifier": "Modifier Codes(if applicable)",
        "diagnosis_code": "ICD-10 Diagnosis Codes(if applicable)",
        "description": "string",
        "category": "E&M | Procedure | Lab | Imaging",
        "reasoning": "Why this CPT is valid based only on the evidence"
        }}
    ],
    "complexity_level": "low | moderate | high",
    "documentation_notes": "Any exclusions or limitations"
    }}
    """

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        if "```" in response_text:
            response_text = response_text.split("```")[1].replace("json", "").strip()

        result = json.loads(response_text)
        result["status"] = "success"
        return result

    except json.JSONDecodeError:
        return {
            "status": "partial_success",
            "error": "Model response was not valid JSON",
            "raw_response": response_text
        }

    except Exception as e:
        return {
            "status": "error",
            "error_message": str(e)
        }

#     section_notes = input_data.get('section notes', {})
#     clinical_summary = extract_clinical_summary(section_notes)

#     model = genai.GenerativeModel('gemini-2.0-flash')

#     prompt = f"""
# You are an expert medical coder specializing in CPT coding.

# Analyze the following clinical encounter sections.
# Add from_date and to_date as mentioned in notes.
# If not present, use current date as from_date and current date as to_date 
# Current Date is {datetime.now().strftime("%m/%d/%Y")}


# CLINICAL SECTIONS:
# {json.dumps(clinical_summary, indent=2)}

# CODING INSTRUCTIONS:
# 1. Identify all applicable CPT codes
# 2. Add modifiers if appropriate (e.g., 25, RT, etc.) based on context if 2 and 3 are applicable include that in a list
# 3. Add dignose code if applicable if more than dignose code is provided, include that in a list
# 4. Do NOT assume services not documented

# OUTPUT STRICT JSON ONLY:
# {{
#   "encounter_type": "Office Visit - Established Patient",
#   "Cpt_codes": [
#     {{
#       "cpt": "CPT code",
#       "from_date": "MM-DD-YYYY",
#       "to_date": "MM-DD-YYYY",
#       "modifier": "modifier code", (if applicable)
#       "dignose_code": "ICD code", (if applicable)
#       "description": "Description",
#       "category": "E&M/Procedure/Lab/Imaging/etc",
#       "reasoning": "Why this code applies"
#     }}
#   ],
#   "complexity_level": "low/moderate/high",
#   "documentation_notes": "string"
# }}
# """

#     try:
#         response = model.generate_content(prompt)
#         response_text = response.text.strip()

#         if "```" in response_text:
#             response_text = response_text.split("```")[1].replace("json", "").strip()

#         result = json.loads(response_text)
#         result["status"] = "success"
#         return result

#     except json.JSONDecodeError:
#         return {
#             "status": "partial_success",
#             "error": "Model response was not valid JSON",
#             "raw_response": response_text
#         }

#     except Exception as e:
#         return {
#             "status": "error",
#             "error_message": str(e)
#         }


if __name__ == "__main__":
    # Example usage 
    sample_input = {
        "section notes": {
            "CC": {
                "note": "Chronic knee pain, diabetes follow-up, face-to-face visit.",
                "updated_at": "2026-02-05",
                "updated_by": 2,
                "from": "02-04-2026",
                "to": "02-05-2026",
                "selected_ids": []
            },
            "Vitals": {
                "note": "",
                "updated_at": "2026-02-05",
                "updated_by": 2,
                "from": "02-04-2026",
                "to": "02-05-2026",
                "selected_ids": [1],
                "generated_note": "Recorded: 04 Feb 2026 11:10 AM, BP: 138/84, HR: 76, RR: 18, Temp: 98.4°F, Height: 5' 6\", Weight: 172 lbs, BMI: 27.8, SpO2: 97%"
            },
            "Allergies": {
                "note": "",
                "updated_at": "2026-02-05",
                "updated_by": 2,
                "from": "02-04-2026",
                "to": "02-05-2026",
                "selected_ids": [1, 2],
                "generated_note": "Penicillin, Reaction: Hives, Severity: severe\nIbuprofen, Reaction: GI upset, Severity: moderate"
            },
            "Assessment": {
                "note": (
                    "Type 2 diabetes mellitus without complications\n"
                    "HbA1c; Future\n"
                    "Chronic pain of both knees\n"
                    "XR Knee Bilateral 3 Views; Future\n"
                    "Primary osteoarthritis of knee, bilateral\n"
                    "-triamcinolone acetonide (KENALOG-40) injection 40 mg intra-articular\n"
                    "Other orders\n"
                    "-Physical therapy referral\n\n"
                    "Diagnosis Codes:\n"
                    "E11.9 – Type 2 diabetes mellitus without complications\n"
                    "M17.0 – Bilateral primary osteoarthritis of knee\n"
                    "M25.561 – Pain in right knee\n\n"
                    "Applicable Modifiers:\n"
                    "-25 – Significant, separately identifiable E/M service\n"
                    "-50 – Bilateral procedure\n"
                    "-RT / -LT – Right and Left knee injections"
                ),
                "updated_at": "2026-02-05",
                "updated_by": 2,
                "from": "02-04-2026",
                "to": "02-05-2026",
                "selected_ids": []
            },
            "Subjective": {
                "note": (
                    "Robert J Miller is a 62yr male who presents today for follow-up of diabetes "
                    "and evaluation of chronic bilateral knee pain. The patient reports worsening "
                    "knee pain over the past 6 months, aggravated by walking and climbing stairs. "
                    "Pain is present in both knees, right worse than left. He denies recent trauma. "
                    "He has a known history of type 2 diabetes, currently managed with oral medications. "
                    "No episodes of hypoglycemia reported. Denies chest pain, shortness of breath, "
                    "or dizziness. He is requesting pain relief options and imaging evaluation."
                ),
                "updated_at": "2026-02-05",
                "updated_by": 2,
                "from": "02-04-2026",
                "to": "02-05-2026",
                "selected_ids": []
            },
            "Medications": {
                "note": "",
                "updated_at": "2026-02-05",
                "updated_by": 2,
                "from": "02-04-2026",
                "to": "02-05-2026",
                "selected_ids": [1],
                "generated_note": (
                    "Metformin 500 mg Tablet – Take 1 tablet by mouth twice daily with meals\n"
                    "Acetaminophen 650 mg – Take every 6 hours as needed for knee pain"
                )
            }
        }
    }

    print("Extracting CPT codes...")

    result = get_cpt_codes_from_notes(sample_input)
    print(result)


    with open('cpt_codes.json', 'w') as f:
        json.dump(result, f, indent=4)
 

