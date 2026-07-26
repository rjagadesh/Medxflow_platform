import { DiGoogleAnalytics } from "react-icons/di";

const frameworks = {
  items: [
    {
      label: "Dental / DSO Practice",
      value: "Dental / DSO Practice",
      url: "",
      items: [
        {
          name: "Home",
          url: "home",
          header: [
            {
              name: "Dashboard",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/dental/platform/dashboard",
            },
            {
              name: "Patients",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/dental/platform/patientview",
            },
            {
              name: "Appointment",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/dental/platform/appointment-view",
            },
            {
              name: "Provider",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/dental/platform/providerview",
            },
            {
              name: "Documents",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/settings/platform/api-secret-keys",
            },
            {
              name: "Patient Communications",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/practice-settings?tab=Patient Communications",
            },
          ],
        },
        {
          name: "Clinical",
          url: "clinical",
          header: [
            {
              name: "Clinical Tasks",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/clinical/tasklist",
            },
            {
              name: "eRx Requests",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/platform/patientview",
            },
            {
              name: "Open Notes",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/platform/appointment-view",
            },
            {
              name: "Referrals",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/platform/providerview",
            },
            {
              name: "Charges",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/settings/platform/api-secret-keys",
            },
            {
              name: "Clinical Reports",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/practice-settings?tab=Patient Communications",
            },
            {
              name: "Medical Promoting Interoperability(MIPS)",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/settings/platform/api-secret-keys",
            },
            {
              name: "Quality Measures",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/practice-settings?tab=Patient Communications",
            },
          ],
        },
        {
          name: "Encounter",
          url: "encounter",
        },
        {
          name: "Billing",
          url: "billing/charges",
          header: [
            {
              name: "Charges",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/dental/billing/charges",
            },
            {
              name: "Insurance Collections",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/dental/billing/insurance-collections",
            },
            {
              name: "Patient Collections",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/dental/billing/patient-collections",
            },
            {
              name: "Automated Patient Billing",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/dental/billing/automated-billing",
            },
            {
              name: "Analytics",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/dental/billing/analytics",
            },
          ],
        },

        {
          name: "Engage",
          url: "engage",
          header: [
            {
              name: "Performance Dashboard",
              to: "/engage/performance-dashboard",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
            },
            {
              name: "Surveys & Reviews",
              to: "/engage/surveys-reviews",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
            },
            {
              name: "Online Presence",
              to: "/engage/online-presence",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
            },
            {
              name: "Patient Broadcast",
              to: "/engage/patient-broadcast",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
            },
            {
              name: "Patient Intake",
              to: "/engage/patient-intake",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
            },
            {
              name: "Explore Patient Experience →",
              to: "/engage/patient-experience",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
            },
          ],
        },

        {
          name: "Payments",
          url: "payments",
          header: [
            {
              name: "Payments Hub",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/dashboard",
            },
            {
              name: "Virtual Card",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/patientview",
            },
          ],
        },
        {
          name: "Analytics",
          url: "analytics",
          header: [],
        },
        {
          name: "TeleHealth",
          url: "telehealth",
          header: [
            {
              name: "Dashboard",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/dashboard",
            },
            {
              name: "Patients",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/patientview",
            },
            {
              name: "Appointment",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/appointment-view",
            },
            {
              name: "Provider",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/providerview",
            },
            {
              name: "Documents",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/settings/api-secret-keys",
            },
            {
              name: "Patient Communications",
              icon: <DiGoogleAnalytics className="text-xl text-current" />,
              to: "/pms/practice-settings?tab=Patient Communications",
            },
          ],
        },
        {
          name: "Platform Settings",
          url: "platform-settings",
          header: [],
        },
      ],
    },

    {
      label: "Eye Care (Ophthalmology / Optometry)",
      value: "Eye Care (Ophthalmology / Optometry)",
      items: [
        { name: "Platform", url: "platform" },
        { name: "Clinical", url: "clinical" },
        { name: "Billing", url: "billing" },
        { name: "Engage", url: "engage" },
        { name: "Payments", url: "payments" },
        { name: "Analytics", url: "analytics" },
        { name: "Telehealth", url: "Telehealth" },
      ],
      url: "",
    },

    {
      label: "Primary Care / Family Medicine / Internal Medicine",
      value: "Primary Care / Family Medicine / Internal Medicine",
      items: [
        { name: "Platform", url: "platform" },
        { name: "Clinical", url: "clinical" },
        { name: "Billing", url: "billing" },
        { name: "Engage", url: "engage" },
        { name: "Payments", url: "payments" },
        { name: "Analytics", url: "analytics" },
        { name: "Telehealth", url: "Telehealth" },
      ],
      url: "",
    },

    {
      label: "Orthopedics / Sports Medicine / PM&R",
      value: "Orthopedics / Sports Medicine / PM&R",
      items: [
        { name: "Platform", url: "platform" },
        { name: "Clinical", url: "clinical" },
        { name: "Billing", url: "billing" },
        { name: "Engage", url: "engage" },
        { name: "Payments", url: "payments" },
        { name: "Analytics", url: "analytics" },
        { name: "Telehealth", url: "Telehealth" },
      ],
      url: "",
    },

    {
      label: "Behavioral Health / Psychiatry",
      value: "Behavioral Health / Psychiatry",
      items: [
        { name: "Platform", url: "platform" },
        { name: "Clinical", url: "clinical" },
        { name: "Billing", url: "billing" },
        { name: "Engage", url: "engage" },
        { name: "Payments", url: "payments" },
        { name: "Analytics", url: "analytics" },
        { name: "Telehealth", url: "Telehealth" },
      ],
      url: "",
    },

    {
      label: "OB/GYN",
      value: "OB/GYN",
      items: [
        { name: "Platform", url: "platform" },
        { name: "Clinical", url: "clinical" },
        { name: "Billing", url: "billing" },
        { name: "Engage", url: "engage" },
        { name: "Payments", url: "payments" },
        { name: "Analytics", url: "analytics" },
        { name: "Telehealth", url: "Telehealth" },
      ],
      url: "",
    },

    {
      label: "Pediatrics",
      value: "Pediatrics",
      items: [
        { name: "Platform", url: "platform" },
        { name: "Clinical", url: "clinical" },
        { name: "Billing", url: "billing" },
        { name: "Engage", url: "engage" },
        { name: "Payments", url: "payments" },
        { name: "Analytics", url: "analytics" },
        { name: "Telehealth", url: "Telehealth" },
      ],
      url: "",
    },

    {
      label: "Veterinary (Small Animal / Equine / Exotic)",
      value: "Veterinary (Small Animal / Equine / Exotic)",
      items: [
        { name: "Platform", url: "platform" },
        { name: "Clinical", url: "clinical" },
        { name: "Billing", url: "billing" },
        { name: "Engage", url: "engage" },
        { name: "Payments", url: "payments" },
        { name: "Analytics", url: "analytics" },
        { name: "Telehealth", url: "Telehealth" },
      ],
      url: "",
    },

    {
      label: "Urgent Care / Walk-In Clinics",
      value: "Urgent Care / Walk-In Clinics",
      items: [
        { name: "Platform", url: "platform" },
        { name: "Clinical", url: "clinical" },
        { name: "Billing", url: "billing" },
        { name: "Engage", url: "engage" },
        { name: "Payments", url: "payments" },
        { name: "Analytics", url: "analytics" },
        { name: "Telehealth", url: "Telehealth" },
      ],
      url: "",
    },

    {
      label: "Multi-Specialty or General Outpatient",
      value: "Multi-Specialty or General Outpatient",
      items: [
        { name: "Platform", url: "platform" },
        { name: "Clinical", url: "clinical" },
        { name: "Billing", url: "billing" },
        { name: "Engage", url: "engage" },
        { name: "Payments", url: "payments" },
        { name: "Analytics", url: "analytics" },
        { name: "Telehealth", url: "Telehealth" },
      ],
      url: "",
    },
  ],
};

export default frameworks;
