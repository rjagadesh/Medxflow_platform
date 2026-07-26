/**
 * PMS / EHR — the standalone Practice Management / EHR app (Django + React,
 * django-tenants) embedded full-screen. It runs its own frontend (Vite dev
 * server, port 5201) against its own backend (Django/Daphne on 127.0.0.1:8002),
 * so it's mounted in an iframe with a single Back-to-Home button.
 * Route: /pms. Demo login — admin / Admin@12345.
 */
import { useNavigate } from "react-router-dom";

// The PMS frontend serves itself on :5201 (dev). Override with VITE_PMS_URL if
// it's served elsewhere.
const PMS_URL = import.meta.env.VITE_PMS_URL || "http://localhost:5201/";

export default function PmsPortal() {
  const navigate = useNavigate();
  return (
    <div className="vobfull">
      <iframe title="PMS / EHR" src={PMS_URL} className="vobfull__frame" />
      <button className="vobfull__home" title="Back to home" aria-label="Back to home" onClick={() => navigate("/")}>
        ← Back to Home
      </button>
    </div>
  );
}
