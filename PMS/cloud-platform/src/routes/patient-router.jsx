import InstructionPage from "@/pages/patientIntake/instructions";
import { lazy } from "react";
import { AudioPlayerProvider } from "react-use-audio-player";
import ModulePermissionRoute from "./module-permission-route";
import UnauthorizedPage from "@/pages/unauthorized";
import AgentConfiguration from "@/pages/patientIntake/agent-config";
import AgentConfigForm from "@/features/patient-intake/agent-config-form";
import SignConfiguration from "@/pages/patientIntake/signconfig";

const RequestTable = lazy(() => import("@/pages/patientIntake/request"));
const PatientDashboard = lazy(() => import("@/pages/patientIntake/dashboard"));
const PatientAnalytics = lazy(() => import("@/pages/patientIntake/analytics"));

const patientRoutes = [
  {
    id: "patient-home",
    index: true,
    element: (
      <AudioPlayerProvider>
        <ModulePermissionRoute>
          <PatientDashboard />
        </ModulePermissionRoute>
      </AudioPlayerProvider>
    ),
  },
  {
    id: "patient-request",
    path: "requests",
    element: (
      <AudioPlayerProvider>
        <ModulePermissionRoute>
          <RequestTable />
        </ModulePermissionRoute>
      </AudioPlayerProvider>
    ),
  },
  // {
  //   id: "patient-analytics",
  //   path: "analytics",
  //   element: (
  //     <ModulePermissionRoute>
  //       <PatientAnalytics />
  //     </ModulePermissionRoute>
  //   ),
  // },
  {
    id: "patient-instructions",
    path: "instructions",
    element: (
      <ModulePermissionRoute>
        <InstructionPage />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "docusign2",
    path: "sign-config",
    element: <SignConfiguration />,
  },
  {
    id: "agent-config",
    path: "agent-config",
    element: (
      <ModulePermissionRoute>
        <AgentConfiguration />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "agent-config",
    path: "agent-config/create",
    element: (
      <ModulePermissionRoute>
        <AgentConfigForm />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "agent-config",
    path: "agent-config/view",
    element: (
      <ModulePermissionRoute>
        <AgentConfigForm />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "patient-unauthorized",
    path: "unauthorized",
    element: <UnauthorizedPage />,
  },
];

export default patientRoutes;
