export const PATIENT = {
  name: "Lee Bishop",
  firstName: "Lee",
  lastName: "Bishop",
  legalName: "Shirley Bishop",
  mrn: "TEB-1324",
  dob: "1991-07-25",
  age: 33,
  sex: "Female",
  phone: "(866) 938 - 3272",
  insurance: "Aetna",
  photo: "/PersonPlaceholder.png",
};

export const PAST_NOTES = [
  { date: "10/25/2024", text: "I have a stuff..." },
  { date: "05/30/2024", text: "Return visit as..." },
  { date: "03/26/2024", text: "I have a stuffy..." },
  { date: "01/23/2023", text: "I have a stuff..." },
];

export const LABS = [
  { date: "02/11/21", name: "CBC; Lipid Panel" },
  { date: "05/28/20", name: "CBC" },
  { date: "06/01/20", name: "CBC; BUN ; Rapid S..." },
];

export const DOCUMENTS = [
  { date: "9/18/24", name: "Certificate-1...", type: "Patient Correspondence" },
  {
    date: "11/10/23",
    name: "Shirley_Bisho...",
    type: "Continuity of Care Received",
  },
  {
    date: "11/10/23",
    name: "Shirley_Bisho...",
    type: "Continuity of Care Received",
  },
  { date: "7/18/23", name: "COVID-19", type: "Other" },
];

export const NOTE_SECTIONS = [
  "Chief Complaint",
  "Subjective",
  "Medications",
  "Allergies",
  "Mental/Functional",
  "Vitals",
  "Objective",
  "Assessment",
  "Plan",
];

export const PROVIDERS = [
  { label: "Diana Hudson", value: "diana_hudson" },
  { label: "Dr. Smith", value: "dr_smith" },
];

export const noteTypes = [
  { label: "H&P", value: "H&P" },
  { label: "SOAP", value: "SOAP" },

  { label: "Acupuncture Initial Visit", value: "Acupuncture Initial Visit" },
  { label: "Acupuncture Follow Up", value: "Acupuncture Follow Up" },
  { label: "Acupuncture Reassessment", value: "Acupuncture Reassessment" },

  { label: "Amendment", value: "Amendment" },
  { label: "Consultation", value: "Consultation" },
  { label: "Discharge Summary", value: "Discharge Summary" },

  { label: "Group", value: "Group" },

  { label: "Med Spa Procedure", value: "Med Spa Procedure" },
  { label: "Med Spa IV Procedure", value: "Med Spa IV Procedure" },

  { label: "Memo to Record", value: "Memo to Record" },

  { label: "Nurse Visit", value: "Nurse Visit" },
  { label: "OB Evaluation", value: "OB Evaluation" },

  { label: "Office Form", value: "Office Form" },
  { label: "Phone", value: "Phone" },

  {
    label: "Physical Therapy Initial Evaluation",
    value: "Physical Therapy Initial Evaluation",
  },
  { label: "Physical Therapy Interim", value: "Physical Therapy Interim" },
  { label: "Physical Therapy Progress", value: "Physical Therapy Progress" },
  {
    label: "Physical Therapy Discharge Summary",
    value: "Physical Therapy Discharge Summary",
  },

  { label: "Procedure", value: "Procedure" },

  { label: "Psych Initial Visit", value: "Psych Initial Visit" },
  { label: "Psych Progress", value: "Psych Progress" },

  {
    label: "Speech and Language Initial Evaluation",
    value: "Speech and Language Initial Evaluation",
  },
  {
    label: "Speech and Language Progress Report",
    value: "Speech and Language Progress Report",
  },
  {
    label: "Speech and Language Treatment Note",
    value: "Speech and Language Treatment Note",
  },

  { label: "Telehealth H&P", value: "Telehealth H&P" },
  { label: "Telehealth SOAP", value: "Telehealth SOAP" },

  { label: "Therapist Initial Visit", value: "Therapist Initial Visit" },
  { label: "Therapist Progress", value: "Therapist Progress" },

  { label: "Urgent Care", value: "Urgent Care" },
];

