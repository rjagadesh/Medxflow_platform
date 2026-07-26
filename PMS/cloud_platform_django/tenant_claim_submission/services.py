from django.core.exceptions import ValidationError
from django.utils import timezone
from tenant_encounter.models import Encounter
from .models import Claim
from django.utils import timezone
from django.db import transaction
from datetime import datetime
from typing import Dict, List, Optional
import re
import json

class X12Builder:
    """
    Minimal X12 segment builder
    """
    def __init__(self):
        self.segments = []

    def seg(self, *elements):
        clean = [str(e) if e is not None else "" for e in elements]
        self.segments.append("*".join(clean) + "~")

    def build(self):
        return "\n".join(self.segments)
    

class ClaimBuilderService:

    @staticmethod
    @transaction.atomic
    def build_from_encounter(encounter: Encounter) -> Claim:

        # ✅ If claim already exists
        existing_claim = getattr(encounter, "submitted_claim", None)
        if existing_claim:
            return existing_claim

        if encounter.do_not_bill:
            raise ValidationError("Encounter marked Do Not Bill")

        if encounter.service_lines.count() == 0:
            raise ValidationError("No service lines found")

        claim = Claim.objects.create(
            encounter=encounter,
            claim_number=f"CLM-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            total_charge=encounter.total_charges,
            balance_due=encounter.balance_due,
            status="ready"
        )

        for line in encounter.service_lines.all():
            provider = line.rendering_provider or encounter.rendering_provider
            if not provider:
                raise ValidationError(
                    f"Rendering provider missing for {line.procedure_code}"
                )

            # ClaimServiceLine.objects.create(
            #     claim=claim,
            #     procedure_code=line.procedure_code,
            #     modifiers=line.modifiers,
            #     units=line.units,
            #     charge_amount=line.total_charge,
            #     diagnosis_pointers=line.diag_pointers,
            #     rendering_provider=provider,
            #     date_from=line.date_from,
            #     date_to=line.date_to
            # )

        return claim

