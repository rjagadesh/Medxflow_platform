export type Status =
  | "Received" | "Extracting" | "Manual Review" | "Extracted" | "Duplicate"
  | "Pending Review" | "Eligibility Verified" | "Auto Approved" | "Assigned"
  | "Scheduled" | "Awaiting Authorization" | "Authorized" | "Completed"
  | "No Show" | "Cancelled" | "Redirected" | "Extraction Failed" | "Expired";

export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type Source = "Fax" | "Email" | "Portal" | "Phone" | "EHR";
export type DocType = "Typed" | "Hand written" | "Scanned" | "Mixed";

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number; // 0..1
}

export interface DocumentFile {
  id: string;
  name: string;
  pages: number;
  sizeKb: number;
  url: string;
}

export interface TimelineEvent {
  status: Status;
  at: string;       // ISO
  note: string;
  by?: string;
}

export interface Eligibility {
  status: "Verified" | "Inactive" | "Pending" | "Not checked";
  plan?: string;
  copay?: string;
  checkedAt?: string;
}

export interface PriorAuth {
  status: "Not required" | "Required" | "Submitted" | "Approved" | "Denied";
  authNumber?: string;
  notes?: string;
}

export interface Referral {
  id: number;
  patientName: string;
  dob: string;
  insuranceId: string;
  payer: string;
  specialty: string;
  urgency: Priority;
  serviceRequested: string;
  referralDate: string;
  referringProvider: string;
  providerNpi: string;
  icd10: string[];
  cpt: string[];
  reason: string;
  status: Status;
  priority: Priority;
  source: Source;
  docType: DocType;
  assignee: string | null;
  slaDue: string;    // ISO
  createdAt: string; // ISO
  fields: ExtractedField[];
  documents: DocumentFile[];
  timeline: TimelineEvent[];
  eligibility: Eligibility;
  priorAuth: PriorAuth;
  appointment: string | null;
  needsReview: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Coordinator" | "Reviewer";
  capacity: number;
  skills: string[];
  active: boolean;
  openCount: number;
}
