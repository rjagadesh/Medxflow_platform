/**
 * Loads the current user's effective per-feature permissions once, and exposes
 * a `can(feature, action)` helper used to gate UI (e.g. hide a menu item the
 * role can't view). Defaults to allow while loading so nothing flickers away.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import api from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setPermissions(null);
      return;
    }
    api
      .get("/rbac/my-permissions/")
      .then(({ data }) => setPermissions(data.permissions))
      .catch(() => setPermissions({}));
  }, [isAuthenticated]);

  const value = useMemo(() => {
    function can(feature, action = "can_view") {
      // While loading (null), allow — avoids hiding items on first paint.
      if (permissions === null) return true;
      const p = permissions[feature];
      if (!p) return true; // unknown feature -> not restricted
      return !!p[action];
    }
    return { permissions, can };
  }, [permissions]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions must be used within a PermissionsProvider");
  return ctx;
}
