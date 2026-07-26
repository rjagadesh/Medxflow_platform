import json
import requests
from django.conf import settings
import google.generativeai as genai
from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import date

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

def process_conversation_prompt(conversation_data, input_json):
    prompt = f"""
You are a backend conversational AI processor.

IMPORTANT RULES (STRICT – NO EXCEPTIONS):

1. Use ONLY the provided conversation text.
2. Do NOT infer missing information.
3. Do NOT assume intent if unclear.
4. If required information is missing, mark action_required as false.
5. Prefer NO ACTION over wrong action.
6. Confidence must be between 0 and 1.
7. Entities must be extracted ONLY if explicitly stated.
8. Dates must be returned in MM-DD-YYYY format.
9. Output MUST be valid JSON.
10. Do NOT include markdown, comments, or explanations.

CURRENT DATE (use only if explicitly mentioned):
{date.today().strftime('%m-%d-%Y')}

CONVERSATION TEXT:
{conversation_data}

INPUT JSON (context only, not source of truth):
{json.dumps(input_json)}

RETURN THIS STRUCTURE EXACTLY:

{{
  "status": "success",
  "entities": {{}},
  "conversation_summary": "string",
  "action_required": true | false,
  "action_type": "CREATE_APPOINTMENT | CANCEL_APPOINTMENT | UPDATE_APPOINTMENT | NONE",
  "validation_notes": "string"
}}
"""
    return prompt

def call_gemini(conversation_data, input_json):
    generation_config = {
        "temperature": 0,
        "response_mime_type": "application/json"
    }

    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        generation_config=generation_config
    )

    prompt = process_conversation_prompt(conversation_data, input_json)

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Safety cleanup
        if "```" in response_text:
            response_text = response_text.split("```")[1].replace("json", "").strip()

        result = json.loads(response_text)
        result["status"] = "success"
        return result

    except json.JSONDecodeError:
        return {
            "status": "partial_success",
            "error": "Invalid JSON returned by model",
            "raw_response": response_text
        }

    except Exception as e:
        return {
            "status": "error",
            "error_message": str(e)
        }