def transform_db_to_input(encounters_list):
    # """
    # Transforms the encounter JSON from your database into the format expected
    # by your existing 837P JSON-to-EDI converter (matching input_json.json structure).
    # Handles null appointment, empty fields, modifiers, diag pointers safely.
    # """

    # # Helper: format date to YYYYMMDD (if present)
    # def format_date(date_str):
    #     if not date_str:
    #         return ""
    #     try:
    #         return datetime.strptime(date_str, "%Y-%m-%d").strftime("%Y%m%d")
    #     except:
    #         return ""

    # def parse_diag_pointers(pointers_str):
    #     if not pointers_str:
    #         return []
    #     return [int(p) for p in str(pointers_str).strip() if p.isdigit()]

    # def parse_modifiers(mod_str):
    #     if not mod_str:
    #         return []
    #     return [m.strip() for m in str(mod_str).split(",") if m.strip()]

    # # Calculate total charge from service lines (since total_charges is often 0)
    # total_charge = sum(float(sl.get("total_charge", 0)) for sl in db_data.get("service_lines", []))

    # # Determine service date (use service_date_from, fallback to first service line)
    # service_date = db_data.get("service_date_from") or ""
    # if not service_date and db_data.get("service_lines"):
    #     first_line = db_data["service_lines"][0]
    #     service_date = first_line.get("date_from") or first_line.get("date_to") or ""

    # service_date_formatted = format_date(service_date)

    # # Extract diagnoses codes only (in order)
    # diagnosis_codes = [diag["icd_code"].replace(".", "") for diag in db_data.get("diagnoses", [])]

    # # Determine place of service - fallback to common telehealth/office
    # place_of_service = db_data.get("place_of_service_code") or "02"  # 02 = Telehealth, common default

    # # Rendering provider - fallback if null
    # rendering = db_data.get("rendering_provider") or {}
    # if db_data.get("service_lines") and db_data["service_lines"][0].get("rendering_provider"):
    #     rendering = db_data["service_lines"][0]["rendering_provider"]

    # rendering_provider = {
    #     "last_name": rendering.get("last_name", "UNKNOWN"),
    #     "first_name": rendering.get("first_name", "PROVIDER"),
    #     "middle_name": "",
    #     "npi": rendering.get("NPI", ""),
    #     "taxonomy": rendering.get("taxonomy") or "363LF0000X"  # common for NP/PA psych
    # }

    # # Patient info
    # patient = db_data.get("patient") or {}
    # patient_dob = format_date(patient.get("dob")) if patient.get("dob") else ""

    # # Assume subscriber = patient unless you have separate subscriber logic
    # subscriber = {
    #     "last_name": patient.get("last_name", "DOE"),
    #     "first_name": patient.get("first_name", "JOHN"),
    #     "middle_name": "",
    #     "member_id": patient.get("member_id") or patient.get("mrn") or "UNKNOWN",
    #     "date_of_birth": patient_dob,
    #     "gender": "U" if patient.get("gender") in ["Unknown", None] else patient.get("gender", "U")[0].upper(),
    #     "relationship_to_insured": "18",  # Self
    #     "address_line1": "",
    #     "address_line2": "",
    #     "city": "",
    #     "state": "",
    #     "zip_code": ""
    # }

    # # Payer - primary_insurance is null in your data, so leave blank or set default
    # payer_name = "UNKNOWN PAYER"
    # payer_id = ""

    # # You may want to map based on known logic later
    # # e.g., if you add insurance_name to appointment or patient

    # payer = {
    #     "name": payer_name,
    #     "payer_id": payer_id,
    #     "address_line1": "",
    #     "address_line2": "",
    #     "city": "",
    #     "state": "",
    #     "zip_code": ""
    # }

    # # Build the claim
    # claim = {
    #     "claim_filing_indicator": "CI",  # Commercial Insurance - adjust if needed (e.g., "BL" for BCBS)
    #     "payer_sequence": "P",
    #     "subscriber": subscriber,
    #     "subscriber_is_patient": True,
    #     "payer": payer,
    #     "claim_info": {
    #         "patient_account_number": db_data.get("id", "UNKNOWN"),
    #         "total_charge": round(total_charge, 2),
    #         "place_of_service": place_of_service,
    #         "frequency_code": db_data.get("submit_reason") or "1",  # 1 = Original claim
    #         "diagnosis_codes": diagnosis_codes,
    #         "rendering_provider": rendering_provider
    #     },
    #     "service_lines": []
    # }

    # # Build service lines
    # for sl in db_data.get("service_lines", []):
    #     line_date = sl.get("date_from") or sl.get("date_to") or service_date
    #     service_line = {
    #         "procedure_code": sl.get("procedure_code", ""),
    #         "modifiers": parse_modifiers(sl.get("modifiers", "")),
    #         "charge": float(sl.get("total_charge", 0)),
    #         "units": sl.get("units", 1),
    #         "service_date": format_date(line_date),
    #         "diagnosis_pointers": parse_diag_pointers(sl.get("diag_pointers", "")),
    #         "line_item_control_number": sl.get("reference_code", "") or f"S{db_data.get('id','').replace('-','')[:10]}"
    #     }
    #     claim["service_lines"].append(service_line)

    # # Final structure
    # transformed = {
    #     "interchange": {
    #         "sender_id": "XXXXXX",
    #         "receiver_id": "XXXXXX",
    #         "control_number": db_data.get("payer_doc_control", "000000001"),
    #         "usage_indicator": "T"  # Test
    #     },
    #     "submitter": {
    #         "organization_name": "XXXXXX",
    #         "submitter_id": "XXXXXX",
    #         "contact": {
    #             "name": "XXXXXX",
    #             "phone": "3165162853",
    #             "email": "ksp.health@gmail.com",
    #             "fax": "8335400904"
    #         }
    #     },
    #     "receiver": {
    #         "receiver_name": "XXXXXX",
    #         "receiver_id": "XXXXXX"
    #     },
    #     "billing_provider": {
    #         "organization_name": "KSP HEALTH - KANSAS",
    #         "npi": "1083239412",  # Your group NPI from original
    #         "tax_id": "832566791",
    #         "address_line1": "6446 E CENTRAL AVE PMB 183",
    #         "address_line2": "",
    #         "city": "WICHITA",
    #         "state": "KS",
    #         "zip_code": "672061923",
    #         "taxonomy": "363LF0000X"
    #     },
    #     "claims": [claim]
    # }

    # return transformed
    """
    Transform multiple encounter records into single 837 input JSON
    with multiple claims (one claim per encounter)
    """
    
    def format_date(date_str):
        """Format date to YYYYMMDD"""
        if not date_str:
            return ""
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").strftime("%Y%m%d")
        except:
            return ""
    
    def parse_diag_pointers(pointers_str):
        """Parse diagnosis pointers from string or JSON"""
        if not pointers_str:
            return []
        
        # Handle JSON format: {"diag_1":"123.06","diag_2":"123.07",...}
        if isinstance(pointers_str, str) and pointers_str.startswith('{'):
            try:
                diag_dict = json.loads(pointers_str)
                # Extract non-empty values and return indices (1,2,3,4)
                indices = []
                for key in ['diag_1', 'diag_2', 'diag_3', 'diag_4']:
                    if diag_dict.get(key) and diag_dict[key].strip():
                        indices.append(int(key.split('_')[1]))
                return indices if indices else [1]
            except:
                pass
        
        # Handle simple string format: "1" or "12" or "1234"
        if isinstance(pointers_str, str):
            return [int(p) for p in pointers_str.strip() if p.isdigit()]
        
        return [1]  # Default to first diagnosis
    
    def parse_modifiers(mod_str):
        """Parse modifiers from string or JSON"""
        if not mod_str:
            return []
        
        # Handle JSON format: {"mod_1":"25","mod_2":"","mod_3":"","mod_4":""}
        if isinstance(mod_str, str) and mod_str.startswith('{'):
            try:
                mod_dict = json.loads(mod_str)
                mods = []
                for key in ['mod_1', 'mod_2', 'mod_3', 'mod_4']:
                    if mod_dict.get(key) and mod_dict[key].strip():
                        mods.append(mod_dict[key].strip())
                return mods
            except:
                pass
        
        # Handle comma-separated: "95,GT" or single: "95"
        if isinstance(mod_str, str):
            return [m.strip() for m in mod_str.split(",") if m.strip()]
        
        return []
    
    def get_insurance_info(encounter):
        """Extract insurance information from appointment or set defaults"""
        appointment = encounter.get('appointment')
        
        if appointment and appointment.get('patient', {}).get('insurance_name'):
            insurance_name = appointment['patient']['insurance_name']['displayName']
            # Map common insurance names to filing indicators and payer IDs
            insurance_mapping = {
                'BLUE CROSS': ('BL', '00031'),
                'BCBS': ('BL', '00031'),
                'MEDICARE': ('MB', '00001'),
                'MEDICAID': ('MC', '00002'),
                'UNITED': ('CI', '96385'),
                'AETNA': ('CI', '60054'),
                'CIGNA': ('CI', '62308'),
            }
            
            for key, (filing, payer_id) in insurance_mapping.items():
                if key in insurance_name.upper():
                    return insurance_name, payer_id, filing
            
            return insurance_name, '', 'CI'  # Default to commercial
        
        return 'UNKNOWN PAYER', '', 'CI'
    
    # Build the base structure
    transformed = {
        "interchange": {
            "sender_id": "XXXXXX",
            "receiver_id": "XXXXXX",
            "control_number": encounters_list[0].get('payer_doc_control', '1') or '1',
            "usage_indicator": "T"
        },
        "submitter": {
            "organization_name": "XXXXXX",
            "submitter_id": "XXXXXX",
            "contact": {
                "name": "XXXXXX",
                "phone": "3165162853",
                "email": "ksp.health@gmail.com",
                "fax": "8335400904"
            }
        },
        "receiver": {
            "receiver_name": "XXXXXX",
            "receiver_id": "XXXXXX"
        },
        "billing_provider": {
            "entity_type": "2",
            "organization_name": "KSP HEALTH - KANSAS",
            "npi": "1083239412",
            "tax_id": "832566791",
            "address_line1": "6446 E CENTRAL AVE PMB 183",
            "address_line2": "",
            "city": "WICHITA",
            "state": "KS",
            "zip_code": "672061923",
            "taxonomy": "363LF0000X"
        },
        "claims": []
    }
    
    # Process each encounter as a separate claim
    for enc_idx, encounter in enumerate(encounters_list, 1):
        
        # Calculate total charge from service lines
        total_charge = sum(float(sl.get("total_charge", 0)) for sl in encounter.get("service_lines", []))
        
        # Determine service date
        service_date = encounter.get("service_date_from") or encounter.get("encounter_from_date") or ""
        if not service_date and encounter.get("service_lines"):
            first_line = encounter["service_lines"][0]
            service_date = first_line.get("date_from") or first_line.get("date_to") or ""
        
        service_date_formatted = format_date(service_date)
        
        # Extract diagnosis codes
        diagnosis_codes = []
        for diag in encounter.get("diagnoses", []):
            icd_code = diag.get("icd_code", "").replace(".", "")
            if icd_code:
                diagnosis_codes.append(icd_code)
        
        # If no diagnoses, add a default one to pass validation
        if not diagnosis_codes:
            diagnosis_codes = ["Z00000"]  # General exam
        
        # Place of service
        place_of_service = encounter.get("place_of_service_code") or "11"
        
        # Rendering provider
        rendering = encounter.get("rendering_provider") or {}
        if encounter.get("service_lines") and encounter["service_lines"][0].get("rendering_provider"):
            rendering = encounter["service_lines"][0]["rendering_provider"]
        
        rendering_provider = {
            "last_name": rendering.get("last_name", "UNKNOWN"),
            "first_name": rendering.get("first_name", "PROVIDER"),
            "middle_name": "",
            "npi": rendering.get("NPI", "1234567890"),  # Default NPI if missing
            "taxonomy": rendering.get("taxonomy") or "363LF0000X"
        }
        
        # Patient info
        patient = encounter.get("patient") or {}
        patient_dob = format_date(patient.get("dob")) if patient.get("dob") else ""
        
        # Get member_id from patient or appointment
        member_id = patient.get("member_id") or patient.get("mrn") or "UNKNOWN"
        if encounter.get("appointment") and encounter["appointment"].get("patient", {}).get("member_id"):
            member_id = encounter["appointment"]["patient"]["member_id"]
        
        # Subscriber (assuming patient = subscriber)
        subscriber = {
            "last_name": patient.get("last_name", "DOE"),
            "first_name": patient.get("first_name", "JOHN"),
            "middle_name": "",
            "member_id": member_id,
            "date_of_birth": patient_dob,
            "gender": "U" if not patient.get("gender") or patient.get("gender") == "Unknown" 
                      else patient.get("gender", "U")[0].upper(),
            "relationship_to_insured": "18",
            "address_line1": "",
            "address_line2": "",
            "city": "",
            "state": "",
            "zip_code": ""
        }
        
        payer_name, payer_id, filing_indicator = get_insurance_info(encounter)
        
        payer = {
            "name": payer_name,
            "payer_id": payer_id,
            "address_line1": "",
            "address_line2": "",
            "city": "",
            "state": "",
            "zip_code": ""
        }
        
        # Build claim
        claim = {
            "claim_filing_indicator": filing_indicator,
            "payer_sequence": "P",
            "subscriber": subscriber,
            "subscriber_is_patient": True,
            "payer": payer,
            "claim_info": {
                "patient_account_number": encounter.get("id", f"CLAIM{enc_idx:06d}"),
                "total_charge": round(total_charge, 2),
                "place_of_service": place_of_service,
                "frequency_code": encounter.get("submit_reason") or "1",
                "diagnosis_codes": diagnosis_codes,
                "rendering_provider": rendering_provider
            },
            "service_lines": []
        }
        
        # Build service lines
        for sl_idx, sl in enumerate(encounter.get("service_lines", []), 1):
            line_date_from = sl.get("date_from") or service_date
            line_date_to = sl.get("date_to")
            
            # Determine service date or date range
            if line_date_to and line_date_from != line_date_to:
                # Date range
                service_date_str = f"{format_date(line_date_from)}-{format_date(line_date_to)}"
            else:
                # Single date
                service_date_str = format_date(line_date_from)
            
            service_line = {
                "procedure_code": sl.get("procedure_code", "99213"),  # Default if missing
                "modifiers": parse_modifiers(sl.get("modifiers", "")),
                "charge": float(sl.get("total_charge", 0)),
                "units": sl.get("units", 1),
                "service_date": service_date_str,
                "diagnosis_pointers": parse_diag_pointers(sl.get("diag_pointers", "")),
                "line_item_control_number": sl.get("reference_code", "") or 
                    f"S{encounter.get('id', '')[:10].replace('-', '')[:10]}L{sl_idx}"
            }
            claim["service_lines"].append(service_line)
        
        # Add claim to claims list
        transformed["claims"].append(claim)
    
    return transformed