export const noteSections = [
  { label: "CC", value: "CC" },
  { label: "HPI", value: "HPI" },
  { label: "Subjective", value: "Subjective" },
  { label: "Objective", value: "Objective" },
  { label: "EXAM", value: "EXAM" },
  { label: "Exam", value: "Exam" },
  {
    label: "Objective (Speech/Language)",
    value: "Objective (Speech/Language)",
  },

  { label: "PMHx", value: "PMHx" },
  { label: "PSHx", value: "PSHx" },
  { label: "FHx", value: "FHx" },
  { label: "Soc Hx", value: "Soc Hx" },
  { label: "Ob Preg Hx", value: "Ob Preg Hx" },
  { label: "Past Pregnancy Hx", value: "Past Pregnancy Hx" },

  { label: "Hospitalizations", value: "Hospitalizations" },
  { label: "Implantable Devices", value: "Implantable Devices" },
  { label: "ROS", value: "ROS" },

  { label: "Medications", value: "Medications" },
  { label: "Allergies", value: "Allergies" },
  { label: "Mental/Functional", value: "Mental/Functional" },
  { label: "Vitals", value: "Vitals" },

  { label: "Assessment", value: "Assessment" },
  { label: "Plan", value: "Plan" },
  { label: "Medical Decision Making", value: "Medical Decision Making" },

  { label: "Minor Procedures", value: "Minor Procedures" },
  { label: "Procedure", value: "Procedure" },
  { label: "Performed By", value: "Performed By" },
  { label: "Indication", value: "Indication" },

  { label: "Goals", value: "Goals" },
  { label: "Current Goals", value: "Current Goals" },
  { label: "Health Concerns", value: "Health Concerns" },

  { label: "Source of Request", value: "Source of Request" },
  { label: "Request Details", value: "Request Details" },
  { label: "Decision", value: "Decision" },

  { label: "Group Session Content", value: "Group Session Content" },
  { label: "Session Details", value: "Session Details" },
  {
    label: "Individual Behavior during Session",
    value: "Individual Behavior during Session",
  },

  { label: "DSM-5", value: "DSM-5" },
  { label: "MSE", value: "MSE" },

  { label: "PsychHx", value: "PsychHx" },
  { label: "PsychFHx", value: "PsychFHx" },
  { label: "PsychSHx", value: "PsychSHx" },
  { label: "Psych Symptom/Follow Up", value: "Psych Symptom/Follow Up" },
  { label: "Psych Syndromes", value: "Psych Syndromes" },
  { label: "Psych Impression", value: "Psych Impression" },
  { label: "Psych Intervention", value: "Psych Intervention" },

  { label: "Tests", value: "Tests" },
  { label: "Diagnostic Studies", value: "Diagnostic Studies" },
  { label: "Tests and Measures", value: "Tests and Measures" },

  { label: "Treatment", value: "Treatment" },

  { label: "History", value: "History" },
  { label: "Speech Development", value: "Speech Development" },
  {
    label: "Receptive/Expressive Language",
    value: "Receptive/Expressive Language",
  },
  { label: "Pragmatics", value: "Pragmatics" },
  { label: "Oral Mechanism Exam", value: "Oral Mechanism Exam" },
  { label: "Articulation", value: "Articulation" },
  { label: "Fluency", value: "Fluency" },
  { label: "Voice", value: "Voice" },

  { label: "Gestational Age", value: "Gestational Age" },
  { label: "OB Exam", value: "OB Exam" },
  { label: "Past Lab Hx", value: "Past Lab Hx" },

  { label: "Reason for Referral", value: "Reason for Referral" },

  { label: "Form", value: "Form" },
  { label: "Discussion", value: "Discussion" },

  { label: "Comments", value: "Comments" },
  { label: "Memo", value: "Memo" },
];

