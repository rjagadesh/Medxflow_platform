import ABAdashboard from "@/pages/ABA/dashboard";
import PMSPlatform from "@/pages/pms/dental/platform";
import PMSHome from "@/pages/pms/pms-home";
import ProviderProfile from "@/pages/pms/dental/provider-profile";
import ProviderRegistration from "@/pages/pms/dental/provider-reg";
import PatientView from "@/pages/pms/patient-view/patient-view";
import PatientForm from "@/features/pms/dashboard/form/patient-form";
import BillingAnalyticsPage from "@/pages/pms/analytics/analytics-main";
import PracticeSettings from "@/pages/pms/pratice-settings/practice-settings";
import PMSDashboard from "@/pages/pms/dashboard";
import Charges from "@/pages/pms/billings/charges/charges";
import PmsDocuments from "@/pages/pms/documents/documents";
import ChargesView from "@/pages/pms/billings/charges/charges-view";
import UserSettings from "@/pages/pms/pratice-settings/user-settings";
import UserRegistration from "@/pages/pms/pratice-settings/user-registration";
import ChargesSettings from "@/pages/pms/pratice-settings/charges-settings";
import PatientCollections from "@/pages/pms/list-view/PatientCollections";
import InsuranceCollections from "@/pages/pms/list-view/InsuranceColections";
import NotFoundPage from "@/pages/not-found";
import TaskList from "@/pages/pms/list-view/tasklistview";
import TaskCreation from "@/features/clinical-settings/task-creation";
import AllAppointments from "@/pages/pms/list-view/all_appointments";
import PatientListView from "@/pages/pms/list-view/patientlistview";
import ProviderListView from "@/pages/pms/list-view/providerlistview";
import AllEncounters from "@/pages/pms/list-view/all_encounters";
import Payouts from "@/pages/pms/list-view/payoutslistview";
import MissedCharges from "@/pages/pms/list-view/missedCharges";
import EngageDashboard from "@/pages/pms/engage/engage-dashboard";
import PatientReviewActivity from "@/pages/pms/engage/survey-review";
import ProviderListing from "@/pages/pms/engage/online-presence";
import EngageBroadcast from "@/pages/pms/engage/main-patientbroadcast";
// import CallingView from "@/pages/pms/telehealth/calling-view";
import UnsignedNotesPage from "@/pages/pms/list-view/UnsignedNotesPage";
import InsuranceCollectionsPage from "@/pages/pms/list-view/InsuranceCollections";
import AllPatientsPage from "@/pages/pms/list-view/AllPatientsPage";
import CreateAppointment from "@/pages/pms/dental/platform-sub-components/appointment-modal";
import EncounterDashboard from "@/pages/pms/encounter/encounter-dashboard";
import EncounterModal from "@/pages/pms/encounter/encounter-modal";
import EligibilityCheck from "@/pages/pms/eligibility-check";
import App from "@/pages/pms/meeting/meeting/Telehealth-Meeting-ui";
import ClaimSubmission from "@/pages/pms/list-view/claimsubmission";
import MeetingsHome from "@/pages/pms/meeting/meeting/component/MeetingsHome";
import SelectClaimsToSubmit from "@/pages/pms/encounter/claimSubmission/claimsubmission";
import EditInsurance from "@/features/pms/pratice-settings/insurance/edit-insurance";
import PracticeInformation from "@/pages/pms/pratice-settings/practice-information";
import InsuranceComp from "@/pages/pms/pratice-settings/insurance";
import ServiceLocation from "@/pages/pms/pratice-settings/service-location";
import TelehealthSettings from "@/pages/pms/pratice-settings/telehealth-settings";
import CalendarSettings from "@/pages/pms/pratice-settings/calendar-settings";
import Widget from "@/pages/pms/pratice-settings/widget";
import VisitReasons from "@/pages/pms/pratice-settings/visitreasons";
import PatientCommunication from "@/pages/pms/pratice-settings/patient-communication";
import A2PRegistration from "@/pages/pms/pratice-settings/a2p-registration";
import PatientIntakeComp from "@/pages/pms/pratice-settings/patient-intake";
import Survey from "@/pages/pms/pratice-settings/survey";
import ProviderProfileComp from "@/pages/pms/pratice-settings/provider-profile";
import { Navigate } from "react-router-dom";
import ClaimsPage from "@/pages/pms/encounter/claimSubmission/claimform/form-claim-submission";
import ClinicalPage from "@/pages/pms/pratice-settings/clinical";
import MiscPage from "@/pages/pms/pratice-settings/misc";
import BillingPage from "@/pages/pms/pratice-settings/blilling";
import DateManagementPage from "@/pages/pms/pratice-settings/data-management";
import MeetingRoom from "@/pages/pms/meeting/meeting/component/MeetingRoom";
import Allergies from "@/pages/pms/patient-view/allergies";
import EncounterNotesOverview from "@/pages/pms/encounter/encounter-notes/encounter-notes-overview";
import PaymentListView from "@/pages/pms/list-view/paymentlistview";
import CreatePaymentPage from "@/pages/pms/encounter/payments/newPayments";
import PaperEOBListView from "@/pages/pms/list-view/PaperEOBlistview";
import UserEdit from "@/pages/pms/pratice-settings/UserEdit";
import StaffScheduleForm from "@/pages/pms/pratice-settings/StaffScheduleForm";
import AddStaffNameModal from "@/pages/pms/pratice-settings/AddStaffName";
import ProviderScheduleDetail from "@/pages/pms/pratice-settings/ProviderScheduleDetail";
import ServiceCode from "@/pages/pms/pratice-settings/ServiceCode";
import FeeSchedule from "@/pages/pms/pratice-settings/FeeSchedule";
import BulkUploadPage from "@/pages/pms/pratice-settings/BulkUploadPage";
import Fax from "@/pages/pms/pratice-settings/fax";
import SftpOnboardingForm from "@/pages/pms/sftp/settings";
import PaymentsHub from "@/pages/pms/payment-overview/payments-hub";