# class EDI837Validator:
#     """Validation rules for 837 EDI elements"""
    
#     @staticmethod
#     def validate_npi(npi: str) -> bool:
#         """Validate NPI is 10 digits"""
#         return bool(re.match(r'^\d{10}$', npi))
    
#     @staticmethod
#     def validate_ein(ein: str) -> bool:
#         """Validate EIN is 9 digits"""
#         return bool(re.match(r'^\d{9}$', ein))
    
#     @staticmethod
#     def validate_date(date_str: str) -> bool:
#         """Validate date format CCYYMMDD"""
#         try:
#             datetime.strptime(date_str, '%Y%m%d')
#             return True
#         except ValueError:
#             return False
    
#     @staticmethod
#     def validate_zip(zip_code: str) -> bool:
#         """Validate ZIP is 5 or 9 digits"""
#         return bool(re.match(r'^\d{5}(\d{4})?$', zip_code))
    
#     @staticmethod
#     def validate_phone(phone: str) -> bool:
#         """Validate phone is 10 digits"""
#         return bool(re.match(r'^\d{10}$', phone))
    
#     @staticmethod
#     def validate_diagnosis_code(code: str) -> bool:
#         """Validate ICD-10 code format"""
#         return bool(re.match(r'^[A-Z][0-9]{2}[A-Z0-9]{0,4}$', code))
    
#     @staticmethod
#     def validate_procedure_code(code: str) -> bool:
#         """Validate CPT/HCPCS code"""
#         return bool(re.match(r'^[0-9A-Z]{5}$', code))
    
    
# class EDI837PGenerator:
#     """Generate 837 Professional EDI files from JSON"""
    
#     def __init__(self):
#         self.segment_count = 0
#         self.validator = EDI837Validator()
#         self.errors = []


#     def remove_extra_data(self,output:str) -> str:
#         output = output.replace("*~","~")
        
#         output = output.replace("N3**~\n","")
#         output = output.replace("N3*~\n","")
#         output = output.replace("N4*~\n","")
#         output = output.replace("N4**~\n","")
#         output = output.replace("N4***~\n","")
#         output = output.replace("DMG*D8**~\n","")
#         output = output.replace("DMG*D8*~\n","")
#         output = output.replace("SBR*P********BL~\n","")
#         output = output.replace(".00*","*")
#         # output =

#         output = output.replace("\n\n","\n")
#         return output
    
#     def pad_right(self, value: str, length: int) -> str:
#         """Pad string with spaces on the right"""
#         return value.ljust(length)[:length]
    
