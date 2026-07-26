import { lazy, Suspense, useEffect } from "react";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./protected-route";
import AppLayout from "@/layouts/Layout/apps-layout";
import abaRoutes from "./aba-router";
import adminRoutes from "./admin-router";
import settingsRoutes from "./settings-router";
import appsRoutes from "./patient-router";
import ModulePermissionRoute from "./module-permission-route";
import UnauthorizedPage from "@/pages/unauthorized";
import MfaVerificationForm from "@/pages/mfa-verify";
import MinutesOfMeeting from "@/pages/smart-drive/minutes-of-meeting";
import MinutesOfMeetingForm from "@/features/minutes-of-meeting/minutes-of-meetings-form";
import { SuspenseFallback } from "@/components/nprogress/nprogress";
import FileManager from "@/pages/Utilities/fileManager";
import pmsRoutes from "./pms-router";
import NotFoundPage from "@/pages/not-found";
import PdfSignPage from "@/pages/patientIntake/docusign";
import App from "@/pages/pms/meeting/meeting/Telehealth-Meeting-ui";
import MeetingsHome from "../pages/pms/meeting/meeting/component/MeetingsHome";
import AudioCallComponent from "../pages/pms/meeting/meeting/component/AudioCallComponent";
import TelehealthMeetingUI from "../pages/pms/meeting/meeting/Telehealth-Meeting-ui";
import MeetingRoom from "@/pages/pms/meeting/meeting/component/MeetingRoom";
import PatientGuestEntry from "@/pages/pms/meeting/meeting/component/PatientGuestEntry";
// import PatientMeeting from "@/pages/pms/telehealth/patient-meeting";
import EncounterNotes from "@/pages/pms/encounter/encounter-notes/encounter-notes";
import EncounterNotesContent from "@/pages/pms/encounter/encounter-notes/encounter-notes-content";
import Allergies from "@/pages/pms/patient-view/allergies";
import MedicationsView from "@/pages/pms/patient-view/medications";
import Vitals from "@/pages/pms/patient-view/vitals";
import EncounterNotesOverview from "@/pages/pms/encounter/encounter-notes/encounter-notes-overview";
import VitalEncounterView from "@/pages/pms/encounter/encounter-notes/vital-encounter-view";
import MedicationsEncounterView from "@/pages/pms/encounter/encounter-notes/medications-encounter-view";
import SftpOnboardingForm from "@/pages/pms/sftp/settings";
import DocumentsView from "@/pages/pms/patient-view/documents";
import { Bleed } from "@chakra-ui/react";
import LabsStudies from "@/pages/pms/patient-view/labs-studies";
import History from "@/pages/pms/patient-view/history";
import PastMedicalHistory from "@/features/pms/patient-view/history/past-medical-history";
import PastSurgicalHistory from "@/features/pms/patient-view/history/past-surgical-history";
import VoiceAiBasics from "@/pages/voice-ai/basics";
// import TelephonySettings from "@/pages/voice-ai/telephony";
import VoiceAiTesting from "@/pages/voice-ai/testing";
import VoiceAiLiveKitTesting from "@/pages/voice-ai/livekit-testing";
import OutputJson from "@/pages/voice-ai/outputJson";
import RoutingScaleCompactForm from "@/pages/pms/voiceai/routing_scaling";
import VoiceAiPage from "@/pages/voice-ai/ai";
import VoiceAiHome from "@/pages/voice-ai/voice-ai-home";
import VoiceAiChat from "@/pages/voice-ai/voice-ai-chat";
import UsagePage from "@/pages/voice-ai/usage";
import VoiceAIBilling from "@/pages/voice-ai/voice-billing-overview";
import VoiceAIPayment from "@/pages/voice-ai/voice-billing-payment";
import TelephonySettings from "@/pages/voice-ai/telephony";
import VoiceAiInput from "@/pages/voice-ai/input";
import VoiceAiLiveKitComponentsTesting from "@/pages/voice-ai/livekit-components-testing";

