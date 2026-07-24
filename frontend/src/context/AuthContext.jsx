/**
 * Authentication context: holds the current user and exposes login/logout.
 *
 * On mount, if an access token is present we fetch /api/me to restore the
 * session, so a page refresh keeps the user signed in.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import api, { tokenStore } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on first load.
  useEffect(() => {
    async function restore() {
      if (!tokenStore.access) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/me/");
        setUser(data);
      } catch {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function login(email, password, otp) {
    const payload = { email, password };
    if (otp) payload.otp = otp;
    const { data } = await api.post("/auth/login/", payload);
    tokenStore.set({ access: data.access, refresh: data.refresh });
    setUser(data.user);
    return data.user;
  }

  // Self-service sign-up: creates an organisation + admin and signs them in.
  async function register(payload) {
    const { data } = await api.post("/auth/register/", payload);
    tokenStore.set({ access: data.access, refresh: data.refresh });
    setUser(data.user);
    return data.user;
  }

  // Re-fetch the current user (e.g. after a profile update).
  async function refresh() {
    const { data } = await api.get("/me/");
    setUser(data);
    return data;
  }

  async function logout() {
    try {
      await api.post("/auth/logout/");
    } catch {
      // Logout is best-effort; we clear local state regardless.
    }
    tokenStore.clear();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
      setUser,
      isAuthenticated: !!user,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