#     def format_amount(self, amount: float) -> str:
#         """Format monetary amount"""
#         return f"{amount:.2f}"
    
#     def generate_control_number(self, base: int) -> str:
#         """Generate 9-digit control number"""
#         return str(base).zfill(9)
    
#     def escape_special_chars(self, text: str) -> str:
#         """Remove special characters that conflict with EDI delimiters"""
#         if not text:
#             return ""
#         # Remove or replace characters that conflict with delimiters
#         text = text.replace('~', '').replace('*', '').replace("$","")
#         return text.strip()
    
#     def build_segment(self, *elements) -> str:
#         """Build a segment with elements separated by *"""
#         # Convert all elements to strings and handle None values
#         clean_elements = []
#         for elem in elements:
#             if elem is None or elem == '':
#                 clean_elements.append('')
#             else:
#                 if 'ISA' not in elements:
#                     clean_elements.append(self.escape_special_chars(str(elem)))
#                 else:
#                     clean_elements.append(str(elem))
        
#         segment = '*'.join(clean_elements) + '~\n'
#         self.segment_count += 1
#         return segment
    
#     def validate_input(self, data: Dict) -> bool:
#         """Validate input JSON structure"""
#         self.errors = []
        
#         # Validate interchange
#         if 'interchange' not in data:
#             self.errors.append("Missing 'interchange' section")
#             return False
        
#         interchange = data['interchange']
#         if not interchange.get('sender_id'):
#             self.errors.append("Missing sender_id")
#         if not interchange.get('receiver_id'):
#             self.errors.append("Missing receiver_id")
        
#         # Validate submitter
#         if 'submitter' not in data:
#             self.errors.append("Missing 'submitter' section")
        
#         # Validate billing provider
#         if 'billing_provider' not in data:
#             self.errors.append("Missing 'billing_provider' section")
#         else:
#             bp = data['billing_provider']
#             if bp.get('npi') and not self.validator.validate_npi(bp['npi']):
#                 self.errors.append(f"Invalid billing provider NPI: {bp.get('npi')}")
#             if bp.get('tax_id') and not self.validator.validate_ein(bp['tax_id']):
#                 self.errors.append(f"Invalid billing provider tax_id: {bp.get('tax_id')}")
        
#         # Validate claims
#         if 'claims' not in data or not data['claims']:
#             self.errors.append("No claims found")
#             return False
        
#         for idx, claim in enumerate(data['claims']):
#             claim_id = claim.get('claim_id', f'Claim {idx+1}')
            
#             # Validate subscriber
#             if 'subscriber' not in claim:
#                 self.errors.append(f"{claim_id}: Missing subscriber")
            
#             # Validate payer
#             if 'payer' not in claim:
#                 self.errors.append(f"{claim_id}: Missing payer")
            
#             # Validate claim info
#             if 'claim_info' not in claim:
#                 self.errors.append(f"{claim_id}: Missing claim_info")
#             else:
#                 ci = claim['claim_info']
#                 if not ci.get('total_charge'):
#                     self.errors.append(f"{claim_id}: Missing total_charge")
                
#                 # Validate diagnosis codes
#                 if 'diagnosis_codes' in ci and ci['diagnosis_codes']:
#                     for diag in ci['diagnosis_codes']:
#                         if not self.validator.validate_diagnosis_code(diag):
#                             self.errors.append(f"{claim_id}: Invalid diagnosis code: {diag}")
            
#             # Validate service lines
#             if 'service_lines' not in claim or not claim['service_lines']:
#                 self.errors.append(f"{claim_id}: Missing service_lines")
#             else:
#                 for svc_idx, svc in enumerate(claim['service_lines']):
#                     if not svc.get('procedure_code'):
#                         self.errors.append(f"{claim_id} Line {svc_idx+1}: Missing procedure_code")
#                     elif not self.validator.validate_procedure_code(svc['procedure_code']):
#                         self.errors.append(f"{claim_id} Line {svc_idx+1}: Invalid procedure_code: {svc.get('procedure_code')}")
                    
#                     if not svc.get('charge'):
#                         self.errors.append(f"{claim_id} Line {svc_idx+1}: Missing charge")
                    
#                     if not svc.get('service_date'):
#                         self.errors.append(f"{claim_id} Line {svc_idx+1}: Missing service_date")
        
#         return len(self.errors) == 0
    
#     def generate_isa(self, data: Dict) -> str:
#         """Generate ISA segment"""
#         ic = data['interchange']
#         sender_id = self.pad_right(ic['sender_id'], 15)
#         receiver_id = self.pad_right(ic['receiver_id'], 15)
        
#         date = datetime.now().strftime('%y%m%d')
#         time = datetime.now().strftime('%H%M')
#         control_num = self.generate_control_number(ic.get('control_number', 1))
        
#         usage = ic.get('usage_indicator', 'T')  # T=Test, P=Production
        
#         return self.build_segment(
#             'ISA', '00', '          ', '00', '          ',
#             'ZZ', sender_id, 'ZZ', receiver_id,
#             date, time, '^', '00501', control_num, '0', usage, ':'
#         )
    
#     def generate_gs(self, data: Dict, control_num: int) -> str:
#         """Generate GS segment"""
#         ic = data['interchange']
#         date = datetime.now().strftime('%Y%m%d')
#         time = datetime.now().strftime('%H%M')
        
#         return self.build_segment(
#             'GS', 'HC', ic['sender_id'], ic['receiver_id'],
#             date, time, str(control_num), 'X', '005010X222A1'
#         )
    
#     def generate_st(self, transaction_num: str) -> str:
#         """Generate ST segment"""
#         return self.build_segment('ST', '837', transaction_num, '005010X222A1')
    
#     def generate_bht(self, batch_id: str) -> str:
#         """Generate BHT segment"""
#         date = datetime.now().strftime('%Y%m%d')
#         time = datetime.now().strftime('%H%M%S')
        
#         return self.build_segment('BHT', '0019', '00', batch_id, date, time, 'CH')
    
#     def generate_submitter_loop(self, data: Dict) -> str:
#         """Generate submitter loop (1000A)"""
#         sub = data['submitter']
#         output = ''
        
#         # NM1
#         output += self.build_segment(
#             'NM1', '41', '2', sub['organization_name'], '', '', '', '',
#             '46', sub['submitter_id']
#         )
        
#         # PER
#         contact = sub.get('contact', {})
#         output += self.build_segment(
#             'PER', 'IC', contact.get('name', ''),
#             'TE', contact.get('phone', ''),
#             'EM', contact.get('email', ''),
#             'FX', contact.get('fax', '')
#         )
        
