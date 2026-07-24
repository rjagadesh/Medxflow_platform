import type {
  Referral, User, Status, Priority, Source, DocType, ExtractedField,
} from "../types";
import { STATUSES } from "../lib/constants";

// --- deterministic pseudo-random so the demo is stable across reloads ---
let seed = 20260720;
function rnd() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
const between = (lo: number, hi: number) => Math.floor(lo + rnd() * (hi - lo + 1));

const FIRST = ["Jane", "John", "Maria", "David", "Aisha", "Liam", "Sofia", "Noah", "Emma", "Omar", "Grace", "Ethan", "Mia", "Lucas", "Ava", "Ravi", "Chloe", "Sam", "Nadia", "Leo"];
const LAST = ["Doe", "Roe", "Garcia", "Chen", "Patel", "Okoro", "Rossi", "Nguyen", "Khan", "Silva", "Brown", "Kim", "Lopez", "Haddad", "Meyer", "Reed", "Sato", "Ali", "Fox", "Cole"];
const SPECIALTIES = ["Cardiology", "Orthopedics", "Dermatology", "Neurology", "Gastroenterology", "Endocrinology", "Pulmonology", "Oncology", "ENT", "Rheumatology"];
const PAYERS = ["Aetna", "Cigna", "UnitedHealthcare", "BCBS", "Humana", "Medicare", "Medicaid"];
const PROVIDERS = ["Dr. A. Chen", "Dr. M. Okoro", "Dr. L. Rossi", "Dr. S. Patel", "Dr. K. Nguyen", "Dr. J. Reed"];
const ICD = ["M54.5", "I10", "E11.9", "J45.909", "K21.9", "R51", "M25.561", "G43.909"];
const CPT = ["99213", "99244", "93000", "70551", "45378", "20610", "76700"];
const SERVICES = ["Consultation", "Diagnostic imaging", "Follow-up visit", "Procedure eval", "Second opinion"];

export const USERS: User[] = [
  { id: 1, name: "Alex Rivera", email: "alex@referralops.io", role: "Admin", capacity: 25, skills: ["Cardiology", "Triage"], active: true, openCount: 6 },
  { id: 2, name: "Priya Shah", email: "priya@referralops.io", role: "Coordinator", capacity: 20, skills: ["Orthopedics", "Scheduling"], active: true, openCount: 11 },
  { id: 3, name: "Marcus Lee", email: "marcus@referralops.io", role: "Coordinator", capacity: 20, skills: ["Neurology", "Auth"], active: true, openCount: 4 },
  { id: 4, name: "Dana Cole", email: "dana@referralops.io", role: "Reviewer", capacity: 30, skills: ["Review", "Dermatology"], active: true, openCount: 14 },
  { id: 5, name: "Sam Fox", email: "sam@referralops.io", role: "Reviewer", capacity: 15, skills: ["Review"], active: false, openCount: 0 },
];
const ASSIGNEES = USERS.map((u) => u.name);

function iso(daysFromNow: number, hour = 9) {
  const d = new Date("2026-07-20T09:00:00Z");
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  d.setUTCHours(hour, between(0, 59), 0, 0);
  return d.toISOString();
}

function fieldsFor(r: Partial<Referral>): ExtractedField[] {
  const conf = () => Math.round((0.55 + rnd() * 0.45) * 100) / 100;
  return [
    { key: "patientName", label: "Patient name", value: r.patientName!, confidence: conf() },
    { key: "dob", label: "DOB", value: r.dob!, confidence: conf() },
    { key: "insuranceId", label: "Insurance ID", value: r.insuranceId!, confidence: conf() },
    { key: "payer", label: "Payer", value: r.payer!, confidence: conf() },
    { key: "specialty", label: "Specialty", value: r.specialty!, confidence: conf() },
    { key: "urgency", label: "Urgency", value: r.urgency!, confidence: conf() },
    { key: "serviceRequested", label: "Service requested", value: r.serviceRequested!, confidence: conf() },
    { key: "referralDate", label: "Referral date", value: r.referralDate!, confidence: conf() },
    { key: "referringProvider", label: "Referring provider", value: r.referringProvider!, confidence: conf() },
    { key: "providerNpi", label: "Provider NPI", value: r.providerNpi!, confidence: conf() },
    { key: "icd10", label: "ICD-10 codes", value: (r.icd10 || []).join(", "), confidence: conf() },
    { key: "cpt", label: "CPT codes", value: (r.cpt || []).join(", "), confidence: conf() },
    { key: "reason", label: "Reason / notes", value: r.reason!, confidence: conf() },
  ];
}

