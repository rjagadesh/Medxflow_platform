"""
Seed demo data for the MedXFlow PMS local stack.

Public schema:  a demo Client (EMR tenant) + Modules/Apps for the home grid,
                and attaches the demo users to the client.
Tenant schema:  providers, patients, appointments and practice-settings rows
                so the PMS/EMR screens have content.

Run:  ./venv/bin/python manage.py shell < seed_demo_data.py
Idempotent: safe to run more than once (uses get_or_create).
"""
import os, django, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cloudproject.settings")
try:
    django.setup()
except Exception:
    pass

from datetime import date, time, datetime as dt, timedelta
from django_tenants.utils import schema_context
from accounts.models import Client, User
from modules.models import Module, App

print("\n==================  SEEDING DEMO DATA  ==================\n")

# ---------------------------------------------------------------------------
# 1) PUBLIC: demo Client (EMR tenant -> creates its own schema on save)
# ---------------------------------------------------------------------------
client, created = Client.objects.get_or_create(
    client_name="MedXFlow Demo Clinic",
    defaults=dict(license_tier="enterprise", has_emr_module=True, status="active"),
)
if created and not client.has_emr_module:
    client.has_emr_module = True
    client.save()
print(f"Client: {client.client_name}  id={client.id}  schema={client.schema_name}  ({'created' if created else 'exists'})")
SCHEMA = client.schema_name

# ---------------------------------------------------------------------------
# 2) PUBLIC: attach demo users to the client + give bypass role
# ---------------------------------------------------------------------------
for uname in ("droidal_user", "admin"):
    try:
        u = User.objects.get(username=uname)
        u.client = client
        u.roles = "client"          # frontend usePermissions() bypasses all checks for "client"
        u.is_active = True
        u.save()
        print(f"User {uname}: client={u.client_id}, roles={u.roles}")
    except User.DoesNotExist:
        print(f"User {uname}: NOT FOUND (skipped)")

# ---------------------------------------------------------------------------
# 3) PUBLIC: Modules + Apps for the home grid (is_system=True -> visible to all)
#    The frontend's default landing decodes to module_id=3, so order matters:
#    create on an empty table so ids become 1,2,3,...
# ---------------------------------------------------------------------------
MODULES = [
    ("Voice AI",        ["Inbound Agent", "Outbound Agent", "Call Analytics"]),
    ("Smart Drive",     ["Documents", "Minutes of Meeting"]),
    ("Patient Intake",  ["Eligibility Check", "Patient Registration", "Insurance Discovery"]),
    ("PMS / EHR",       ["Patient Dashboard", "Appointments", "Claims", "Encounters"]),
    ("ROI Analytics",   ["ROI Dashboard", "Effort Tracker"]),
]
for mname, apps in MODULES:
    m, mc = Module.objects.get_or_create(module_name=mname, defaults=dict(is_system=True, is_active=True))
    if not m.is_system:
        m.is_system = True; m.save()
    for aname in apps:
        App.objects.get_or_create(module=m, app_name=aname, defaults=dict(is_system=True, is_active=True))
    print(f"Module #{m.id} '{m.module_name}': {m.apps.count()} apps")

