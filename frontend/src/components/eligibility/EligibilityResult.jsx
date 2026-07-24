/**
 * EligibilityResult — renders one coverage check the way the Availity portal
 * does: a coverage/plan header, an Excel-style benefit table (in-network vs
 * out-of-network copay / coinsurance / deductible / OOP + auth & referral per
 * service type), the AI-generated VOB summary, and Action Items / flags.
 */
const COST_COLS = [
  ["copay", "Copay"],
  ["coinsurance", "Coins."],
  ["deductible_remaining", "Deductible Rem."],
  ["oop_remaining", "OOP Rem."],
  ["auth_required", "Auth"],
  ["referral_required", "Referral"],
];

export default function EligibilityResult({ check, onReparse, reparsing }) {
  if (!check) return null;
  const active = (check.coverage_status || "").toLowerCase() === "active";

  return (
    <div className="elig-result">
      {/* Coverage & plan header */}
      <div className="elig-cov">
        <div className="elig-cov__status">
          <span className={`pill ${active ? "pill--active" : "pill--expired"}`}>{check.coverage_status || "Unknown"}</span>
          <h3>{check.plan_name || check.payer}</h3>
        </div>
        <div className="elig-cov__grid">
          <Meta label="Plan type" v={check.plan_type} />
          <Meta label="Group" v={check.group_number} />
          <Meta label="Subscriber" v={check.subscriber} />
          <Meta label="Effective" v={check.effective_date} />
          <Meta label="Termination" v={check.termination_date || "None (active)"} />
          <Meta label="Member ID" v={check.member_id} mono />
        </div>
      </div>

      {/* Benefit table */}
      <div className="table-wrap elig-benefits">
        <table className="table">
          <thead>
            <tr>
              <th rowSpan="2">Service Type</th>
              <th colSpan={COST_COLS.length} className="elig-net elig-net--in">In-Network</th>
              <th colSpan={COST_COLS.length} className="elig-net elig-net--oon">Out-of-Network</th>
              <th rowSpan="2">Visit limit</th>
            </tr>
            <tr>
              {COST_COLS.map(([k, l]) => <th key={`in-${k}`}>{l}</th>)}
              {COST_COLS.map(([k, l]) => <th key={`oon-${k}`}>{l}</th>)}
            </tr>
          </thead>
          <tbody>
            {(check.benefits || []).map((b) => (
              <tr key={b.code}>
                <td><strong>{b.label}</strong><span className="elig-stc">STC {b.code}</span></td>
                {COST_COLS.map(([k]) => <td key={`in-${k}`}>{cell(b.in_network?.[k])}</td>)}
                {COST_COLS.map(([k]) => <td key={`oon-${k}`}>{cell(b.out_of_network?.[k])}</td>)}
                <td>{b.visit_limit || "—"}</td>
              </tr>
            ))}
            {(check.benefits || []).length === 0 && (
              <tr><td colSpan={COST_COLS.length * 2 + 2} className="muted">No benefits returned.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* AI VOB summary + action items */}
      <div className="elig-vob">
        <div className="elig-vob__head">
          <h3>AI Verification of Benefits</h3>
          <div className="elig-vob__meta">
            {check.ai_model && <span className="elig-badge">{check.ai_model}</span>}
            {onReparse && (
              <button className="btn btn--ghost btn--sm" onClick={onReparse} disabled={reparsing}>
                {reparsing ? "Re-parsing…" : "↻ Re-parse AI"}
              </button>
            )}
          </div>
        </div>
        <p className="elig-vob__summary">{check.vob_summary || "—"}</p>

        <h4 className="elig-vob__subtitle">Action Items / Flags</h4>
        <ul className="elig-actions">
          {(check.action_items || []).map((a, i) => <li key={i}>{a}</li>)}
          {(check.action_items || []).length === 0 && <li className="muted">None.</li>}
        </ul>
      </div>
    </div>
  );
}

function cell(v) {
  if (v === "Yes") return <span className="elig-yes">Yes</span>;
  if (v === "No") return <span className="elig-no">No</span>;
  return v ?? "—";
}

function Meta({ label, v, mono }) {
  return (
    <div className="elig-meta">
      <span className="elig-meta__label">{label}</span>
      <span className={`elig-meta__val ${mono ? "mono" : ""}`}>{v || "—"}</span>
    </div>
  );
}
