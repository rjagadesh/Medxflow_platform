import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/store/providers/auth-provider";
import { useCallback } from "react";

export const usePermissions = () => {
  const { permissions, user } = useAuth();

  // Memoized function to check specific permission
  const hasPermission = useCallback(
    (moduleCode, action) => {
      if (user?.roles === "client") {
        return true;
      }
      if (!permissions || permissions.length === 0) {
        return false;
      }
      const module = permissions.find((p) => p.module_code === moduleCode);

      if (
        (!module && action === "view") ||
        (module.permissions[action] === false && action === "view")
      ) {
        return false;
      }
      if (!module || !module.permissions[action]) {
        toaster.error({
          title: "Access Denied",
          description: "You do not have permission to access this module.",
        });
        return false;
      }

      return module.permissions[action] === true;
    },
    [permissions, user?.roles],
  );

  // Optional: Check if user has ANY permission for a module (useful for general access)
  const hasAnyPermission = useCallback(
    (moduleCode) => {
      if (!permissions || permissions.length === 0) return false;

      const module = permissions.find((p) => p.module_code === moduleCode);
      if (!module) return false;

      return Object.values(module.permissions).some((p) => p === true);
    },
    [permissions],
  );

  // Optional: Get full permissions for a module
  const getModulePermissions = useCallback(
    (moduleCode) => {
      if (!permissions || permissions.length === 0) return null;

      return permissions.find((p) => p.module_code === moduleCode);
    },
    [permissions],
  );

  return {
    hasPermission, // e.g., hasPermission('add_edit_department', 'create')
    hasAnyPermission, // e.g., hasAnyPermission('add_edit_department')
    getModulePermissions, // e.g., getModulePermissions('add_edit_department')
    permissions, // Raw array for advanced use
  };
};
