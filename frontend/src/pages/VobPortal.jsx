/**
 * VOB Portal — full-screen standalone page (no sidebar / topbar / toolbar). The
 * embedded portal fills the entire viewport so it looks exactly like opening it
 * in a new tab, but stays in-app. A single unobtrusive floating button returns
 * home. Reached at /vob-portal (outside the app layout).
 *
 * Point the portal at a backend by setting VITE_VOB_PORTAL_URL, or append
 * `?api=<backend-url>` — the bundled copy reads it.
 */
import { useNavigate } from "react-router-dom";

const BASE = import.meta.env.VITE_VOB_PORTAL_URL || "/vob-portal/index.html";

export default function VobPortal() {
  const navigate = useNavigate();
  return (
    <div className="vobfull">
      <iframe title="Eligibility Checker" src={BASE} className="vobfull__frame" />
      <button className="vobfull__home" title="Back to home" aria-label="Back to home" onClick={() => navigate("/")}>
        ← Back to Home
      </button>
    </div>
  );
}
