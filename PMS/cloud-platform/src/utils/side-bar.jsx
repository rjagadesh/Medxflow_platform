import { IoLogoXbox } from "react-icons/io5";
import { RiChatPollLine } from "react-icons/ri";
import { DiGoogleAnalytics } from "react-icons/di";

const sidebar = [
  {
    name: "Dashboard",
    icon: <IoLogoXbox className="text-xl text-current" />,
    to: (suffix) => suffix + "",
    end: true,
  },
  {
    name: "Request",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: (suffix) => suffix + "/requests",
  },
  {
    name: "Agent Configuration",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: (suffix) => suffix + "/agent-config",
  },
  // {
  //   name: "Analytics",
  //   icon: <DiGoogleAnalytics className="text-xl text-current" />,
  //   to: (suffix) => suffix + "/analytics",
  // },
];
const abaSidebar = [
  {
    name: "Dashboard",
    icon: <IoLogoXbox className="text-xl text-current" />,
    to: "/aba",
    end: true,
  },
  {
    name: "Trigger",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/aba/trigger",
  },

  {
    name: "Machine",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/aba/machine",
  },
  {
    name: "Workspace",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/aba/workspace",
  },
];
const roiSideBar = [
  {
    name: "Estimations",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/roi",
    end: true,
  },
  {
    name: "Actual Savings",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/roi/actual",
  },
];
const voiceAiSideBar = [
  {
    name: "Home",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/voice-ai/voice-ai-MTA=",
    end: true,
  },
  {
    name: "Configurations",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: (suffix) => suffix + "/configurations",
  },
  {
    name: "Call Script",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: (suffix) => suffix + "/call-script",
  },
  // {
  //   name: "Input",
  //   icon: <DiGoogleAnalytics className="text-xl text-current" />,
  //   to: (suffix) => suffix + "/input",
  // },
  {
    name: "Output",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: (suffix) => suffix + "/output",
  },
  {
    name: "Test",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: (suffix) => suffix + "/test",
  },
  {
    name: "Dashboard",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: (suffix) => suffix + "/dashboard",
  },
];
const settingsSideBar = [
  {
    name: "User Profile",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/settings/profile",
  },
  {
    name: "Notifications",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/settings/notifications",
  },
  {
    name: "Data Settings",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/settings/data-settings",
  },
  {
    name: "Agent Secret Keys",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/settings/agent-secret-keys",
  },
  {
    name: "API Secret Keys",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/settings/api-secret-keys",
  },
];

const pmsSideBar = [
  {
    name: "Dashboard",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms",
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
    to: "/pms/documents",
  },
  {
    name: "Patient Communications",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/practice-settings?tab=Patient Communications",
  },
];

const adminSideBar = [
  {
    name: "Roles",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/admin/role",
  },
  {
    name: "Modules",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/admin/app-module-management",
  },
  {
    name: "Columns Settings",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/admin/column-settings",
  },
  {
    name: "Iam Role",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/admin/iam-role",
  },
  {
    name: "Licenses",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/admin/license-management",
  },
  {
    name: "Audit",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/admin/audit-logs",
  },
  // {
  //   name: "Billing View",
  //   icon: <DiGoogleAnalytics className="text-xl text-current" />,
  //   to: "/admin/billing-view",
  // },
  {
    name: "Payment Overview",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/admin/payment-overview",
  },
];

const billingSideBar = [
  {
    name: "Charges",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/pms/billing/charges",
  },
  {
    name: "Insurance Collections",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/pms/billing/insurance-collections",
  },
  {
    name: "Patient Collections",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/pms/billing/patient-collections",
  },
  {
    name: "Automated Patient Billings",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/pms/billing/automated-patient-billings",
  },
  {
    name: "Analytics",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/pms/billing/analytics",
  },
  {
    name: "Claim Submission",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/pms/billing/claim-submission",
  },
  {
    name: "Payment Posting",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/pms/billing/payment-posting",
  },
];

const platformSideBar = [
  {
    name: "Dashboard",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/home",
    end: true,
  },
  {
    name: "Appointment",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/home/appointment-view",
  },
  {
    name: "Patients",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/home/patients",
  },

  {
    name: "Provider",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/home/providers",
  },
  // {
  //   name: "Documents",
  //   icon: <DiGoogleAnalytics className="text-xl text-current" />,
  //   to: "/pms/documents",
  // },
  // {
  //   name: "Patient Communications",
  //   icon: <DiGoogleAnalytics className="text-xl text-current" />,
  //   to: "/pms/practice-settings?tab=Patient Communications",
  // },
  {
    name: "Eligibility Check",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/home/eligibility-check",
  },
];

const clinicalSideBar = [
  {
    name: "Clinical Tasks",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/clinical/tasklist",
  },
  {
    name: "eRx Requests",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/clinical/erxrequests",
  },
  {
    name: "Open Notes",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/clinical/opennotes",
  },
  {
    name: "Referrals",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/clinical/referrals",
  },
  {
    name: "Charges",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/clinical/charges",
  },
  {
    name: "Clinical Reports",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/clinical/clinical-reports",
  },
  {
    name: "MIPS",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/clinical/mips",
  },
  {
    name: "Quality Measures",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/clinical/quality-measures",
  },
];

