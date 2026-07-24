/**
 * Eligibility History — past coverage checks. Click a row to open the full
 * benefit table + AI VOB in a modal.
 */
import { useEffect, useMemo, useState } from "react";

import api from "../../api/client.js";
import EligibilityResult from "./EligibilityResult.jsx";

export default function EligibilityHistory() {
  const [checks, setChecks] = useState(null);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => { api.get("/eligibility/checks/").then(({ data }) => setChecks(data)); }, []);

  useEffect(() => {
    if (!openId) { setDetail(null); return; }
    api.get(`/eligibility/checks/${openId}/`).then(({ data }) => setDetail(data));
  }, [openId]);

  const filtered = useMemo(
    () => (checks || []).filter((c) =>
      `${c.first_name} ${c.last_name} ${c.member_id} ${c.payer}`.toLowerCase().includes(search.toLowerCase())),
    [checks, search]
  );

  if (!checks) return <p className="muted">Loading history…</p>;

  return (
    <>
      <div className="page-actions" style={{ justifyContent: "flex-start" }}>
        <input className="field__input" style={{ maxWidth: 320 }} placeholder="Search name / member / payer…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Member</th><th>Member ID</th><th>Payer</th><th>Coverage</th><th>Plan</th><th>When</th></tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setOpenId(c.id)}>
                <td>{[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}</td>
                <td>{c.member_id || "—"}</td>
                <td>{c.payer || "—"}</td>
                <td>
                  <span className={`pill ${(c.coverage_status || "").toLowerCase() === "active" ? "pill--active" : "pill--expired"}`}>
                    {c.coverage_status || "—"}
                  </span>
                </td>
                <td className="muted">{c.plan_type || "—"}</td>
                <td style={{ whiteSpace: "nowrap" }}>{new Date(c.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="6" className="muted">No eligibility checks yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {openId && detail && (
        <div className="modal-overlay" onClick={() => setOpenId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 900, maxWidth: "94vw" }}>
            <div className="modal__head">
              <h3>{[detail.first_name, detail.last_name].filter(Boolean).join(" ") || detail.member_id} · {detail.payer}</h3>
              <button className="assistant__min" onClick={() => setOpenId(null)}>✕</button>
            </div>
            <div style={{ padding: "1.25rem", overflow: "auto" }}>
              <EligibilityResult check={detail} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