export const noteTypeSections = {
  "H&P": [
    "CC",
    "HPI",
    "PMHx",
    "PSHx",
    "FHx",
    "Soc Hx",
    "Ob Preg Hx",
    "Hospitalizations",
    "Implantable Devices",
    "ROS",
    "Medications",
    "Allergies",
    "Mental/Functional",
    "Vitals",
    "EXAM",
    "Assessment",
    "Plan",
    "Minor Procedures",
    "Goals",
    "Health Concerns",
  ],

  SOAP: [
    "CC",
    "Subjective",
    "Medications",
    "Allergies",
    "Mental/Functional",
    "Vitals",
    "Objective",
    "Assessment",
    "Plan",
  ],

  "Acupuncture Initial Visit": [
    "CC",
    "Subjective",
    "Medications",
    "Allergies",
    "Objective",
    "TCM Exam",
    "Assessment",
    "Plan",
    "Treatment",
  ],

  "Acupuncture Follow Up": [
    "CC",
    "Subjective",
    "Medications",
    "Allergies",
    "Objective",
    "TCM Exam",
    "Assessment",
    "Plan",
    "Treatment",
  ],

  "Acupuncture Reassessment": [
    "CC",
    "Subjective",
    "Medications",
    "Allergies",
    "Objective",
    "TCM Exam",
    "Assessment",
    "Plan",
    "Treatment",
  ],

  Amendment: ["Source of Request", "Request Details", "Decision"],

  Consultation: [
    "CC",
    "HPI",
    "PMHx",
    "PSHx",
    "FHx",
    "Soc Hx",
    "Ob Preg Hx",
    "Hospitalizations",
    "Implantable Devices",
    "ROS",
    "Medications",
    "Allergies",
    "Mental/Functional",
    "Vitals",
    "EXAM",
    "Assessment",
    "Plan",
    "Minor Procedures",
    "Goals",
    "Health Concerns",
  ],

  "Discharge Summary": [
    "CC",
    "HPI",
    "PMHx",
    "PSHx",
    "FHx",
    "Soc Hx",
    "Ob Preg Hx",
    "Hospitalizations",
    "Implantable Devices",
    "ROS",
    "Medications",
    "Allergies",
    "Mental/Functional",
    "Vitals",
    "EXAM",
    "Assessment",
    "Plan",
    "Minor Procedures",
    "Goals",
    "Health Concerns",
  ],

  Group: [
    "Group Session Content",
    "Session Details",
    "Individual Behavior during Session",
    "DSM-5",
    "Assessment",
    "Plan",
  ],

  "Med Spa Procedure": ["Procedure", "Performed By", "Indication", "Comments"],

  "Med Spa IV Procedure": [
    "Procedure",
    "Performed By",
    "Indication",
    "Comments",
  ],

  "Memo to Record": ["Memo"],

  "Nurse Visit": [
    "HPI",
    "PMHx",
    "PSHx",
    "FHx",
    "Soc Hx",
    "Ob Preg Hx",
    "Hospitalizations",
    "Medications",
    "Allergies",
    "Vitals",
  ],

  "OB Evaluation": [
    "CC",
    "HPI",
    "PMHx",
    "PSHx",
    "FHx",
    "Soc Hx",
    "Ob Preg Hx",
    "Past Pregnancy Hx",
    "Hospitalizations",
    "Medications",
    "Allergies",
    "Mental/Functional",
    "Vitals",
    "Exam",
    "Gestational Age",
    "OB Exam",
    "Past Lab Hx",
    "Assessment",
    "Plan",
  ],

  "Office Form": ["Form"],

  Phone: ["Discussion"],

  "Physical Therapy Initial Evaluation": [
    "Reason for Referral",
    "Subjective",
    "Medications",
    "Vitals",
    "Objective",
    "Tests and Measures",
    "Treatment",
    "Assessment",
    "Plan",
  ],

  "Physical Therapy Interim": [
    "Reason for Referral",
    "Subjective",
    "Medications",
    "Vitals",
    "Objective",
    "Tests and Measures",
    "Treatment",
    "Assessment",
    "Plan",
  ],

  "Physical Therapy Progress": [
    "Medications",
    "Vitals",
    "Objective",
    "Tests and Measures",
    "Treatment",
    "Assessment",
    "Plan",
  ],

  "Physical Therapy Discharge Summary": [
    "Reason for Referral",
    "Subjective",
    "Objective",
    "Tests and Measures",
    "Treatment",
    "Assessment",
    "Plan",
  ],

  Procedure: ["Procedure", "Performed By", "Indication", "Comments"],

  "Psych Initial Visit": [
    "CC",
    "HPI",
    "PsychHx",
    "PMHx",
    "PSHx",
    "PsychFHx",
    "PsychSHx",
    "Medications",
    "MSE",
    "Tests",
    "Psych Impression",
    "DSM-5",
    "Assessment",
    "Plan",
  ],

  "Psych Progress": [
    "CC",
    "Psych Symptom/Follow Up",
    "Psych Syndromes",
    "Medications",
    "MSE",
    "Psych Impression",
    "DSM-5",
    "Psych Intervention",
    "Assessment",
    "Plan",
  ],

  "Speech and Language Initial Evaluation": [
    "CC",
    "History",
    "Speech Development",
    "Receptive/Expressive Language",
    "Pragmatics",
    "Oral Mechanism Exam",
    "Articulation",
    "Fluency",
    "Voice",
    "Assessment",
    "Plan",
    "Goals",
  ],

  "Speech and Language Progress Report": [
    "CC",
    "Subjective",
    "Current Goals",
    "Receptive/Expressive Language",
    "Pragmatics",
    "Oral Mechanism Exam",
    "Articulation",
    "Fluency",
    "Voice",
    "Assessment",
    "Plan",
    "Goals",
  ],

  "Speech and Language Treatment Note": [
    "CC",
    "Subjective",
    "Objective (Speech/Language)",
    "Assessment",
    "Plan",
    "Goals",
  ],

  "Telehealth H&P": [
    "CC",
    "HPI",
    "PMHx",
    "PSHx",
    "FHx",
    "Soc Hx",
    "Ob Preg Hx",
    "Hospitalizations",
    "Implantable Devices",
    "ROS",
    "Medications",
    "Allergies",
    "Mental/Functional",
    "Vitals",
    "EXAM",
    "Assessment",
    "Plan",
    "Goals",
    "Health Concerns",
  ],

  "Telehealth SOAP": [
    "CC",
    "Subjective",
    "Medications",
    "Allergies",
    "Mental/Functional",
    "Vitals",
    "Objective",
    "Assessment",
    "Plan",
  ],

  "Therapist Initial Visit": [
    "CC",
    "HPI",
    "PsychHx",
    "PsychFHx",
    "PsychSHx",
    "Medications",
    "MSE",
    "Tests",
    "Psych Impression",
    "DSM-5",
    "Assessment",
    "Plan",
  ],

  "Therapist Progress": [
    "CC",
    "Psych Symptom/Follow Up",
    "Psych Syndromes",
    "Medications",
    "MSE",
    "Psych Impression",
    "DSM-5",
    "Psych Intervention",
    "Assessment",
    "Plan",
  ],

  "Urgent Care": [
    "CC",
    "HPI",
    "PMHx",
    "PSHx",
    "FHx",
    "Soc Hx",
    "Hospitalizations",
    "ROS",
    "Medications",
    "Allergies",
    "Vitals",
    "Exam",
    "Diagnostic Studies",
    "Medical Decision Making",
    "Assessment",
    "Plan",
    "Minor Procedures",
  ],
};
