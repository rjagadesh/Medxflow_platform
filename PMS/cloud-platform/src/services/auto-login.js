import axios from "axios";
import ApiConstant from "./constant";

/**
 * Login-less demo bypass.
 *
 * This PMS is embedded inside MedXFlow with no login screen. On boot (and again
 * whenever a session expires) we silently sign in as the demo user and stash the
 * JWTs in localStorage, so the app opens straight to the workspace and the
 * /login page is never shown.
 */
const BASE_URL = `${ApiConstant.BASE_URL}/${ApiConstant.APP}/`;

const DEMO_CREDENTIALS = {
  username: import.meta.env.VITE_DEMO_USER || "admin",
  password: import.meta.env.VITE_DEMO_PASS || "Admin@12345",
};

let inflight = null;

/**
 * Ensure a valid access token exists. Pass force=true to re-authenticate even
 * when a (stale) token is already present. Concurrent callers share one request.
 */
export async function ensureSession(force = false) {
  if (!force && localStorage.getItem("access")) return;
  if (inflight) return inflight;

  inflight = axios
    .post(`${BASE_URL}account/login/`, DEMO_CREDENTIALS)
    .then((res) => {
      const { access, refresh } = res.data || {};
      if (access) localStorage.setItem("access", access);
      if (refresh) localStorage.setItem("refresh", refresh);
    })
    .catch((err) => {
      // Non-fatal: the app still renders; requests just won't be authorized.
      console.error("[auto-login] demo sign-in failed", err?.response?.data || err);
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
