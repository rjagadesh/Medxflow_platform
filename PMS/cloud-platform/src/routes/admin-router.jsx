import { lazy } from "react";
import { Navigate } from "react-router-dom";
import ModulePermissionRoute from "./module-permission-route";
import PaymentPreview from "@/features/admin/payment-preview";
import UnauthorizedPage from "@/pages/unauthorized";
import ManageAgent from "@/features/admin/manage-agent";
import NotFoundPage from "@/pages/not-found";

const AuditLogs = lazy(() => import("@/features/admin/audit-logs"));
const BillingView = lazy(() => import("@/features/admin/billing-view"));
const ColumnSettings = lazy(() => import("@/features/admin/column-settings"));
const LicenseManagement = lazy(() => import("@/features/admin/licenseview"));
const AccessControl = lazy(() => import("@/features/admin/access-control"));
const ModulesPermission = lazy(() =>
  import("@/features/admin/modules-permission")
);
const UserRoleManagement = lazy(() =>
  import("@/features/admin/userrolemanage")
);

const adminRoutes = [
  {
    id: "admin-settings-home",
    index: true,
    element: <Navigate to="/admin/role" replace />,
  },
  {
    id: "admin-roles",
    path: "role",
    element: (
      <ModulePermissionRoute>
        <UserRoleManagement />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "admin-modules",
    path: "app-module-management",
    element: (
      <ModulePermissionRoute>
        <ModulesPermission />
        <ManageAgent />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "column-settings",
    path: "column-settings",
    element: (
      <ModulePermissionRoute>
        <ColumnSettings />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "iam-role",
    path: "iam-role",
    element: (
      <ModulePermissionRoute>
        <AccessControl />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "app-license",
    path: "license-management",
    element: (
      <ModulePermissionRoute>
        <LicenseManagement />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "audit-logs",
    path: "audit-logs",
    element: (
      <ModulePermissionRoute>
        <AuditLogs />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "billing-view",
    path: "billing-view",
    element: (
      <ModulePermissionRoute>
        <BillingView />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "payment-overview",
    path: "payment-overview",
    element: (
      <ModulePermissionRoute allowRole={["client"]}>
        <PaymentPreview />
      </ModulePermissionRoute>
    ),
  },
  {
    id: "admin-unauthorized",
    path: ":ignore/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    id: "admin-not-found",
    path: "*",
    element: <NotFoundPage />,
  },
];

export default adminRoutes;