const pmsRoutes = [
  {
    id: "pms-home",
    index: true,
    element: <PMSDashboard />,
  },
  {
    id: "pms-Platform",
    path: "home",
    element: <PMSDashboard />,
  },
  {
    id: "user-edit",
    path: "user-edit/:id",
    element: <UserEdit />,
  },
  {
    id: "service-code",
    path: "service-code",
    element: <ServiceCode />,
  },
  {
    id: "staff-schedule-form",
    path: "staff/:id",
    element: <StaffScheduleForm />,
  },
  {
    id: "staff-schedule-form-new",
    path: "newstaff",
    element: <AddStaffNameModal />,
  },
  {
    id: "provider-schedule-detail",
    path: "provider-schedule/:id",
    element: <ProviderScheduleDetail />,
  },

  {
    id: "pms-Documents",
    path: "home/documents",
    element: <PmsDocuments />,
  },
  {
    id: "pms-patientview",
    path: "home/patients",
    element: <PatientListView />,
  },
  {
    id: "pms-patient-view",
    path: "home/patients/:id",
    element: <PatientView />,
  },
  {
    id: "pms-patient-view",
    path: "home/patients/:patientId/allergies",
    element: <Allergies />,
  },
  {
    id: "patientview",
    path: "home/patients/create",
    element: <PatientForm />,
  },
  {
    id: "patienteditview",
    path: "home/patients/edit/:editId",
    element: <PatientForm />,
  },
  {
    id: "providerview",
    path: "home/providers",
    element: <ProviderListView />,
  },
  // {
  //   id: "pms-provider-view",
  //   path: "home/provider/:id",
  //   element: <ProviderProfile />,
  // },
  {
    id: "appointmentview",
    path: "home/appointment-view",
    element: <PMSPlatform />,
  },
  {
    id: "create-appointment",
    path: "home/appointment/create",
    element: <CreateAppointment />,
  },
  {
    id: "providerprofileview",
    path: "platform/provider-profile",
    element: <ProviderProfile />,
  },
  {
    id: "providerprofileview",
    path: "home/eligibility-check",
    element: <EligibilityCheck />,
  },
  {
    id: "provider-reg",
    path: "home/providers/create",
    element: <ProviderRegistration />,
  },

  {
    id: "providereditview",
    path: "home/provider/edit/:editId",
    element: <ProviderRegistration />,
  },
  {
    id: "payment-listview",
    path: "encounter/payments/",
    element: <PaymentListView />,
  },
  {
    id: "create-payment",
    path: "encounter/payments/create/",
    element: <CreatePaymentPage />,
  },
  {
    id: "user-settings",
    path: "user-settings",
    element: <UserSettings />,
  },
  {
    id: "user-registration",
    path: "user-registration",
    element: <UserRegistration />,
  },
  {
    id: "charges-settings",
    path: "billing/new-charge",
    element: <ChargesSettings />,
  },
  {
    id: "Clinical Task",
    path: "clinical/tasklist",
    element: <TaskList />,
  },
  {
    id: "Clinical Task Creation",
    path: "clinical/task-creation",
    element: <TaskCreation />,
  },
  {
    id: "Engage Performance Dashboard",
    path: "engage/performance-dashboard",
    element: <EngageDashboard />,
  },
  {
    id: "Engage Survey Review",
    path: "engage/surveys-reviews",
    element: <PatientReviewActivity />,
  },
  {
    id: "Engage Online Presence",
    path: "engage/online-presence",
    element: <ProviderListing />,
  },
  {
    id: "Engage Broadcast",
    path: "engage/patient-broadcast",
    element: <EngageBroadcast type="broadcast" />,
  },
  {
    id: "Engage Patient Intake",
    path: "engage/patient-intake",
    element: <EngageBroadcast type="patient-intake" />,
  },
  {
    id: "Eob-listview",
    path: "encounter/eob",
    element: <PaperEOBListView />,
  },
  // ============================
  // Clinical Routes start
  // ============================
  {
    id: "Clinical-Home",
    path: "clinical",
    element: <EncounterNotesOverview />,
  },
  // ============================
  // Clinical Routes end
  // ============================
  // ============================
  // Practice settings
  // ============================
  {
    id: "practice-settings",
    path: "platform-settings",
    element: <PracticeSettings />,
    children: [
      {
        index: true,
        element: <Navigate to="patient-communications" replace />,
      },
      {
        path: "practice-information",
        element: <PracticeInformation />,
      },
      {
        path: "insurance",
        element: <InsuranceComp />,
      },
      {
        path: "fee-schedule",
        element: <FeeSchedule />,
      },
      {
        path: "fax",
        element: <Fax />,
      },
      {
        path: "fee-schedule/bulk-upload",
        element: <BulkUploadPage />,
      },
      {
        path: "user-settings",
        element: <UserSettings />,
      },
      {
        path: "service-locations",
        element: <ServiceLocation />,
      },
      {
        path: "provider-profiles",
        element: <ProviderProfileComp />,
      },
      {
        path: "telehealth-settings",
        element: <TelehealthSettings />,
      },
      {
        path: "calendar-settings",
        element: <CalendarSettings />,
      },
      {
        path: "scheduling-widget",
        element: <Widget />,
      },
      {
        path: "visit-reasons",
        element: <VisitReasons />,
      },
      {
        path: "patient-communications",
        element: <PatientCommunication />,
      },
      {
        path: "a2p-registration",
        element: <A2PRegistration />,
      },
      {
        path: "patient-intake",
        element: <PatientIntakeComp />,
      },
      {
        path: "surveys-reviews",
        element: <Survey />,
      },
      {
        path: "clinical",
        element: <ClinicalPage />,
      },
      {
        path: "misc",
        element: <MiscPage />,
      },
      {
        path: "misc",
        element: <MiscPage />,
      },
      {
        path: "data-management",
        element: <DateManagementPage />,
      },
      {
        path: "billing",
        element: <BillingPage />,
      },
      {
        path: "sftp-settings",
        element: <SftpOnboardingForm />,
      },
    ],
  },
  {
    id: "pms-insurance-edit",
    path: "platform-settings/insurance/:id",
    element: <EditInsurance />,
  },
  // ============================
  // Billing
  // ============================
  {
    id: "billings-settings",
    path: "billing/patient-collections",
    element: <PatientCollections />,
  },
  {
    id: "insurance-settings",
    path: "billing/insurance-collections",
    element: <InsuranceCollections />,
  },

  {
    id: "billings-settings",
    path: "billing/charges",
    element: <Charges />,
  },
  {
    id: "billings-settings",
    path: "billing/charges/:id",
    element: <ChargesView />,
  },
  {
    id: "pms-not-found",
    path: "*",
    element: <NotFoundPage />,
  },
  {
    id: "pms-appointments",
    path: "analytics/appointments/all_appointments",
    element: <AllAppointments />,
  },
  {
    id: "pms-encounters",
    path: "analytics/encounters/all_encounters",
    element: <AllEncounters />,
  },

  {
    id: "pms-encounters-claim",
    path: "encounter/claims",
    element: <ClaimSubmission />,
  },

  {
    id: "pms-payouts",
    path: "analytics/payments/payouts",
    element: <Payouts />,
  },
  {
    id: "pms-missedcharges",
    path: "analytics/appointments/missed_charges",
    element: <MissedCharges />,
  },
  {
    id: "pms-anlytics",
    path: "billing/analytics",
    element: <BillingAnalyticsPage />,
  },
  {
    id: "pms-telehealth-calling-view",
    path: "telehealth",
    element: <MeetingsHome />,
  },
  {
    id: "pms-telehealth-calling-view",
    path: "path/telehealth",
    element: <MeetingRoom />,
  },
  {
    id: "pms-platform-settings",
    path: "platform-settings",
    element: <PracticeSettings />,
  },
  {
    id: "pms-unassigned_notes",
    path: "analytics/notes/unassigned_notes",
    element: <UnsignedNotesPage />,
  },
  {
    id: "pms-insurance_collections",
    path: "analytics/claims/insurance_collections",
    element: <InsuranceCollectionsPage />,
  },
  {
    id: "pms-all_patients",
    path: "analytics/patients/all_patients",
    element: <AllPatientsPage />,
  },
  {
    id: "pms-encounter",
    path: "encounter",
    element: <EncounterDashboard />,
  },
  {
    id: "pms-encounter-create",
    path: "encounter/create",
    element: <EncounterModal mode="create" />,
  },
  {
    id: "pms-encounter-edit",
    path: "encounter/edit/:id",
    element: <EncounterModal mode="edit" />,
  },
  {
    id: "pms-encounter-claimform",
    path: "encounter/claimform/:id",
    element: <ClaimsPage />,
  },
  {
    id: "pms-encounter-claim-submit",
    path: "encounter/submit-claims",
    element: <SelectClaimsToSubmit />,
  },
  {
    id: "pms-encounter-claim-submit",
    path: "encounter/submit-claims",
    element: <SelectClaimsToSubmit />,
  },
  {
    id: "payments-hub",
    path: "payments",
    element: <PaymentsHub />,
  },
  {
    id: "payments-hub-patient",
    path: "payments/:patientId",
    element: <PaymentsHub />,
  },
];

export default pmsRoutes;