#         return output
    
#     def generate_receiver_loop(self, data: Dict) -> str:
#         """Generate receiver loop (1000B)"""
#         rec = data.get('receiver', data['interchange'])
        
#         return self.build_segment(
#             'NM1', '40', '2', rec.get('receiver_name', 'RECEIVER'), '', '', '', '',
#             '46', rec.get('receiver_id', data['interchange']['receiver_id'])
#         )
    
#     def generate_billing_provider_loop(self, data: Dict, hl_id: int) -> str:
#         """Generate billing provider loop (2000A)"""
#         bp = data['billing_provider']
#         output = ''
        
#         # HL
#         output += self.build_segment('HL', str(hl_id), '', '20', '1')
        
#         # PRV (optional)
#         if bp.get('taxonomy'):
#             output += self.build_segment('PRV', 'BI', 'PXC', bp['taxonomy'])
        
#         # NM1
#         entity_type = bp.get('entity_type', '2')
#         if entity_type == '2':
#             output += self.build_segment(
#                 'NM1', '85', '2', bp['organization_name'], '', '', '', '',
#                 'XX', bp['npi']
#             )
#         else:
#             output += self.build_segment(
#                 'NM1', '85', '1', bp['last_name'], bp.get('first_name', ''),
#                 bp.get('middle_name', ''), '', '', 'XX', bp['npi']
#             )
        
#         # N3
#         output += self.build_segment('N3', bp['address_line1'], bp.get('address_line2', ''))
        
#         # N4
#         output += self.build_segment('N4', bp['city'], bp['state'], bp['zip_code'])
        
#         # REF
#         tax_id_qualifier = 'EI' if bp.get('entity_type', '2') == '2' else 'SY'
#         output += self.build_segment('REF', tax_id_qualifier, bp['tax_id'])
        
#         return output
    
#     def generate_subscriber_loop(self, claim: Dict, parent_hl: int, current_hl: int) -> str:
#         """Generate subscriber loop (2000B)"""
#         sub = claim['subscriber']
#         output = ''
        
#         # HL
#         has_patient = 'patient' in claim and claim.get('subscriber_is_patient', True) == False
#         output += self.build_segment(
#             'HL', str(current_hl), str(parent_hl), '22', '1' if has_patient else '0'
#         )
        
#         # SBR
#         payer_seq = claim.get('payer_sequence', 'P')
#         relationship = sub.get('relationship_to_insured', '18')
#         group_number = sub.get('group_number', '')
#         filing_indicator = claim.get('claim_filing_indicator', 'CI')
        
#         output += self.build_segment(
#             'SBR', payer_seq, relationship, group_number, '', '', '', '', '', filing_indicator
#         )
        
#         # NM1 (Subscriber)
#         output += self.build_segment(
#             'NM1', 'IL', '1', sub['last_name'], sub['first_name'],
#             sub.get('middle_name', ''), '', '', 'MI', sub['member_id']
#         )
        
#         # N3
#         output += self.build_segment('N3', sub['address_line1'], sub.get('address_line2', ''))
        
#         # N4
#         output += self.build_segment('N4', sub['city'], sub['state'], sub['zip_code'])
        
#         # DMG
#         output += self.build_segment('DMG', 'D8', sub['date_of_birth'], sub['gender'])
        
#         # Payer information
#         payer = claim['payer']
        
#         # NM1 (Payer)
#         output += self.build_segment(
#             'NM1', 'PR', '2', payer['name'], '', '', '', '',
#             'PI', payer['payer_id']
#         )
        
#         # N3
#         output += self.build_segment('N3', payer['address_line1'], payer.get('address_line2', ''))
        
#         # N4
#         output += self.build_segment('N4', payer['city'], payer['state'], payer['zip_code'])
        
#         return output
    
#     def generate_patient_loop(self, claim: Dict, parent_hl: int, current_hl: int) -> str:
#         """Generate patient loop (2000C) if patient != subscriber"""
#         if 'patient' not in claim or claim.get('subscriber_is_patient', True):
#             return ''
        
#         patient = claim['patient']
#         output = ''
        
#         # HL
#         output += self.build_segment('HL', str(current_hl), str(parent_hl), '23', '0')
        
#         # PAT
#         relationship = patient.get('relationship_to_subscriber', '19')
#         output += self.build_segment('PAT', relationship, '', '', '', '', '', '', '')
        
#         # NM1
#         output += self.build_segment(
#             'NM1', 'QC', '1', patient['last_name'], patient['first_name'],
#             patient.get('middle_name', ''), '', '', '', ''
#         )
        
#         # N3
#         output += self.build_segment('N3', patient['address_line1'], patient.get('address_line2', ''))
        
#         # N4
#         output += self.build_segment('N4', patient['city'], patient['state'], patient['zip_code'])
        
#         # DMG
#         output += self.build_segment('DMG', 'D8', patient['date_of_birth'], patient['gender'])
        
#         return output
    
#     def generate_claim_info(self, claim: Dict) -> str:
#         """Generate claim information (2300)"""
#         ci = claim['claim_info']
#         output = ''
        
#         # CLM
#         claim_id = ci['patient_account_number']
#         total_charge = self.format_amount(ci['total_charge'])
#         place_of_service = ci.get('place_of_service', '11')
#         frequency = ci.get('frequency_code', '1')
#         signature_source = ci.get('signature_source', '1')
        
#         output += self.build_segment(
#             'CLM', claim_id, total_charge, '', '',
#             f"{place_of_service}:B:{signature_source}",
#             ci.get('provider_accept_assignment', 'Y'),
#             ci.get('assignment_benefits', 'A'),
#             ci.get('release_info', 'Y'),
#             ci.get('patient_signature', 'Y'),
#             '', '', '', '', '', '', ''
#         )
        
#         # HI (Diagnosis codes)
#         diagnosis_codes = ci.get('diagnosis_codes', [])
#         if diagnosis_codes:
#             hi_elements = ['HI']
#             for idx, code in enumerate(diagnosis_codes[:12]):  # Max 12 diagnoses
#                 qualifier = 'ABK' if idx == 0 else 'ABF'
#                 hi_elements.append(f"{qualifier}:{code}")
            
#             # Pad with empty elements if needed
#             while len(hi_elements) < 13:
#                 hi_elements.append('')
            
#             output += self.build_segment(*hi_elements)
        
