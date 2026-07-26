/**
 * Referral Workflow — the standalone referral-automation app (built from
 * /referral-app) embedded full-screen. It has its own sidebar/topbar and runs
 * self-contained on local data, so it's mounted in an iframe (served at
 * /referral/) with a single Back-to-Home button. Route: /referral-workflow.
 */
import { useNavigate } from "react-router-dom";

export default function ReferralPortal() {
  const navigate = useNavigate();
  return (
    <div className="vobfull">
      <iframe title="Referral Automation" src="/referral/index.html" className="vobfull__frame" />
      <button className="vobfull__home" title="Back to home" aria-label="Back to home" onClick={() => navigate("/")}>
        ← Back to Home
      </button>
    </div>
  );
}
