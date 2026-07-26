"""
Seed realistic billing/analytics demo data into the demo tenant schema so the
PMS Analytics page shows meaningful stats and graphs.

Run:  ./venv/bin/python manage.py shell < seed_analytics_data.py
Idempotent-ish: it tags created rows and clears prior seeded rows first.
"""
import random
from datetime import timedelta, datetime
from decimal import Decimal

from django.utils import timezone
from django_tenants.utils import schema_context
from accounts.models import Client

random.seed(42)

client = Client.objects.filter(schema_name="tenant_droidal_demo_clinic").first() \
    or Client.objects.exclude(schema_name="public").first()
print("Using tenant:", client.schema_name)

CPTS = [
    ("99213", "Office/outpatient visit, established", Decimal("85")),
    ("99214", "Office visit, established, moderate", Decimal("130")),
    ("99203", "Office/outpatient visit, new patient", Decimal("150")),
    ("99204", "New patient visit, moderate complexity", Decimal("220")),
    ("93000", "Electrocardiogram, complete", Decimal("75")),
    ("85025", "Complete blood count (CBC)", Decimal("45")),
    ("80053", "Comprehensive metabolic panel", Decimal("60")),
    ("90471", "Immunization administration", Decimal("35")),
    ("99396", "Preventive visit, established, 40-64", Decimal("180")),
    ("71046", "Chest X-ray, 2 views", Decimal("95")),
]
PAYERS = ["Aetna", "Blue Cross Blue Shield", "Medicare",
          "UnitedHealthcare", "Cigna", "Humana"]
CLAIM_STATUSES = ["Completed", "Completed", "Completed", "Pending Insurance",
                  "Pending Insurance", "Denials", "No Response",
                  "Ready to Electronic Statements"]

with schema_context(client.schema_name):
    from tenant_app.models import Patient, PatientProvider
    from tenant_encounter.models import Encounter, EncounterServiceLine
    from tenant_claim_submission.models import Claim
    from payment_posting.models import Payment

    patients = list(Patient.objects.all())
    providers = list(PatientProvider.objects.all())
    if not patients or not providers:
        print("No patients/providers to seed against — aborting.")
    else:
        # clear prior seeded rows
        Payment.objects.filter(reference_number__startswith="SEED-").delete()
        Claim.objects.filter(claim_number__startswith="SEED-").delete()
        EncounterServiceLine.objects.filter(line_note="seed").delete()

        now = timezone.now()
        enc_seq = claim_seq = 0
        total_enc = total_lines = total_claims = total_pay = 0

        for k in range(8):  # last 8 months, 0 = current
            month_anchor = (now.replace(day=15) - timedelta(days=30 * k))
            y, m = month_anchor.year, month_anchor.month
            n_enc = random.randint(5, 10)

            for _ in range(n_enc):
                pat = random.choice(patients)
                prov = random.choice(providers)
                day = random.randint(1, 27)
                enc_date = month_anchor.replace(day=day)
                enc = Encounter.objects.create(
                    patient=pat,
                    rendering_provider=prov,
                    status="signed",
                    encounter_from_date=enc_date.date(),
                )
                # backdate created_at (auto_now_add) so monthly avg lines up
                Encounter.objects.filter(pk=enc.pk).update(created_at=enc_date)
                enc_seq += 1
                total_enc += 1

                charge_total = Decimal("0")
                for _ in range(random.randint(1, 3)):
                    code, desc, base = random.choice(CPTS)
                    units = random.randint(1, 2)
                    sl = EncounterServiceLine.objects.create(
                        encounter=enc,
                        date_from=enc_date.date(),
                        procedure_code=code,
                        description=desc,
                        units=units,
                        unit_charge=base,
                        line_note="seed",
                    )
                    charge_total += sl.total_charge
                    total_lines += 1

                # one claim per encounter
                status = random.choice(CLAIM_STATUSES)
                allowed = (charge_total * Decimal("0.80")).quantize(Decimal("0.01"))
                if status in ("Completed",):
                    paid = allowed
                elif status in ("Denials", "No Response"):
                    paid = Decimal("0.00")
                else:
                    paid = (allowed * Decimal("0.5")).quantize(Decimal("0.01"))
                balance = (charge_total - paid).quantize(Decimal("0.01"))
                claim_seq += 1
                Claim.objects.create(
                    encounter=enc,
                    claim_number=f"SEED-{y}{m:02d}-{claim_seq:04d}",
                    claim_type="837P",
                    status=status,
                    allowed=allowed,
                    paid=paid,
                    balance_due=balance,
                    charge_amount=charge_total,
                    rendering_provider=prov,
                    date_from=enc_date.date(),
                    date_to=enc_date.date(),
                )
                total_claims += 1

            # payments for the month (spread across payers)
            for _ in range(random.randint(4, 8)):
                payer = random.choice(PAYERS)
                amt = Decimal(random.randint(300, 3500))
                pay_day = random.randint(1, 27)
                pdate = month_anchor.replace(day=pay_day).date()
                p = Payment(
                    payer_name=payer,
                    source_type="ERA",
                    received_date=pdate,
                    deposit_date=pdate,
                    total_amount=amt,
                    status="POSTED",
                    reference_number=f"SEED-{y}{m:02d}-{total_pay:04d}",
                )
                p.save()
                total_pay += 1

        print(f"Seeded: {total_enc} encounters, {total_lines} service lines, "
              f"{total_claims} claims, {total_pay} payments across 8 months.")
