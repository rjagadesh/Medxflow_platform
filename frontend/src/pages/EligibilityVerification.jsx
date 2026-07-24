/**
 * Eligibility Verification — modelled on the Availity insurance-verification
 * portal. "Verify Coverage" runs a (simulated) 270/271 coverage check and shows
 * the benefit table + AI-generated Verification of Benefits; "History" lists
 * past checks; "VOB Portal" opens the standalone full-screen VOB portal.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import EligibilityHistory from "../components/eligibility/EligibilityHistory.jsx";
import EligibilityVerify from "../components/eligibility/EligibilityVerify.jsx";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const TABS = [
  { key: "verify", label: "Verify Coverage" },
  { key: "history", label: "History" },
  { key: "portal", label: "VOB Portal ↗" },
];

export default function EligibilityVerification() {
  const [tab, setTab] = useState("verify");
  const navigate = useNavigate();
  usePageHeader("Eligibility Verification", "Check coverage and benefits by payer, member and service type — with an AI Verification of Benefits.");

  function onTab(key) {
    if (key === "portal") navigate("/vob-portal");  // full-screen standalone page
    else setTab(key);
  }

  return (
    <>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? "is-active" : ""}`} onClick={() => onTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "verify" && <EligibilityVerify />}
      {tab === "history" && <EligibilityHistory />}
    </>
  );
}