const ApiDocs = lazy(() => import("@/pages/voice-ai/api-docs"));

// Lazy load page components
const LoginPage = lazy(() => import("../pages/login"));
const SignUp = lazy(() => import("../pages/sign-up"));
const HomeApps = lazy(() => import("@/pages/home"));
const ActualSavings = lazy(() => import("@/pages/droidMetrix/actual-saving"));
const HelpPage = lazy(() => import("@/pages/help"));
const ROIPage = lazy(() => import("@/pages/droidMetrix/roi"));
const UtilsSideBar = lazy(() => import("@/layouts/Layout/utilities"));
const AssetsList = lazy(() => import("@/pages/Utilities/assets-list"));
const VoiceAiDashboard = lazy(
  () => import("@/pages/voice-ai/voice-ai-dashboard"),
);

const Fallback = () => {
  useEffect(() => {
    alert("called");
  }, []);
  return <div>Loading...</div>;
};

const mainRouter = [
  {
    id: "root",
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        id: "home",
        index: true,
        // Embedded MedXFlow PMS/EHR lands straight on the PMS module.
        element: <Navigate to="/pms/home" replace />,
      },
      {
        id: "pms-redirect",
        path: "/pms",
        element: (
          <AppLayout
            dashboardType="PMS"
            showSecondarySidebar={true}
            defaultSecondarySidebarShrinkOff={true}
            pms={true}
            isShrink={true}
          />
        ),
        children: pmsRoutes,
      },
      {
        id: "apps-redirect",
        path: "/apps",
        element: <Navigate to="/pms/home" replace />,
      },
      {
        id: "aba",
        path: "/aba",
        element: (
          <AppLayout
            dashboardType="ABA"
            showSecondarySidebar={false}
            defaultSecondarySidebarShrinkOff={false}
          />
        ),
        children: abaRoutes,
      },
      // {
      //   id: "pms",
      //   path: "/pms",
      //   element: (
      //     <AppLayout
      //       dashboardType="HELP"
      //       showSecondarySidebar={false}
      //       defaultSecondarySidebarShrinkOff={false}
      //     />
      //   ),
      //   children: pmsRoutes,
      // },
    ],
  },
  {
    id: "docusign",
    path: "/docusign",
    element: <PdfSignPage />,
  },
  {
    id: "sftp",
    path: "/sftp",
    element: <SftpOnboardingForm />,
  },
  {
    id: "meetings-audio",
    path: "/meetings/audio",
    element: <AudioCallComponent />,
  },
  {
    id: "meetings-video",
    path: "/meetings/video",
    element: <TelehealthMeetingUI />,
  },
  {
    id: "mfa",
    path: "/mfa-verify",
    element: <MfaVerificationForm />,
  },
  {
    id: "login",
    path: "/login",
    element: <LoginPage formType="login" />,
  },
  // {
  //   id: "patient-join-meeting",
  //   path: "/patient-join-meeting",
  //   element: <PatientMeeting formType="patient-meeting" />,
  // },
  {
    id: "forgot-password",
    path: "/forgot-password",
    element: <LoginPage formType="forgotPassword" />,
  },
  {
    id: "reset-password",
    path: "/reset-password/:uid/:token",
    element: <LoginPage formType="resetPassword" />,
  },
  {
    id: "sign-up",
    path: "/sign-up",
    element: <SignUp />,
  },
  {
    id: "settings",
    path: "/settings",
    element: (
      <AppLayout
        dashboardType="Settings"
        showSecondarySidebar={false}
        defaultSecondarySidebarShrinkOff={true}
      />
    ),
    children: settingsRoutes,
  },
  {
    id: "admin",
    path: "/admin",
    element: (
      <AppLayout
        dashboardType="Admin"
        showSecondarySidebar={false}
        defaultSecondarySidebarShrinkOff={true}
      />
    ),
    children: adminRoutes,
  },
  {
    id: "help",
    path: "/help",
    element: (
      <AppLayout
        dashboardType="HELP"
        showSecondarySidebar={false}
        defaultSecondarySidebarShrinkOff={true}
      />
    ),
    children: [
      {
        id: "help",
        index: true,
        element: <HelpPage />,
      },
      {
        id: "help-not-found",
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  {
    id: "apps",
    path: "/apps/:department_id",
    element: (
      <AppLayout
        dashboardType="HOME"
        showSecondarySidebar={true}
        defaultSecondarySidebarShrinkOffOff={false}
      />
    ),
    children: [
      {
        id: "home-apps",
        index: true,
        element: <HomeApps />,
      },
      {
        id: "agent_app",
        path: ":agent_app",
        children: appsRoutes,
      },
      {
        id: "apps-not-found",
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  {
    id: "roi",
    path: "/roi",
    element: (
      <AppLayout
        dashboardType="ROI"
        showSecondarySidebar={false}
        defaultSecondarySidebarShrinkOff={true}
      />
    ),
    children: [
      {
        id: "droid-metrix-roi",
        index: true,
        element: (
          <ModulePermissionRoute>
            <Suspense fallback={<SuspenseFallback />}>
              <ROIPage />
            </Suspense>
          </ModulePermissionRoute>
        ),
      },
      {
        id: "droid-metrix-actual",
        path: "actual",
        element: (
          <ModulePermissionRoute>
            <ActualSavings />
          </ModulePermissionRoute>
        ),
      },
      {
        id: "roi-unauthorized",
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
      {
        id: "roi-actual-unauthorized",
        path: ":ignore/unauthorized",
        element: <UnauthorizedPage />,
      },
      {
        id: "roi-not-found",
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },

  {
    id: "smart-drive-home",
    path: "smart-drive",
    element: (
      <AppLayout
        dashboardType="SmartDrive"
        showSecondarySidebar={true}
        defaultSecondarySidebarShrinkOff={false}
      />
    ),
    children: [
      {
        id: "smart-drive-home-index",
        index: true,
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <UtilsSideBar />
          </Suspense>
        ),
      },
      {
        id: "smart-drive-home-index",
        path: "docuspace",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <FileManager />
          </Suspense>
        ),
      },
      {
        id: "smart-drive-home-index",
        path: "vault",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AssetsList />
          </Suspense>
        ),
      },
      {
        id: "smart-drive-mom-home",
        path: "minutes-of-meeting",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <MinutesOfMeeting />
          </Suspense>
        ),
      },
      {
        id: "smart-drive-mom-home",
        path: "minutes-of-meeting/",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <MinutesOfMeeting />
          </Suspense>
        ),
      },
      {
        id: "smart-drive-mom-form-create",
        path: "minutes-of-meeting/create",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <MinutesOfMeetingForm />
          </Suspense>
        ),
      },
      {
        id: "smart-drive-mom-form-view",
        path: "minutes-of-meeting/view/:id",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <MinutesOfMeetingForm />
          </Suspense>
        ),
      },
    ],
  },
  {
    id: "patient-telehealth",
    path: "patient-telehealth",
    element: <PatientGuestEntry />,
  },
  {
    id: "not-found",
    path: "*",
    element: <NotFoundPage />,
  },
  {
    id: "pms-encounter-notes",
    path: "pms/encounter/notes/:patient_id/:appointment_id",
    element: (
      <AppLayout
        dashboardType="HELP"
        showSecondarySidebar={true}
        defaultSecondarySidebarShrinkOff={true}
        pms={true}
        isShrink={true}
      />
    ),
    children: [
      {
        id: "pms-encounter-notes-view",
        path: "",
        element: <EncounterNotes />,
        children: [
          {
            index: true,
            element: <EncounterNotesContent />,
          },
          {
            path: "allergies",
            element: <Allergies showClose={true} />,
          },
          {
            path: "allergies",
            element: <Allergies showClose={true} />,
          },
          {
            path: "medications",
            element: <MedicationsView />,
          },
        ],
      },
      {
        id: "pms-encounter-notes-overview",
        path: "overview",
        element: <EncounterNotesOverview />,
      },
      {
        id: "pms-encounter-notes-vitals",
        path: "vitals",
        element: <VitalEncounterView />,
      },
      {
        id: "pms-encounter-notes-medications",
        path: "medications-sections",
        element: <MedicationsEncounterView />,
      },
      {
        id: "pms-encounter-notes-medications",
        path: "documents",
        element: (
          <Bleed inline={4} h="full">
            <DocumentsView />
          </Bleed>
        ),
      },
      {
        id: "pms-encounter-notes-medications",
        path: "labs-studies",
        element: (
          <Bleed inline={4} h="full">
            <LabsStudies />
          </Bleed>
        ),
      },
      {
        id: "pms-encounter-notes-history",
        path: "history",
        children: [
          {
            index: true,
            element: (
              <Bleed inline={4} h="full">
                <History />
              </Bleed>
            ),
          },
          {
            path: "past-medical-history",
            element: (
              <Bleed inline={4} h="auto">
                <PastMedicalHistory />
              </Bleed>
            ),
          },
          {
            path: "past-surgical-history",
            element: (
              <Bleed inline={4} h="100%">
                <PastSurgicalHistory />
              </Bleed>
            ),
          },
        ],
      },
    ],
  },
  {
    id: "voice-ai",
    path: "/voice-ai/:department_id/:agent_app",
    element: (
      <AppLayout
        dashboardType="VOICE_AI"
        showHeader={false}
        showSecondarySidebar={false}
        defaultSecondarySidebarShrinkOff={true}
      />
    ),
    children: [
      {
        id: "voice-ai-index",
        path: "",
        children: [
          {
            id: "voice-ai-dashboard",
            path: "dashboard",

            children: [
              {
                id: "voice-ai-dashboard",
                index: true,
                element: <VoiceAiDashboard />,
              },
              {
                id: "voice-ai-input-json",
                path: "input",
                element: <VoiceAiInput />,
              },
              {
                id: "api-docs",
                path: "api-docs",
                element: <ApiDocs />,
              },
            ],
          },
          {
            id: "voice-ai-dashboard",
            path: "configurations",
            element: <VoiceAiBasics />,
          },

          {
            id: "voice-ai-page",
            path: "call-script",
            element: <VoiceAiPage />,
          },
          {
            id: "voice-ai-output-json",
            path: "output",
            element: <OutputJson />,
          },

          {
            id: "voice-ai-testing",
            path: "test",
            element: <VoiceAiLiveKitTesting />,
          },
          {
            id: "voice-ai-testing",
            path: "test2",
            element: <VoiceAiLiveKitComponentsTesting />,
          },
          {
            id: "voice-ai-testing",
            path: "telephone",
            element: <TelephonySettings />,
          },
        ],
      },
    ],
  },
  {
    id: "voice-ai-index",
    path: "/voice-ai",
    element: (
      <ModulePermissionRoute>
        <VoiceAiChat />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "voice-id-dashboard",
    path: "/voice-ai/:department_id",
    element: (
      <AppLayout
        dashboardType="HELP"
        showSecondarySidebar={false}
        defaultSecondarySidebarShrinkOff={true}
      />
    ),
    children: [
      {
        id: "voice-ai-index",
        index: true,
        element: (
          <ModulePermissionRoute>
            <VoiceAiHome />
          </ModulePermissionRoute>
        ),
      },
      {
        id: "voice-ai-billing",
        path: "analytics",
        element: <UsagePage />,
      },
      {
        id: "voice-ai-billing",
        path: "billing",
        element: <VoiceAIBilling />,
      },
      {
        id: "voice-ai-billing-payment",
        path: "billing/payment",
        element: <VoiceAIPayment />,
      },
    ],
  },
];

export default mainRouter;
