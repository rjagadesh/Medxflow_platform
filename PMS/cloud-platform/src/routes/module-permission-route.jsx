import { useAuth } from "@/store/providers/auth-provider";
import { atobAgentId } from "@/utils/helper";
import { Navigate, useLocation, useParams } from "react-router-dom";

const routes = {
  "/settings/data-settings": "settings-data-settings",
  "/settings/agent-secret-keys": "settings-agent-secret-keys",
  "/settings/api-secret-keys": "settings-api-secret-key",
  "/admin/role": "admin-role",
  "/admin/column-settings": "admin-column-settings",
  "/admin/license-management": "admin-license-management",
  "/admin/audit-logs": "admin-audit-logs",
  "/admin/billing-view": "admin-billing-view",
  "/roi": "roi-estimation",
  "/roi/actual": "roi-actual",
  "/aba/trigger": "aba-trigger",
  "/aba/workspace": "aba-workspace",
  "/aba/asset": "aba-asset",
  "/aba/machine": "aba-machine",
};

const ModulePermissionRoute = ({ children, allowRole = [] }) => {
  const data = useAuth();
  const { permissions, user, loading } = data;
  const role = user?.roles;
  console.log("role1212", user, role, data);
  const location = useLocation();
  console.log("location1212", location);
  const pathname = window.location.pathname;

  const { agent_app } = useParams();
  if (loading) return <>Loading...</>;

  if (role === "client" || role === "admin" || role === "owner") {
    return children;
  }

  const agentId = agent_app ? atobAgentId(agent_app) : "";

  const hasAccess = permissions.some(
    (p) => p.module === Number(agentId) || routes[pathname] === p.module
  );

  return children;
  // return hasAccess ? (
  //   children
  // ) : allowRole.includes(role) ? (
  //   children
  // ) : (
  //   <Navigate to="unauthorized" replace />
  // );
};

export default ModulePermissionRoute;