# ---------------------------------------------------------------------------
# 4) TENANT schema: PMS / EMR content
# ---------------------------------------------------------------------------
print(f"\n--- Seeding tenant schema: {SCHEMA} ---")
with schema_context(SCHEMA):
    from tenant_app.models import PatientProvider, Patient, Appointment
    from tenant_encounter.models import ServiceLocation
    from practicesettings.models import (
        PracticeInformation, ServiceCode, VisitReason, Room, Equipment,
        InsuranceCompany, InsurancePlan, FeeScheduleEntry, PracticeHoliday,
    )

    # Practice information
    PracticeInformation.objects.get_or_create(
        name="MedXFlow Demo Clinic",
        defaults=dict(address="123 Main St, Suite 400, Springfield, IL 62704",
                      phone="2025550100", fax="2025550101", language="en"),
    )

    # Service locations
    loc, _ = ServiceLocation.objects.get_or_create(
        name="Main Clinic",
        defaults=dict(address1="123 Main St, Suite 400", city="Springfield",
                      state="IL", zip_code="62704", place_of_service_code="11"),
    )
    ServiceLocation.objects.get_or_create(
        name="Downtown Branch",
        defaults=dict(address1="500 Oak Ave", city="Springfield",
                      state="IL", zip_code="62701", place_of_service_code="11"),
    )

    # Providers
    providers = []
    PROV = [
        ("Sarah", "Johnson", "1326483579", "sarah.johnson@medxflow-demo.test"),
        ("Michael", "Lee",   "1457902468", "michael.lee@medxflow-demo.test"),
        ("Emily", "Carter",  "1689043215", "emily.carter@medxflow-demo.test"),
    ]
    for fn, ln, npi, email in PROV:
        p, _ = PatientProvider.objects.get_or_create(
            email=email,
            defaults=dict(first_name=fn, last_name=ln, NPI=npi,
                          date_of_birth=dt(1980, 1, 1), practice_name="MedXFlow Demo Clinic",
                          address="123 Main St", city="Springfield", zipcode="62704",
                          state="IL", country="United States", specialty="Family Medicine"),
        )
        providers.append(p)
    print(f"Providers: {PatientProvider.objects.count()}")

    # Patients
    PATIENTS = [
        ("Melissa", "Dias",    "Female", date(1964, 7, 2),  "2025550001", "melissa.dias@demo.test"),
        ("James",   "Walker",  "Male",   date(1978, 3, 15), "2025550002", "james.walker@demo.test"),
        ("Linda",   "Martinez","Female", date(1990, 11, 5), "2025550003", "linda.martinez@demo.test"),
        ("Robert",  "Brown",   "Male",   date(1955, 1, 22), "2025550004", "robert.brown@demo.test"),
        ("Patricia","Garcia",  "Female", date(2001, 9, 30), "2025550005", "patricia.garcia@demo.test"),
        ("David",   "Wilson",  "Male",   date(1985, 6, 12), "2025550006", "david.wilson@demo.test"),
    ]
    patients = []
    for fn, ln, gender, dob, phone, email in PATIENTS:
        pt, _ = Patient.objects.get_or_create(
            email=email,
            defaults=dict(first_name=fn, last_name=ln, gender=gender, dob=dob,
                          mobile_phone=phone, address="123 Main St, Springfield, IL 62704",
                          default_rendering_provider=providers[0] if providers else None),
        )
        patients.append(pt)
    print(f"Patients: {Patient.objects.count()}")

    # Appointments (several today for the dashboard, plus upcoming)
    today = date(2026, 6, 30)
    slots = [time(9, 0), time(10, 30), time(13, 0), time(14, 30), time(16, 0)]
    appt_types = ["patient", "telehealth_appointment", "patient", "other", "patient"]
    made = 0
    for i, pt in enumerate(patients[:5]):
        prov = providers[i % len(providers)]
        _, c = Appointment.objects.get_or_create(
            patient=pt, provider=prov, date=today, time=slots[i],
            defaults=dict(duration="30", type=appt_types[i],
                          confirmationstatus="confirmed", location="Main Clinic",
                          reason="Follow-up visit"),
        )
        made += int(c)
    # a couple upcoming days
    for i, pt in enumerate(patients[:3]):
        _, c = Appointment.objects.get_or_create(
            patient=pt, provider=providers[i % len(providers)],
            date=today + timedelta(days=i + 1), time=time(11, 0),
            defaults=dict(duration="45", type="patient",
                          confirmationstatus="pending", location="Main Clinic",
                          reason="New consultation"),
        )
        made += int(c)
    print(f"Appointments total: {Appointment.objects.count()}")

    # Service codes + visit reasons
    sc1, _ = ServiceCode.objects.get_or_create(name="Office Visit - New", procedures="99203")
    sc2, _ = ServiceCode.objects.get_or_create(name="Office Visit - Established", procedures="99213")
    sc3, _ = ServiceCode.objects.get_or_create(name="Telehealth Consult", procedures="99421")
    VisitReason.objects.get_or_create(name="New Patient Visit", service=sc1,
                                      defaults=dict(duration=45, color="#4F46E5"))
    VisitReason.objects.get_or_create(name="Follow-up", service=sc2,
                                      defaults=dict(duration=30, color="#059669"))
    VisitReason.objects.get_or_create(name="Telehealth", service=sc3,
                                      defaults=dict(duration=20, color="#D97706"))

    # Rooms / equipment
    for r in ("Exam Room 1", "Exam Room 2", "Procedure Room"):
        Room.objects.get_or_create(name=r)
    for e in ("ECG Machine", "Ultrasound", "Vitals Monitor"):
        Equipment.objects.get_or_create(name=e)

    # Insurance company + plan + fee schedule
    ic, _ = InsuranceCompany.objects.get_or_create(
        stedi_id="BCBSTX001",
        defaults=dict(payer_id="BCBSTX", name="Blue Cross Blue Shield of Texas", clearinghouse="STEDI"),
    )
    InsurancePlan.objects.get_or_create(
        insurance_company=ic, plan_name="BCBS PPO Gold",
        defaults=dict(address_street1="200 Insurance Way", address_city="Dallas",
                      address_state="TX", address_zip="75201"),
    )
    FeeScheduleEntry.objects.get_or_create(
        procedure_code="99213",
        defaults=dict(par_amount=85.00, non_par_amount=75.00, limiting_charge_amount=90.00, currency="USD"),
    )
    FeeScheduleEntry.objects.get_or_create(
        procedure_code="99203",
        defaults=dict(par_amount=150.00, non_par_amount=130.00, limiting_charge_amount=160.00, currency="USD"),
    )

    # Holiday
    PracticeHoliday.objects.get_or_create(name="Independence Day", date=date(2026, 7, 4))

    print(f"ServiceCodes={ServiceCode.objects.count()} VisitReasons={VisitReason.objects.count()} "
          f"Rooms={Room.objects.count()} Equipment={Equipment.objects.count()} "
          f"InsuranceCompanies={InsuranceCompany.objects.count()} FeeSchedule={FeeScheduleEntry.objects.count()}")

print("\n==================  SEEDING COMPLETE  ==================\n")
