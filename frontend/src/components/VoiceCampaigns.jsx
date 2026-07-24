/**
 * Outbound Voice Campaigns (#11) — the Campaigns tab of the Voice AI studio.
 * Create an outbound calling campaign (pick an agent, name it, upload a
 * recipient list), see all campaigns, and view per-agent call transcripts.
 */
import { useEffect, useMemo, useState } from "react";

import api from "../api/client.js";

const STATUS_CLASS = {
  RUNNING: "pill pill--active",
  DRAFT: "pill pill--suspended",
  PAUSED: "pill pill--suspended",
  COMPLETED: "pill",
};
const OUTCOME_CLASS = {
  COMPLETED: "pill pill--active",
  VOICEMAIL: "pill pill--suspended",
  NO_ANSWER: "pill pill--expired",
  FAILED: "pill pill--expired",
};

const BLANK = { agent: "", name: "", goal: "", recipients: "" };

export default function VoiceCampaigns() {
  const [agents, setAgents] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [calls, setCalls] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");
  const [openCall, setOpenCall] = useState(null);

  function load() {
    api.get("/campaigns/").then(({ data }) => setCampaigns(data));
    api.get("/call-records/").then(({ data }) => setCalls(data));
  }
  useEffect(() => {
    api.get("/voice-agents/").then(({ data }) => setAgents(data));
    load();
  }, []);

  const agentName = useMemo(
    () => Object.fromEntries(agents.map((a) => [a.id, a.name])),
    [agents]
  );

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  // Count non-empty lines in an uploaded recipient list as the recipient count.
  async function onRecipients(file) {
    const text = await file.text();
    const n = text.trim().split(/\r?\n/).filter((l) => l.trim()).length;
    set("recipients", String(n));
  }

  async function create(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/campaigns/", {
        agent: Number(form.agent), name: form.name, goal: form.goal,
        recipients: Number(form.recipients || 0), status: "DRAFT",
      });
      setForm(BLANK);
      load();
    } catch (err) {
      setError(err.response?.data ? Object.values(err.response.data).flat().join(" ") : "Could not create campaign.");
    }
  }

  return (
    <>
      <div className="runner">
        {/* Create campaign */}
        <form className="runner__panel" onSubmit={create}>
          <h2 className="section-title" style={{ marginTop: 0 }}>New campaign</h2>
          {error && <div className="alert alert--error">{error}</div>}
          <label className="field">
            <span className="field__label">Agent *</span>
            <select className="field__input" value={form.agent} onChange={(e) => set("agent", e.target.value)} required>
              <option value="">Choose an agent…</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Campaign name *</span>
            <input className="field__input" value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Appointment Reminders — August" required />
          </label>
          <label className="field">
            <span className="field__label">Goal</span>
            <input className="field__input" value={form.goal} onChange={(e) => set("goal", e.target.value)}
              placeholder="e.g. Remind patients of upcoming visits" />
          </label>
          <label className="field">
            <span className="field__label">Recipient list (CSV / one per line)</span>
            <input type="file" accept=".csv,text/plain" className="field__input"
              onChange={(e) => e.target.files?.[0] && onRecipients(e.target.files[0])} />
            {form.recipients && <span className="field__hint">{form.recipients} recipients detected</span>}
          </label>
          <button className="btn btn--primary btn--block">Create campaign</button>
        </form>

        {/* Campaign list */}
        <div className="runner__panel">
          <h2 className="section-title" style={{ marginTop: 0 }}>Campaigns ({campaigns.length})</h2>
          {campaigns.length === 0 ? (
            <p className="muted">No campaigns yet.</p>
          ) : (
            <ul className="connector-list">
              {campaigns.map((c) => (
                <li key={c.id} className="connector">
                  <span className="connector__icon">📞</span>
                  <div className="connector__body">
                    <div className="connector__top">
                      <span className="connector__name">{c.name}</span>
                      <span className={STATUS_CLASS[c.status] || "pill"}>{c.status_label}</span>
                    </div>
                    <span className="connector__meta">
                      {c.agent_name} · {c.recipients} recipients · {c.call_count} calls
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Call transcripts / history */}
      <section className="allocate">
        <h2 className="section-title">Call history ({calls.length})</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Recipient</th><th>Agent</th><th>Outcome</th><th>Duration</th><th>When</th><th></th></tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id}>
                  <td>{c.recipient}</td>
                  <td>{c.agent_name}</td>
                  <td><span className={OUTCOME_CLASS[c.outcome] || "pill"}>{c.outcome_label}</span></td>
                  <td>{c.duration_seconds ? `${c.duration_seconds}s` : "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(c.created_at).toLocaleString()}</td>
                  <td>
                    {c.transcript
                      ? <button className="btn btn--ghost btn--sm" onClick={() => setOpenCall(c)}>Transcript</button>
                      : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
              {calls.length === 0 && <tr><td colSpan="6" className="muted">No calls recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transcript modal */}
      {openCall && (
        <div className="modal-overlay" onClick={() => setOpenCall(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h3>{openCall.recipient} · {agentName[openCall.agent] || openCall.agent_name}</h3>
              <button className="assistant__min" onClick={() => setOpenCall(null)}>✕</button>
            </div>
            <pre className="transcript">{openCall.transcript}</pre>
          </div>
        </div>
      )}
    </>
  );
}