const payments = [
  {
    name: "Payments Hub",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/payments",
    end: true,
  },
  {
    name: "Virtual Card",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/payments/virtual-card",
  },
];

const engageSidebar = [
  {
    name: "Performance Dashboard",
    to: "/pms/engage/performance-dashboard",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
  },
  {
    name: "Surveys & Reviews",
    to: "/pms/engage/surveys-reviews",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
  },
  {
    name: "Online Presence",
    to: "/pms/engage/online-presence",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
  },
  {
    name: "Patient Broadcast",
    to: "/pms/engage/patient-broadcast",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
  },
  {
    name: "Patient Intake",
    to: "/pms/engage/patient-intake",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
  },
  {
    name: "Explore Patient Experience →",
    to: "/pms/engage/patient-experience",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
  },
];

const analytics_patients = [
  {
    name: "All Patients",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/analytics/patients/all_patients",
  },
];
const analytics_appointments = [
  {
    name: "All Appointments",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/analytics/appointments/all_appointments",
  },

  {
    name: "Missed Charges",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/analytics/appointments/missed_charges",
  },
];
const analytics_notes = [
  {
    name: "Unassigned Notes",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/analytics/notes/unassigned_notes",
  },
];

const analytics_encounters = [
  {
    name: "All Encounters",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/analytics/encounters/all_encounters",
  },
];
const analytics_claims = [
  {
    name: "Insurance Collections",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/analytics/claims/insurance_collections",
  },
];
const analytics_payments = [
  {
    name: "Payouts",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/analytics/payments/payouts",
  },
];

const analytics = [
  {
    name: "Patients",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    is_drop_down: true,
    drop_down: analytics_patients,
    to: "/pms/analytics/patients",
  },
  {
    name: "Unassigned Notes",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    is_drop_down: true,
    drop_down: analytics_notes,
    to: "/pms/analytics/unassigned_notes",
  },
  {
    name: "Appointments",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    is_drop_down: true,
    drop_down: analytics_appointments,
    to: "/pms/analytics/appointments",
  },
  {
    name: "Encounters",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    is_drop_down: true,
    drop_down: analytics_encounters,
    to: "/pms/analytics/encounters",
  },
  {
    name: "Claims",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    is_drop_down: true,
    drop_down: analytics_claims,
    to: "/pms/analytics/claims",
  },
  {
    name: "Payouts",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    is_drop_down: true,
    drop_down: analytics_payments,
    to: "/pms/analytics/payouts",
  },
];

const encounterSideBar = [
  {
    name: "Encounters",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/encounter",
    end: true,
  },
  {
    name: "Claims",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/encounter/claims",
  },
  {
    name: "Paper EOB",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/encounter/eob",
  },
  {
    name: "Payments",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/encounter/payments",
  },
  {
    name: "Refunds",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/encounter/refunds",
  },
  {
    name: "Capitated Accounts",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/encounter/capitated-accounts",
  },
  {
    name: "Clearinghouse Reports",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/pms/clearinghouse-reports",
  },
];

const getSideBarItems = (app_name, isInsuranceApp, pathname) => {
  switch (app_name) {
    case "ABA":
      return abaSidebar;
    case "VOICE_AI":
      return voiceAiSideBar;
    case "ROI":
      return roiSideBar;
    case "Settings":
      return settingsSideBar;
    case "Admin":
      return adminSideBar;
    case "PMS":
      if (pathname.startsWith("/pms/billing")) {
        return billingSideBar;
      }
      if (pathname.startsWith("/pms/home")) {
        return platformSideBar;
      }
      if (pathname.startsWith("/pms/clinical")) {
        return [];
      }
      if (pathname.startsWith("/pms/engage")) {
        return engageSidebar;
      }
      if (pathname.startsWith("/pms/engage")) {
        return engageSidebar;
      }
      if (pathname.startsWith("/pms/payments")) {
        return payments;
      }
      if (pathname.startsWith("/pms/analytics")) {
        return analytics;
      }
      if (pathname.startsWith("/pms/telehealth")) {
        return [];
      }
      if (pathname.startsWith("/pms/encounter")) {
        return encounterSideBar;
      }

      return [];
    default:
      // Add "Patients" to main sidebar only for Patient Intake
      if (app_name === "115") {
        return [
          ...sidebar,
          {
            name: "Sign Configuration",
            icon: <DiGoogleAnalytics className="text-xl text-current" />,
            to: "/apps/patient-intake-Mw==/YWdlbnQtMTE1/sign-config",
          },
        ];
      }

      if (isInsuranceApp) {
        return [
          ...sidebar,
          {
            name: "Instructions",
            icon: <DiGoogleAnalytics className="text-xl text-current" />,
            to: (suffix) => suffix + "/instructions",
          },
        ];
      }

      return sidebar;
  }
};

export default getSideBarItems;
