/**
 * Agent Configuration screen — the full agent detail page (recreated from the
 * Droidal "Configurations" layout), re-skinned in the MedXFlow green theme.
 *
 *   Top tabs: Home | Configurations | Call Script | Output | Test | Dashboard
 *   Cards: Agent Configuration · Phone Settings · Call Settings · Agent Versioning
 *
 * Backed by the extended VoiceAgent + AgentVersion API.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/client.js";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

// Home removed (it only duplicated the "← Agents" back link). Output/Test/
// Dashboard aren't built yet, so they're disabled with a "Coming soon" tooltip
// rather than rendering a dead-end stub.
const TABS = [
  { key: "Configurations", enabled: true },
  { key: "Call Script", enabled: true },
  { key: "Output", enabled: false },
  { key: "Test", enabled: false },
  { key: "Dashboard", enabled: false },
];
// Version actions are phrased as verbs so they read as actions, not labels.
const VER_ACTIONS = [
  { status: "DRAFT", label: "Set Draft" },
  { status: "ACTIVE", label: "Activate" },
  { status: "PAUSED", label: "Pause" },
];
const STATUS_PILL = { ACTIVE: "vpill vpill--active", PAUSED: "vpill vpill--paused", DRAFT: "vpill vpill--draft" };

export default function AgentConfig() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("Configurations");
  const [agent, setAgent] = useState(null);
  const [options, setOptions] = useState(null);
  const [versions, setVersions] = useState([]);
  const [saved, setSaved] = useState("");

  usePageHeader("Voice AI · Agent", agent ? agent.name : "");

  useEffect(() => {
    api.get("/voice-agents/options/").then(({ data }) => setOptions(data));
    api.get(`/voice-agents/${id}/`).then(({ data }) => setAgent(data));
    loadVersions();
  }, [id]);

  function loadVersions() {
    api.get(`/voice-agents/${id}/versions/`).then(({ data }) => setVersions(data));
  }
  function set(field, value) { setAgent((a) => ({ ...a, [field]: value })); setSaved(""); }

  async function save() {
    const { data } = await api.patch(`/voice-agents/${id}/`, agent);
    setAgent(data);
    setSaved("Saved ✓");
    setTimeout(() => setSaved(""), 2000);
  }
  async function saveAsNewVersion() {
    await api.patch(`/voice-agents/${id}/`, agent);
    await api.post(`/voice-agents/${id}/versions/`, {});
    loadVersions();
    setSaved("New version saved ✓");
    setTimeout(() => setSaved(""), 2500);
  }
  async function setVersionStatus(v, status) {
    await api.patch(`/agent-versions/${v.id}/`, { status });
    loadVersions();
  }

  if (!agent || !options) return <p className="muted">Loading agent…</p>;

  const activeVersion = versions.find((v) => v.status === "ACTIVE");

  return (
    <div className="agentcfg">
      {/* Top tab bar + version + save-as-new */}
      <div className="agentcfg__topbar">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate("/voice-ai")}>← Agents</button>
        <nav className="agentcfg__tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              disabled={!t.enabled}
              title={t.enabled ? undefined : "Coming soon"}
              className={`agentcfg__tab ${tab === t.key ? "is-active" : ""} ${t.enabled ? "" : "is-disabled"}`}
              onClick={() => t.enabled && setTab(t.key)}
            >
              {t.key}{!t.enabled && <span className="agentcfg__soon">soon</span>}
            </button>
          ))}
        </nav>
        <div className="agentcfg__topright">
          <span className="agentcfg__version">
            {activeVersion ? activeVersion.version : "—"}
            {activeVersion && <span className="vpill vpill--active">Active</span>}
          </span>
          <button className="btn btn--primary btn--sm" onClick={save}>Save changes</button>
          <button className="btn btn--ghost btn--sm" onClick={saveAsNewVersion} title="Saves your changes and snapshots them as a new version in the table below">
            Save as New Version
          </button>
        </div>
      </div>

      <p className="agentcfg__hint">
        <strong>Save changes</strong> updates this agent everywhere. <strong>Save as New Version</strong> also
        records a snapshot in the Agent Versioning table.
      </p>

      {saved && <div className="alert alert--success" style={{ marginTop: "0.75rem" }}>{saved}</div>}

      {tab === "Configurations" && (
        <ConfigTab agent={agent} set={set} options={options}
          versions={versions} onVersionStatus={setVersionStatus} statusPill={STATUS_PILL} />
      )}
      {tab === "Call Script" && <CallScriptTab agent={agent} set={set} onSave={save} />}
    </div>
  );
}