#         # Rendering provider (if different from billing)
#         if 'rendering_provider' in ci:
#             rp = ci['rendering_provider']
#             output += self.build_segment(
#                 'NM1', '82', '1', rp['last_name'], rp.get('first_name', ''),
#                 rp.get('middle_name', ''), '', '', 'XX', rp['npi']
#             )
            
#             if rp.get('taxonomy'):
#                 output += self.build_segment('PRV', 'PE', 'PXC', rp['taxonomy'])
        
#         # Service facility (if different from billing)
#         if 'service_facility' in ci:
#             sf = ci['service_facility']
#             output += self.build_segment(
#                 'NM1', '77', '2', sf['organization_name'], '', '', '', '',
#                 'XX', sf['npi']
#             )
#             output += self.build_segment('N3', sf['address_line1'], sf.get('address_line2', ''))
#             output += self.build_segment('N4', sf['city'], sf['state'], sf['zip_code'])
        
#         return output
    
#     def generate_service_lines(self, claim: Dict) -> str:
#         """Generate service line loop (2400)"""
#         output = ''
        
#         for idx, svc in enumerate(claim['service_lines'], 1):
#             # LX
#             output += self.build_segment('LX', str(idx))
            
#             # SV1
#             procedure_code = svc['procedure_code']
#             modifiers = svc.get('modifiers', [])
            
#             # Build procedure code composite
#             proc_composite = f"HC:{procedure_code}"
#             for mod in modifiers[:4]:  # Max 4 modifiers
#                 proc_composite += f":{mod}"
            
#             charge = self.format_amount(svc['charge'])
#             units = svc.get('units', 1)
            
#             # Diagnosis pointers
#             diag_pointers = svc.get('diagnosis_pointers', [1])
#             diag_pointer_str = ':'.join(str(d) for d in diag_pointers)
            
#             output += self.build_segment(
#                 'SV1', proc_composite, charge, 'UN', str(units), '', '',
#                 diag_pointer_str, '', '', '', '', '', '', '', ''
#             )
            
#             # DTP (Service date)
#             service_date = svc['service_date']
#             if '-' in service_date:
#                 # Date range
#                 output += self.build_segment('DTP', '472', 'RD8', service_date)
#             else:
#                 # Single date
#                 output += self.build_segment('DTP', '472', 'D8', service_date)
            
#             # REF (Line reference)
#             if svc.get('line_item_control_number'):
#                 output += self.build_segment('REF', '6R', svc['line_item_control_number'])
        
#         return output
    
#     def generate_claim(self, claim: Dict, transaction_num: str, hl_counter: int) -> tuple:
#         """Generate complete claim transaction"""
#         self.segment_count = 0
#         output = ''
        
#         # ST
#         output += self.generate_st(transaction_num)
        
#         # BHT
#         output += self.generate_bht(transaction_num.split('-')[0])
        
#         # Billing provider loop (2000A)
#         output += self.generate_billing_provider_loop(claim, hl_counter)
#         billing_hl = hl_counter
#         hl_counter += 1
        
#         # Subscriber loop (2000B)
#         output += self.generate_subscriber_loop(claim, billing_hl, hl_counter)
#         subscriber_hl = hl_counter
#         hl_counter += 1
        
#         # Patient loop (2000C) if needed
#         if 'patient' in claim and not claim.get('subscriber_is_patient', True):
#             output += self.generate_patient_loop(claim, subscriber_hl, hl_counter)
#             hl_counter += 1
        
#         # Claim information (2300)
#         output += self.generate_claim_info(claim)
        
#         # Service lines (2400)
#         output += self.generate_service_lines(claim)
        
#         # SE
#         output += self.build_segment('SE', str(self.segment_count + 1), transaction_num)
        
#         return output, hl_counter
    
#     def generate(self, json_data: Dict) -> str:
#         """Generate complete 837 file from JSON"""
#         # Validate input
#         if not self.validate_input(json_data):
#             raise ValueError(f"Validation errors:\n" + '\n'.join(self.errors))
        
#         output = ''
#         control_num = json_data['interchange'].get('control_number', 1)
        
#         # ISA
#         output += self.generate_isa(json_data)
#         print(f"the output so for is : {output}")
        
#         # GS
#         output += self.generate_gs(json_data, control_num)
        
#         # Generate submitter and receiver (once per file)
#         submitter_receiver = ''
#         submitter_receiver += self.generate_submitter_loop(json_data)
#         submitter_receiver += self.generate_receiver_loop(json_data)
        
#         # Generate claims
#         transaction_count = 0
#         hl_counter = 1
#         claims_output = ''
        
#         for idx, claim in enumerate(json_data['claims'], 1):
#             # Merge billing provider into each claim
#             claim['billing_provider'] = json_data['billing_provider']
            
#             transaction_num = f"{control_num}-{str(idx).zfill(2)}"
#             claim_output, hl_counter = self.generate_claim(claim, transaction_num, hl_counter)
            
#             # Insert submitter/receiver after BHT in each transaction
#             parts = claim_output.split('CH~\n', 1)
#             if len(parts) == 2:
#                 claim_output = parts[0] + 'CH~\n' + submitter_receiver + parts[1]
            
#             claims_output += claim_output
#             transaction_count += 1
        
#         output += claims_output
        
#         # GE
#         output += self.build_segment('GE', str(transaction_count), str(control_num))
        
#         # IEA
#         output += self.build_segment('IEA', '1', self.generate_control_number(control_num))

#         # removing extra parts .. 

#         output = self.remove_extra_data(output)
         
#         return output


class EDI837Validator:
    """Validation rules for 837 EDI elements"""
    
    @staticmethod
    def validate_npi(npi: str) -> bool:
        """Validate NPI is 10 digits"""
        return bool(re.match(r'^\d{10}$', npi))
    
    @staticmethod
    def validate_ein(ein: str) -> bool:
        """Validate EIN is 9 digits"""
        return bool(re.match(r'^\d{9}$', ein))
    
    @staticmethod
    def validate_date(date_str: str) -> bool:
        """Validate date format CCYYMMDD"""
        try:
            datetime.strptime(date_str, '%Y%m%d')
            return True
        except ValueError:
            return False


