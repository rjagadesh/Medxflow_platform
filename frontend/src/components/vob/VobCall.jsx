/**
 * Place VOB Call — recreated to match the TUYW insurance voice-agent console:
 * a three-panel mission-control layout (left: member info + config + keypad,
 * centre: status + waveform + live transcript, right: live VOB extraction),
 * re-skinned in the MedXFlow green theme. The backend pipeline is simulated; the
 * transcript streams turn-by-turn for a live feel.
 */
import { useEffect, useRef, useState } from "react";

import api from "../../api/client.js";

const SPEAKER = {
  agent: { label: "Agent", cls: "vt--agent" },
  rep: { label: "Rep", cls: "vt--rep" },
  ivr: { label: "IVR", cls: "vt--ivr" },
  system: { label: "System", cls: "vt--system" },
};
const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

// Fixed ordered VOB rows so the right panel always shows the full benefit set.
const VOB_ROWS = [
  ["eligibility", "Eligibility"],
  ["plan_type", "Plan type"],
  ["in_network", "Network"],
  ["deductible_individual", "Deductible (ind.)"],
  ["deductible_met", "Deductible met"],
  ["out_of_pocket_max", "Out-of-pocket max"],
  ["out_of_pocket_met", "OOP met"],
  ["copay", "Copay"],
  ["coinsurance", "Coinsurance"],
  ["prior_auth", "Prior auth"],
  ["effective_date", "Effective date"],
];

const BLANK = {
  patient_name: "", member_id: "", npi: "", group_number: "", dob: "",
  payer: "", insurance_phone: "", cpt_codes: "",
  voice: "rachel", dtmf_mode: "AUTO", instruction: "", ivr_config: "",
};