function makeReferral(id: number): Referral {
  const patientName = `${pick(FIRST)} ${pick(LAST)}`;
  const specialty = pick(SPECIALTIES);
  const priority = pick<Priority>(["Low", "Medium", "High", "Urgent"]);
  const source = pick<Source>(["Fax", "Email", "Portal", "Phone", "EHR"]);
  const docType = pick<DocType>(["Typed", "Hand written", "Scanned", "Mixed"]);
  const status = STATUSES[(id * 7) % STATUSES.length];
  const createdDays = -between(0, 20);
  const base: Partial<Referral> = {
    id, patientName,
    dob: `${between(1, 12)}`.padStart(2, "0") + "/" + `${between(1, 28)}`.padStart(2, "0") + "/" + between(1950, 2010),
    insuranceId: pick(["A", "B", "C", "X", "Z"]) + between(10000000, 99999999),
    payer: pick(PAYERS),
    specialty, urgency: priority,
    serviceRequested: pick(SERVICES),
    referralDate: iso(createdDays).slice(0, 10),
    referringProvider: pick(PROVIDERS),
    providerNpi: `${between(1000000000, 1999999999)}`,
    icd10: [pick(ICD), pick(ICD)].filter((v, i, a) => a.indexOf(v) === i),
    cpt: [pick(CPT)],
    reason: `${specialty} evaluation requested — ${pick(["worsening symptoms", "abnormal findings", "chronic condition follow-up", "pre-op clearance"])}.`,
  };
  const needsReview = status === "Manual Review" || status === "Pending Review";
  const slaHours = priority === "Urgent" ? 8 : priority === "High" ? 24 : 72;
  const timeline = buildTimeline(status, createdDays);
  return {
    ...(base as Referral),
    status, priority, source, docType,
    assignee: ["Received", "Extracting", "Extraction Failed"].includes(status) ? null : pick(ASSIGNEES),
    slaDue: iso(createdDays + slaHours / 24, between(8, 18)),
    createdAt: iso(createdDays, between(7, 19)),
    fields: fieldsFor(base),
    documents: [
      { id: `d${id}-1`, name: `referral_${id}.pdf`, pages: between(1, 4), sizeKb: between(80, 900), url: "" },
      ...(rnd() > 0.6 ? [{ id: `d${id}-2`, name: `insurance_card_${id}.jpg`, pages: 1, sizeKb: between(120, 400), url: "" }] : []),
    ],
    timeline,
    eligibility: {
      status: pick(["Verified", "Pending", "Inactive", "Not checked"]),
      plan: pick(["PPO", "HMO", "EPO"]), copay: `$${pick([20, 30, 40, 50])}`,
      checkedAt: iso(createdDays + 1),
    },
    priorAuth: {
      status: pick(["Not required", "Required", "Submitted", "Approved", "Denied"]),
      authNumber: rnd() > 0.5 ? `PA${between(1000000, 9999999)}` : "",
      notes: "",
    },
    appointment: ["Scheduled", "Completed", "No Show"].includes(status) ? iso(createdDays + between(2, 10), between(9, 16)) : null,
    needsReview,
  };
}

function buildTimeline(status: Status, createdDays: number) {
  const flow: Status[] = ["Received", "Extracting", "Extracted", "Eligibility Verified", "Assigned", "Scheduled", "Completed"];
  const idx = Math.max(1, flow.indexOf(status) + 1 || 3);
  const notes: Record<string, string> = {
    Received: "Referral received via intake.",
    Extracting: "Document sent to extraction.",
    Extracted: "Fields extracted; confidence scored.",
    "Eligibility Verified": "Coverage confirmed with payer.",
    Assigned: "Assigned to coordinator.",
    Scheduled: "Appointment booked.",
    Completed: "Visit completed and closed.",
  };
  return flow.slice(0, idx).map((s, i) => ({
    status: s, at: iso(createdDays + i * 0.5, 9 + i),
    note: notes[s] || `Moved to ${s}.`, by: i === 0 ? "System" : pick(ASSIGNEES),
  })).concat(status !== flow[idx - 1] ? [{ status, at: iso(createdDays + idx * 0.5, 12), note: `Moved to ${status}.`, by: pick(ASSIGNEES) }] : []);
}

export function seedReferrals(): Referral[] {
  seed = 20260720;
  return Array.from({ length: 42 }, (_, i) => makeReferral(i + 1001));
}
