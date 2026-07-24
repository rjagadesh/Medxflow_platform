/**
 * Recorded Calls — past VOB calls with transcript, extracted benefits, and
 * recording link. Click a row to open the full detail.
 */
import { useEffect, useMemo, useState } from "react";

import api from "../../api/client.js";

const SPEAKER = { agent: "Agent", rep: "Rep", ivr: "IVR", system: "System" };
const STATUS_CLASS = { COMPLETED: "pill pill--active", FAILED: "pill pill--expired" };

// "out_of_pocket_max" -> "Out of pocket max"
function titleize(key) {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function DownloadIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function VobRecordings() {
  const [calls, setCalls] = useState(null);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.get("/vob/calls/").then(({ data }) => setCalls(data));
  }, []);

  useEffect(() => {
    if (!openId) { setDetail(null); return; }
    api.get(`/vob/calls/${openId}/`).then(({ data }) => setDetail(data));
  }, [openId]);

  const filtered = useMemo(
    () => (calls || []).filter((c) =>
      (c.patient_name + c.member_id + c.payer).toLowerCase().includes(search.toLowerCase())),
    [calls, search]
  );

  if (!calls) return <p className="muted">Loading recordings…</p>;

  return (
    <>
      <div className="page-actions" style={{ justifyContent: "flex-start" }}>
        <input className="field__input" style={{ maxWidth: 320 }} placeholder="Search patient / member / payer…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Patient</th><th>Member ID</th><th>Payer</th><th>Status</th><th>Confidence</th><th>Decision</th><th>When</th></tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setOpenId(c.id)}>
                <td>{c.patient_name || "—"}</td>
                <td>{c.member_id || "—"}</td>
                <td>{c.payer || "—"}</td>
                <td><span className={STATUS_CLASS[c.status] || "pill"}>{c.status_label}</span></td>
                <td>{c.confidence ? `${Math.round(c.confidence * 100)}%` : "—"}</td>
                <td className="muted">{c.decision || "—"}</td>
                <td style={{ whiteSpace: "nowrap" }}>{new Date(c.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="7" className="muted">No calls recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {openId && detail && (
        <div className="modal-overlay" onClick={() => setOpenId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 680 }}>
            <div className="modal__head">
              <h3>{detail.patient_name} · {detail.payer}</h3>
              <button className="assistant__min" onClick={() => setOpenId(null)}>✕</button>
            </div>
            <div style={{ padding: "1.25rem" }}>
              <div className="vob-results__head">
                <h3 className="result__headline" style={{ margin: 0 }}>Extracted VOB Data</h3>
                <span className={`pill ${detail.confidence >= 0.92 ? "pill--active" : "pill--suspended"}`}>
                  {Math.round(detail.confidence * 100)}% · {detail.decision}
                </span>
              </div>
              <dl className="vobd-list">
                {Object.entries(detail.vob_data || {}).map(([k, v]) => (
                  <div key={k} className="vobd-row">
                    <dt className="vobd-label">{titleize(k)}:</dt>
                    <dd className="vobd-value">{v.value}</dd>
                    <span className={`vobd-conf ${v.confidence >= 0.92 ? "ok" : "warn"}`}>
                      {Math.round(v.confidence * 100)}% confidence
                    </span>
                  </div>
                ))}
              </dl>
              {detail.recording_url && (
                <div className="vobd-recording">
                  <audio controls preload="none" src={detail.recording_url} className="vobd-audio" />
                  <a className="btn btn--ghost btn--sm" href={detail.recording_url} download>
                    <DownloadIcon /> Download recording
                  </a>
                </div>
              )}
              <h3 className="result__headline" style={{ margin: "1.25rem 0 0.5rem" }}>Transcript</h3>
              <div className="vob-transcript" style={{ maxHeight: 260 }}>
                {(detail.transcript || []).map((t, i) => (
                  <div key={i} className={`vt vt--${t.speaker}`}>
                    <span className="vt__who">{t.kind === "dtmf" ? "⌨ DTMF" : SPEAKER[t.speaker] || "System"}</span>
                    <span className="vt__text">{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