class EDI837Generator:
    """Generate 837 Professional EDI files from JSON"""
    
    def __init__(self):
        self.segment_count = 0
        self.validator = EDI837Validator()
        self.errors = []
        self.warnings = []
    
    def remove_extra_data(self, output: str) -> str:
        """Clean up empty segments and formatting"""
        output = output.replace("*~", "~")
        output = output.replace("N3**~\n", "")
        output = output.replace("N3*~\n", "")
        output = output.replace("N4*~\n", "")
        output = output.replace("N4**~\n", "")
        output = output.replace("N4***~\n", "")
        output = output.replace("DMG*D8**~\n", "")
        output = output.replace("DMG*D8*~\n", "")
        output = output.replace("SBR*P********BL~\n", "")
        output = output.replace("\n\n", "\n")
        return output
    
    def pad_right(self, value: str, length: int) -> str:
        """Pad string with spaces on the right"""
        return value.ljust(length)[:length]
    
    def format_amount(self, amount: float) -> str:
        """Format monetary amount"""
        return f"{amount:.2f}"
    
    def generate_control_number(self, base: int) -> str:
        """Generate 9-digit control number"""
        return str(base).zfill(9)
    
    def escape_special_chars(self, text: str) -> str:
        """Remove special characters that conflict with EDI delimiters"""
        if not text:
            return ""
        text = text.replace('~', '').replace('*', '').replace("$", "")
        return text.strip()
    
    def build_segment(self, *elements) -> str:
        """Build a segment with elements separated by *"""
        clean_elements = []
        for elem in elements:
            if elem is None or elem == '':
                clean_elements.append('')
            else:
                if 'ISA' not in elements:
                    clean_elements.append(self.escape_special_chars(str(elem)))
                else:
                    clean_elements.append(str(elem))
        
        segment = '*'.join(clean_elements) + '~\n'
        self.segment_count += 1
        return segment
    
    def validate_input(self, data: Dict) -> bool:
        """Validate input JSON structure"""
        self.errors = []
        self.warnings = []
        
        # Validate basic structure
        if 'interchange' not in data:
            self.errors.append("Missing 'interchange' section")
            return False
        
        if 'claims' not in data or not data['claims']:
            self.errors.append("No claims found")
            return False
        
        # Validate each claim
        for idx, claim in enumerate(data['claims'], 1):
            claim_id = claim.get('claim_info', {}).get('patient_account_number', f'Claim {idx}')
            
            if 'subscriber' not in claim:
                self.errors.append(f"{claim_id}: Missing subscriber")
            
            if 'service_lines' not in claim or not claim['service_lines']:
                self.errors.append(f"{claim_id}: Missing service_lines")
            
            # Validate NPI if present
            rp = claim.get('claim_info', {}).get('rendering_provider', {})
            if rp.get('npi') and not self.validator.validate_npi(rp['npi']):
                self.warnings.append(f"{claim_id}: Invalid rendering provider NPI: {rp.get('npi')}")
        
        return len(self.errors) == 0
    
    def generate_isa(self, data: Dict) -> str:
        """Generate ISA segment"""
        ic = data['interchange']
        sender_id = self.pad_right(ic['sender_id'], 15)
        receiver_id = self.pad_right(ic['receiver_id'], 15)
        
        date = datetime.now().strftime('%y%m%d')
        time = datetime.now().strftime('%H%M')
        control_num = self.generate_control_number(ic.get('control_number', 1))
        usage = ic.get('usage_indicator', 'T')
        
        return self.build_segment(
            'ISA', '00', '          ', '00', '          ',
            'ZZ', sender_id, 'ZZ', receiver_id,
            date, time, '^', '00501', control_num, '0', usage, ':'
        )
    
    def generate_gs(self, data: Dict, control_num: int) -> str:
        """Generate GS segment"""
        ic = data['interchange']
        date = datetime.now().strftime('%Y%m%d')
        time = datetime.now().strftime('%H%M')
        
        return self.build_segment(
            'GS', 'HC', ic['sender_id'], ic['receiver_id'],
            date, time, str(control_num), 'X', '005010X222A1'
        )
    
    def generate_st(self, transaction_num: str) -> str:
        """Generate ST segment"""
        return self.build_segment('ST', '837', transaction_num, '005010X222A1')
    
    def generate_bht(self, batch_id: str) -> str:
        """Generate BHT segment"""
        date = datetime.now().strftime('%Y%m%d')
        time = datetime.now().strftime('%H%M%S')
        return self.build_segment('BHT', '0019', '00', batch_id, date, time, 'CH')
    
    def generate_submitter_loop(self, data: Dict) -> str:
        """Generate submitter loop (1000A)"""
        sub = data['submitter']
        output = ''
        
        output += self.build_segment(
            'NM1', '41', '2', sub['organization_name'], '', '', '', '',
            '46', sub['submitter_id']
        )
        
        contact = sub.get('contact', {})
        output += self.build_segment(
            'PER', 'IC', contact.get('name', ''),
            'TE', contact.get('phone', ''),
            'EM', contact.get('email', ''),
            'FX', contact.get('fax', '')
        )
        
        return output
    
    def generate_receiver_loop(self, data: Dict) -> str:
        """Generate receiver loop (1000B)"""
        rec = data.get('receiver', data['interchange'])
        
        return self.build_segment(
            'NM1', '40', '2', rec.get('receiver_name', 'RECEIVER'), '', '', '', '',
            '46', rec.get('receiver_id', data['interchange']['receiver_id'])
        )
    
    def generate_billing_provider_loop(self, data: Dict, hl_id: int) -> str:
        """Generate billing provider loop (2000A)"""
        bp = data['billing_provider']
        output = ''
        
        output += self.build_segment('HL', str(hl_id), '', '20', '1')
        
        if bp.get('taxonomy'):
            output += self.build_segment('PRV', 'BI', 'PXC', bp['taxonomy'])
        
        entity_type = bp.get('entity_type', '2')
        if entity_type == '2':
            output += self.build_segment(
                'NM1', '85', '2', bp['organization_name'], '', '', '', '',
                'XX', bp['npi']
            )
        else:
            output += self.build_segment(
                'NM1', '85', '1', bp['last_name'], bp.get('first_name', ''),
                bp.get('middle_name', ''), '', '', 'XX', bp['npi']
            )
        
        output += self.build_segment('N3', bp['address_line1'], bp.get('address_line2', ''))
        output += self.build_segment('N4', bp['city'], bp['state'], bp['zip_code'])
        
        tax_id_qualifier = 'EI' if bp.get('entity_type', '2') == '2' else 'SY'
        output += self.build_segment('REF', tax_id_qualifier, bp['tax_id'])
        
        return output
    
    def generate_subscriber_loop(self, claim: Dict, parent_hl: int, current_hl: int) -> str:
        """Generate subscriber loop (2000B)"""
        sub = claim['subscriber']
        output = ''
        
        has_patient = 'patient' in claim and claim.get('subscriber_is_patient', True) == False
        output += self.build_segment(
            'HL', str(current_hl), str(parent_hl), '22', '1' if has_patient else '0'
        )
        
        payer_seq = claim.get('payer_sequence', 'P')
        relationship = sub.get('relationship_to_insured', '18')
        group_number = sub.get('group_number', '')
        filing_indicator = claim.get('claim_filing_indicator', 'CI')
        
        output += self.build_segment(
            'SBR', payer_seq, relationship, group_number, '', '', '', '', '', filing_indicator
        )
        
        output += self.build_segment(
            'NM1', 'IL', '1', sub['last_name'], sub['first_name'],
            sub.get('middle_name', ''), '', '', 'MI', sub['member_id']
        )
        
        output += self.build_segment('N3', sub['address_line1'], sub.get('address_line2', ''))
        output += self.build_segment('N4', sub['city'], sub['state'], sub['zip_code'])
        output += self.build_segment('DMG', 'D8', sub['date_of_birth'], sub['gender'])
        
        payer = claim['payer']
        output += self.build_segment(
            'NM1', 'PR', '2', payer['name'], '', '', '', '',
            'PI', payer['payer_id']
        )
        
        output += self.build_segment('N3', payer['address_line1'], payer.get('address_line2', ''))
        output += self.build_segment('N4', payer['city'], payer['state'], payer['zip_code'])
        
        return output
    
    def generate_claim_info(self, claim: Dict) -> str:
        """Generate claim information (2300)"""
        ci = claim['claim_info']
        output = ''
        
        claim_id = ci['patient_account_number']
        total_charge = self.format_amount(ci['total_charge'])
        place_of_service = ci.get('place_of_service', '11')
        frequency = ci.get('frequency_code', '1')
        signature_source = ci.get('signature_source', '1')
        
        output += self.build_segment(
            'CLM', claim_id, total_charge, '', '',
            f"{place_of_service}:B:{signature_source}",
            ci.get('provider_accept_assignment', 'Y'),
            ci.get('assignment_benefits', 'A'),
            ci.get('release_info', 'Y'),
            ci.get('patient_signature', 'Y'),
            '', '', '', '', '', '', ''
        )
        
        diagnosis_codes = ci.get('diagnosis_codes', [])
        if diagnosis_codes:
            hi_elements = ['HI']
            for idx, code in enumerate(diagnosis_codes[:12]):
                qualifier = 'ABK' if idx == 0 else 'ABF'
                hi_elements.append(f"{qualifier}:{code}")
            
            while len(hi_elements) < 13:
                hi_elements.append('')
            
            output += self.build_segment(*hi_elements)
        
        if 'rendering_provider' in ci:
            rp = ci['rendering_provider']
            output += self.build_segment(
                'NM1', '82', '1', rp['last_name'], rp.get('first_name', ''),
                rp.get('middle_name', ''), '', '', 'XX', rp['npi']
            )
            
            if rp.get('taxonomy'):
                output += self.build_segment('PRV', 'PE', 'PXC', rp['taxonomy'])
        
        return output
    
    def generate_service_lines(self, claim: Dict) -> str:
        """Generate service line loop (2400)"""
        output = ''
        
        for idx, svc in enumerate(claim['service_lines'], 1):
            output += self.build_segment('LX', str(idx))
            
            procedure_code = svc['procedure_code']
            modifiers = svc.get('modifiers', [])
            
            proc_composite = f"HC:{procedure_code}"
            for mod in modifiers[:4]:
                proc_composite += f":{mod}"
            
            charge = self.format_amount(svc['charge'])
            units = svc.get('units', 1)
            
            diag_pointers = svc.get('diagnosis_pointers', [1])
            diag_pointer_str = ':'.join(str(d) for d in diag_pointers) if diag_pointers else '1'
            
            output += self.build_segment(
                'SV1', proc_composite, charge, 'UN', str(units), '', '',
                diag_pointer_str, '', '', '', '', '', '', '', ''
            )
            
            service_date = svc['service_date']
            if '-' in service_date and len(service_date.split('-')) == 2:
                # Date range format
                dates = service_date.split('-')
                if len(dates[0]) == 8 and len(dates[1]) == 8:
                    output += self.build_segment('DTP', '472', 'RD8', service_date)
                else:
                    output += self.build_segment('DTP', '472', 'D8', dates[0])
            else:
                output += self.build_segment('DTP', '472', 'D8', service_date)
            
            if svc.get('line_item_control_number'):
                output += self.build_segment('REF', '6R', svc['line_item_control_number'])
        
        return output
    
    def generate_claim(self, claim: Dict, transaction_num: str, hl_counter: int) -> tuple:
        """Generate complete claim transaction"""
        self.segment_count = 0
        output = ''
        
        output += self.generate_st(transaction_num)
        output += self.generate_bht(transaction_num.split('-')[0])
        
        output += self.generate_billing_provider_loop(claim, hl_counter)
        billing_hl = hl_counter
        hl_counter += 1
        
        output += self.generate_subscriber_loop(claim, billing_hl, hl_counter)
        hl_counter += 1
        
        output += self.generate_claim_info(claim)
        output += self.generate_service_lines(claim)
        
        output += self.build_segment('SE', str(self.segment_count + 1), transaction_num)
        
        return output, hl_counter
    
    def generate(self, json_data: Dict) -> str:
        """Generate complete 837 file from JSON"""
        if not self.validate_input(json_data):
            raise ValueError(f"Validation errors:\n" + '\n'.join(self.errors))
        
        output = ''
        control_num = json_data['interchange'].get('control_number', 1)
        
        output += self.generate_isa(json_data)
        output += self.generate_gs(json_data, control_num)
        
        submitter_receiver = ''
        submitter_receiver += self.generate_submitter_loop(json_data)
        submitter_receiver += self.generate_receiver_loop(json_data)
        
        transaction_count = 0
        hl_counter = 1
        claims_output = ''
        
        for idx, claim in enumerate(json_data['claims'], 1):
            claim['billing_provider'] = json_data['billing_provider']
            
            transaction_num = f"{control_num}-{str(idx).zfill(2)}"
            claim_output, hl_counter = self.generate_claim(claim, transaction_num, hl_counter)
            
            parts = claim_output.split('CH~\n', 1)
            if len(parts) == 2:
                claim_output = parts[0] + 'CH~\n' + submitter_receiver + parts[1]
            
            claims_output += claim_output
            transaction_count += 1
        
        output += claims_output
        output += self.build_segment('GE', str(transaction_count), str(control_num))
        output += self.build_segment('IEA', '1', self.generate_control_number(control_num))
        
        output = self.remove_extra_data(output)
        
        return output