/* ------------------------------------------------------ Configurations --- */
function ConfigTab({ agent, set, options, versions, onVersionStatus, statusPill }) {
  return (
    <>
      {/* Agent Configuration + Phone Settings */}
      <div className="cfg-row">
        <section className="cfg-card cfg-card--grow">
          <h2 className="cfg-card__title"><span className="cfg-ico">⚙️</span> Agent Configuration
            <span className="cfg-card__sub">— {agent.name}</span></h2>
          <div className="cfg-body">
            <div className="cfg-avatar">{agent.name?.[0]?.toUpperCase() || "A"}</div>
            <div className="cfg-fields">
              <div className="cfg-grid">
                <Field label="Agent Name" required>
                  <input className="cfg-input" value={agent.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Voice Type">
                  <div className="cfg-radios">
                    <Radio checked={agent.voice_type === "REALTIME"} onChange={() => set("voice_type", "REALTIME")} label="Real Time" />
                    <Radio checked={agent.voice_type === "STT_TTS"} onChange={() => set("voice_type", "STT_TTS")} label="STT-TTS" />
                  </div>
                </Field>
                <Field label="Voice Gender">
                  <select className="cfg-input" value={agent.voice_gender} onChange={(e) => set("voice_gender", e.target.value)}>
                    <option>Female</option><option>Male</option><option>Neutral</option>
                  </select>
                </Field>
                <Field label="Voice" required>
                  <select className="cfg-input" value={agent.voice} onChange={(e) => set("voice", e.target.value)}>
                    {options.voices.map((v) => <option key={v.value} value={v.value}>{v.label.split(" —")[0]}</option>)}
                  </select>
                </Field>
                <Field label="Background Audio">
                  <select className="cfg-input" value={agent.background_audio} onChange={(e) => set("background_audio", e.target.value)}>
                    <option value="">Select Background</option>
                    <option>Office</option><option>Call center</option><option>None</option>
                  </select>
                </Field>
                <Field label="Language">
                  <select className="cfg-input" value={agent.language} onChange={(e) => set("language", e.target.value)}>
                    {options.languages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Call Direction" required>
                <div className="cfg-radios cfg-radios--wrap">
                  {[["INBOUND", "Inbound"], ["OUTBOUND", "Outbound"], ["REMINDER", "Remainder"], ["OUTBOUND_PATIENT", "Outbound Patient"]].map(([v, l]) => (
                    <Radio key={v} checked={agent.call_direction === v} onChange={() => set("call_direction", v)} label={l} />
                  ))}
                  <label className="cfg-check">
                    <input type="checkbox" checked={agent.system_integration} onChange={(e) => set("system_integration", e.target.checked)} />
                    System Integration
                  </label>
                </div>
              </Field>
            </div>
          </div>
        </section>

        <section className="cfg-card cfg-card--phone">
          <h2 className="cfg-card__title"><span className="cfg-ico">📞</span> Phone Settings</h2>
          <Field label="Phone Numbers (1)">
            <div className="cfg-inline">
              <input className="cfg-input" placeholder="+1 800 000 0000"
                value={(agent.phone_numbers || [])[0] || ""}
                onChange={(e) => set("phone_numbers", [e.target.value])} />
            </div>
          </Field>
          <Field label="Max Concurrent Calls">
            <input type="number" className="cfg-input" value={agent.max_concurrent_calls}
              onChange={(e) => set("max_concurrent_calls", Number(e.target.value))} />
          </Field>
          <Field label="Call Recording">
            <select className="cfg-input" value={agent.call_recording} onChange={(e) => set("call_recording", e.target.value)}>
              <option value="">Select Call Recording</option>
              <option>All calls</option><option>Inbound only</option><option>Outbound only</option><option>None</option>
            </select>
          </Field>
        </section>
      </div>

      {/* Call Settings */}
      <section className="cfg-card">
        <h2 className="cfg-card__title"><span className="cfg-ico">📱</span> Call Settings</h2>
        <div className="cfg-subhead">CALL FORWARDING &amp; END MESSAGES</div>
        <div className="cfg-grid">
          <ListField label="End Call Messages" values={agent.end_call_messages || []}
            onChange={(v) => set("end_call_messages", v)} placeholder="have a great day" />
          <ListField label="Forward Messages #1" values={agent.forward_messages || []}
            onChange={(v) => set("forward_messages", v)} placeholder="+1 800 000 0000" />
          <Field label="Retry">
            <input type="number" className="cfg-input" value={agent.retry} onChange={(e) => set("retry", Number(e.target.value))} />
          </Field>
          <Field label="Delay (min)">
            <input type="number" className="cfg-input" value={agent.delay_minutes} onChange={(e) => set("delay_minutes", Number(e.target.value))} />
          </Field>
          <ListField label="Keys" values={agent.keys || []} onChange={(v) => set("keys", v)} placeholder="medical" />
        </div>
        <label className="cfg-check" style={{ marginTop: "0.75rem" }}>
          <input type="checkbox" checked={agent.continue_recording_after_forward}
            onChange={(e) => set("continue_recording_after_forward", e.target.checked)} />
          Continue Recording after forwarding
        </label>
      </section>

      {/* Agent Versioning */}
      <section className="cfg-card">
        <h2 className="cfg-card__title"><span className="cfg-ico">🔄</span> Agent Versioning</h2>
        <p className="agentcfg__hint" style={{ marginTop: 0 }}>
          The <strong>Status</strong> column shows each version's current state. The <strong>Actions</strong> buttons change it —
          the button matching the current status is disabled.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Version</th><th>Voice Type</th><th>Agent Type</th><th>Status</th><th>Created By</th><th>Created Date</th><th>Updated At</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className={v.status === "ACTIVE" ? "ver-row--active" : ""}>
                  <td>{v.version}</td>
                  <td>{v.voice_type}</td>
                  <td>{v.agent_type}</td>
                  <td><span className={statusPill[v.status]}>{v.status_label}</span></td>
                  <td>{v.created_by_name || "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(v.created_at).toLocaleString()}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(v.updated_at).toLocaleString()}</td>
                  <td>
                    <div className="ver-actions">
                      <div className="ver-toggle">
                        {VER_ACTIONS.map((a) => {
                          const current = v.status === a.status;
                          return (
                            <button key={a.status} disabled={current}
                              title={current ? `Already ${a.status.toLowerCase()}` : a.label}
                              className={`ver-seg ${current ? `is-current is-${a.status.toLowerCase()}` : ""}`}
                              onClick={() => onVersionStatus(v, a.status)}>
                              {current ? `${a.status[0] + a.status.slice(1).toLowerCase()} ✓` : a.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ver-footer">
          <span className="muted">Showing 1 to {versions.length} of {versions.length}</span>
        </div>
      </section>
    </>
  );
}

/* Call Script tab — the agent's prompt & greeting. */
function CallScriptTab({ agent, set, onSave }) {
  return (
    <section className="cfg-card" style={{ marginTop: "1.25rem" }}>
      <h2 className="cfg-card__title"><span className="cfg-ico">📝</span> Call Script</h2>
      <Field label="Greeting">
        <textarea className="cfg-input cfg-textarea" rows={2} value={agent.greeting}
          onChange={(e) => set("greeting", e.target.value)} placeholder="The first thing the agent says…" />
      </Field>
      <Field label="System prompt">
        <textarea className="cfg-input cfg-textarea" rows={10} value={agent.system_prompt}
          onChange={(e) => set("system_prompt", e.target.value)} placeholder="How the agent behaves…" />
      </Field>
      <button className="btn btn--primary btn--sm" onClick={onSave}>Save script</button>
    </section>
  );
}

/* -------------------------------------------------------------- helpers --- */
function Field({ label, required, children }) {
  return (
    <label className="cfg-field">
      <span className="cfg-label">{label}{required && <span className="cfg-req"> *</span>}</span>
      {children}
    </label>
  );
}
function Radio({ checked, onChange, label }) {
  return (
    <label className="cfg-radio">
      <input type="radio" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
function ListField({ label, values, onChange, placeholder }) {
  const v0 = values[0] || "";
  return (
    <div className="cfg-field">
      <span className="cfg-label">{label}</span>
      <div className="cfg-listrow">
        <input className="cfg-input" value={v0} placeholder={placeholder}
          onChange={(e) => onChange([e.target.value, ...values.slice(1)])} />
        <button type="button" className="cfg-mini" onClick={() => onChange([...values, ""])}>+</button>
        <button type="button" className="cfg-mini" onClick={() => onChange(values.slice(0, -1))} disabled={values.length <= 1}>−</button>
      </div>
    </div>
  );
}
