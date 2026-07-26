import { lazy } from "react";
import { VStack } from "@chakra-ui/react";
import { Navigate } from "react-router-dom";
import ModulePermissionRoute from "./module-permission-route";
import UnauthorizedPage from "@/pages/unauthorized";
import NotFoundPage from "@/pages/not-found";

// ✅ Lazy imports for route-based code splitting
const DataSettings = lazy(() => import("@/features/settings/data-settings"));
const AppPreference = lazy(() => import("@/pages/settings/app-preference"));
const UserProfile = lazy(() => import("@/pages/settings/user-profile"));
const IntegrationTab = lazy(() => import("@/features/admin/integration-tab"));
const APISecretKeyTab = lazy(() => import("@/features/admin/api-secret-tab"));
const NotificationsSettings = lazy(() =>
  import("@/features/settings/notification-settings")
);

const settingsRoutes = [
  {
    id: "settings-home",
    index: true,
    element: <Navigate to="/settings/profile" replace />,
  },
  {
    id: "settings-user-profile",
    path: "profile",
    element: (
      <>
        <VStack gap={4} mb="4" w="full">
          <UserProfile />
          <AppPreference />
        </VStack>
      </>
    ),
  },
  {
    id: "data-settings",
    path: "data-settings",
    element: (
      <ModulePermissionRoute>
        <DataSettings />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "agent-secret-keys",
    path: "agent-secret-keys",
    element: (
      <ModulePermissionRoute>
        <IntegrationTab />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "api-secret-keys",
    path: "api-secret-keys",
    element: (
      <ModulePermissionRoute>
        <APISecretKeyTab />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "notification-settings",
    path: "notifications",
    element: (
      <ModulePermissionRoute>
        <NotificationsSettings />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "settings-unauthorized",
    path: ":ignore/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    id: "settings-not-found",
    path: "*",
    element: <NotFoundPage />,
  },
];

export default settingsRoutes;
