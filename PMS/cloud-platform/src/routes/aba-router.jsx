import { lazy } from "react";
import ModulePermissionRoute from "./module-permission-route";
import UnauthorizedPage from "@/pages/unauthorized";
import NotFoundPage from "@/pages/not-found";

const AssetsList = lazy(() => import("@/pages/Utilities/assets-list"));
const CreateProject = lazy(() => import("@/features/ABA/create-project"));
const CreateTask = lazy(() => import("@/features/ABA/form/create-task"));
const MachineList = lazy(() => import("@/features/ABA/machine-list"));
const CreateTriggerModal2 = lazy(() =>
  import("@/features/ABA/modal/create-trigger-modal")
);
const QueueList = lazy(() => import("@/features/ABA/queue-list"));
const TriggerList = lazy(() => import("@/features/ABA/trigger"));
const ABAdashboard = lazy(() => import("@/pages/ABA/dashboard"));
const ABAHome = lazy(() => import("@/pages/ABA/home"));
const Projects = lazy(() => import("@/pages/ABA/projects"));
const QueueRecords = lazy(() => import("@/pages/ABA/queue-records"));
const ABACodeBuilder = lazy(() => import("@/pages/ABA/code-builder"));
const ABASettings = lazy(() => import("@/pages/ABA/code-builder"));
const TaskDetailsPanel = lazy(() => import("@/pages/ABA/task-panel"));
const ViewPods = lazy(() => import("@/pages/ABA/view-pods"));
const TriggerDetails = lazy(() => import("@/pages/ABA/trigger-details"));

const abaRoutes = [
  {
    id: "aba-hub",
    index: true,
    element: <ABAdashboard />,
  },
  {
    id: "aba-trigger",
    path: "trigger",
    element: (
      <ModulePermissionRoute>
        <TriggerList />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "aba-queue",
    path: "queue",
    element: (
      <ModulePermissionRoute>
        <QueueList />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "aba-asset",
    path: "asset",
    element: (
      <ModulePermissionRoute>
        <AssetsList />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "aba-machine",
    path: "machine",
    element: (
      <ModulePermissionRoute>
        <MachineList />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "aba-workspace",
    path: "workspace",
    element: (
      <ModulePermissionRoute>
        <ABAHome />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "aba-queue-record",
    path: "queue/records/:queue_id",
    element: (
      <ModulePermissionRoute>
        <QueueRecords />
      </ModulePermissionRoute>
    ),
  },
  { id: "aba-dashboard", path: "dashboard", element: <ABAdashboard /> },
  {
    id: "aba-create-project",
    path: "create-project",
    element: <CreateProject />,
  },
  { id: "aba-settings", path: "settings", element: <ABASettings /> },
  { id: "aba-projects", path: "pods", element: <Projects /> },
  { id: "aba-view-projects", path: "pods/:id", element: <ViewPods /> },
  {
    id: "aba-projects-task",
    path: "pods/:id/create-task",
    element: <CreateTask />,
  },
  {
    id: "task-details",
    path: ":pod_id/task/:id",
    element: (
      <ModulePermissionRoute>
        <TaskDetailsPanel />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "task-builder",
    path: "task-builder/:task_id",
    element: (
      <ModulePermissionRoute>
        <ABACodeBuilder />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "trigger-details",
    path: "trigger/details/:trigger_id",
    element: (
      <ModulePermissionRoute>
        <TriggerDetails />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "aba-unauthorized",
    path: ":ignore/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    id: "aba-unauthorized2",
    path: ":ignore/:ignore/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    id: "aba-unauthorized3",
    path: "unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    id: "aba-not-found",
    path: "*",
    element: <NotFoundPage />,
  },
];

export default abaRoutes;