export default function VobCall() {
  const [form, setForm] = useState(BLANK);
  const [voices, setVoices] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const [call, setCall] = useState(null);
  const [shown, setShown] = useState(0);
  const [mode, setMode] = useState("ivr");
  const [manualSay, setManualSay] = useState("");
  const timer = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    api.get("/vob/options/").then(({ data }) => setVoices(data.voices));
    api.get("/vob/instructions/").then(({ data }) => setInstructions(data));
    api.get("/vob/ivr-configs/").then(({ data }) => setConfigs(data));
    return () => clearInterval(timer.current);
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function stream(fullCall) {
    setCall(fullCall);
    setShown(0);
    setMode("ivr");
    const turns = fullCall.transcript || [];
    let i = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      i += 1;
      setShown(i);
      if (turns[i - 1]?.kind === "mode") setMode("human");
      if (i >= turns.length) clearInterval(timer.current);
      bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
    }, 520);
  }

  async function placeCall(e) {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      const payload = { ...form };
      if (!payload.instruction) delete payload.instruction;
      if (!payload.ivr_config) delete payload.ivr_config;
      const { data } = await api.post("/vob/calls/", payload);
      stream(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not place the call.");
    } finally {
      setPlacing(false);
    }
  }

  const streaming = call && shown < (call.transcript?.length || 0);
  const done = call && !streaming;
  const live = placing || streaming;
  const visibleTurns = (call?.transcript || []).slice(0, shown);

  const statusText = placing ? "DIALING" : streaming ? (mode === "human" ? "LIVE REP" : "IVR MODE")
    : done ? "COMPLETED" : "READY";
  const statusCls = placing ? "calling" : live ? "active" : done ? "active" : "";

  return (
    <div className={`vob-console ${done || streaming ? "with-vob" : ""}`}>
      {/* Console header */}
      <header className="vob-console__head">
        <div className="vob-logo">
          <span className="vob-logo__dot" />
          Insurance Voice Agent <span>· Verification of Benefits</span>
        </div>
        <div className="vob-statusbar">
          <span className={`vob-pill ${statusCls}`}><span className="vob-dot" /> {statusText}</span>
        </div>
      </header>

      <div className="vob-console__body">
        {/* LEFT — member information + config */}
        <aside className="vob-left">
          {error && <div className="alert alert--error">{error}</div>}

          <span className="panel-label">Insurance Phone Number</span>
          <form className="vob-phone-wrap" onSubmit={placeCall}>
            <span className="vob-flag">🇺🇸</span>
            <input className="vob-phone" value={form.insurance_phone}
              onChange={(e) => set("insurance_phone", e.target.value)} placeholder="1-800-000-0000" />
            <button className={`vob-dial ${placing ? "calling" : ""}`} disabled={placing} title="Place call">
              {placing ? "■" : "📞"}
            </button>
          </form>

          <span className="panel-label">Member Information</span>
          <div className="vob-fieldgrid">
            <Field label="Patient Name" v={form.patient_name} on={(x) => set("patient_name", x)} ph="Jane Doe" />
            <Field label="Member ID" v={form.member_id} on={(x) => set("member_id", x)} ph="ABC123456789" mono />
            <Field label="NPI ID" v={form.npi} on={(x) => set("npi", x)} ph="1234567890" mono />
            <Field label="Group Number" v={form.group_number} on={(x) => set("group_number", x)} ph="GRP0001" mono />
            <Field label="Patient DOB" v={form.dob} on={(x) => set("dob", x)} ph="MM/DD/YYYY" mono />
            <Field label="Payer" v={form.payer} on={(x) => set("payer", x)} ph="Aetna PPO" />
            <Field label="CPT Codes" v={form.cpt_codes} on={(x) => set("cpt_codes", x)} ph="99213" mono />
          </div>

          <span className="panel-label">Agent Voice</span>
          <div className="vob-chips">
            {voices.map((v) => (
              <button key={v.value} type="button"
                className={`vob-chip ${form.voice === v.value ? "selected" : ""}`}
                onClick={() => set("voice", v.value)}>{v.value}</button>
            ))}
          </div>

          <span className="panel-label">DTMF Mode</span>
          <div className="vob-chips">
            {["AUTO", "MANUAL"].map((m) => (
              <button key={m} type="button" className={`vob-chip ${form.dtmf_mode === m ? "selected" : ""}`}
                onClick={() => set("dtmf_mode", m)}>{m}</button>
            ))}
          </div>

          <span className="panel-label">Agent Instructions</span>
          <select className="vob-select" value={form.instruction} onChange={(e) => set("instruction", e.target.value)}>
            <option value="">Default</option>
            {instructions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>

          <span className="panel-label">IVR Config</span>
          <select className="vob-select" value={form.ivr_config} onChange={(e) => set("ivr_config", e.target.value)}>
            <option value="">None (agent navigates)</option>
            {configs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </aside>

        {/* CENTER — waveform + transcript */}
        <section className="vob-center">
          <div className="vob-center__bar">
            <span className={`vob-pill ${mode === "human" && (live || done) ? "active" : live ? "calling" : ""}`}>
              <span className="vob-dot" /> {live ? (mode === "human" ? "Live representative" : "Navigating IVR") : done ? "Call complete" : "Idle"}
            </span>
            <div className={`vob-wave ${live ? "is-live" : ""}`}>
              {Array.from({ length: 9 }).map((_, i) => <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />)}
            </div>
          </div>

          <div className="vob-transcript-panel" ref={bodyRef}>
            {!call ? (
              <div className="vob-transcript-empty">
                <span className="vob-transcript-empty__icon">📞</span>
                Enter member information and press the call button to begin.
              </div>
            ) : (
              <>
                {visibleTurns.map((t, i) => {
                  const s = SPEAKER[t.speaker] || SPEAKER.system;
                  return (
                    <div key={i} className={`vt ${s.cls} ${t.kind === "dtmf" ? "vt--dtmf" : ""}`}>
                      <span className="vt__who">{t.kind === "dtmf" ? "⌨ DTMF" : s.label}</span>
                      <span className="vt__text">{t.text}</span>
                    </div>
                  );
                })}
                {streaming && <div className="vt vt--system"><span className="vt__who" /><span className="vt__text typing"><span /><span /><span /></span></div>}
              </>
            )}
          </div>

          {/* Manual keypad row */}
          <div className="vob-keyrow">
            <div className="vob-keypad">
              {KEYPAD.map((k) => <button key={k} type="button" className="vob-key" disabled>{k}</button>)}
            </div>
            <div className="vob-say">
              <input className="vob-select" placeholder="Manual Say — make the agent speak…"
                value={manualSay} onChange={(e) => setManualSay(e.target.value)} disabled />
              <button type="button" className="vob-chip" disabled>Say</button>
            </div>
          </div>
        </section>

        {/* RIGHT — live VOB extraction */}
        <aside className="vob-right">
          <div className="vob-right__header">
            <span className="vob-right__title">Extracted VOB</span>
            {done && (
              <span className={`vob-confidence ${call.confidence >= 0.92 ? "ok" : "warn"}`}>
                {Math.round(call.confidence * 100)}%
              </span>
            )}
          </div>
          <div className="vob-grid2">
            {VOB_ROWS.map(([key, label]) => {
              const val = call?.vob_data?.[key];
              return (
                <div key={key} className="vob-field2">
                  <span className="vob-key2">{label}</span>
                  <span className={`vob-val2 ${val ? "" : "empty"}`}>{val ? val.value : "—"}</span>
                </div>
              );
            })}
          </div>
          {done && (
            <div className="vob-decision">
              <span className="panel-label">Decision</span>
              <span className={`vob-decision__badge ${call.confidence >= 0.92 ? "ok" : "warn"}`}>{call.decision}</span>
              {call.recording_url && (
                <div className="vobd-recording" style={{ marginTop: 8 }}>
                  <audio controls preload="none" src={call.recording_url} className="vobd-audio" />
                  <a className="vob-chip" href={call.recording_url} download>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: "-2px" }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>Download
                  </a>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({ label, v, on, ph, mono }) {
  return (
    <div className="vob-fg">
      <span className="vob-fg__label">{label}</span>
      <input className={`vob-fg__input ${mono ? "mono" : ""}`} value={v} onChange={(e) => on(e.target.value)} placeholder={ph} />
    </div>
  );
}
