/**
 * SkillRunner — one page that powers every healthcare workflow.
 *
 * It loads a skill's schema from /skills/:slug, renders an input form from the
 * declared fields (text / number / date / select / textarea / connector), runs
 * it (POST /skills/:slug/run), and shows the structured output. Recent runs for
 * the skill are listed underneath. This is the "input -> output" concept made
 * generic: add a skill on the backend and its UI appears here automatically.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../api/client.js";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const STATUS_CLASS = {
  success: "pill pill--active",
  warning: "pill pill--suspended",
  error: "pill pill--expired",
};

// Minimal CSV parser: first row is the header (field names), rest are records.
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    headers.forEach((h, i) => { row[h] = (cells[i] || "").trim(); });
    return row;
  });
}

export default function SkillRunner() {
  const { slug } = useParams();

  const [skill, setSkill] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [values, setValues] = useState({});
  const [output, setOutput] = useState(null);
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const [batchMode, setBatchMode] = useState(false); // #6
  const [batchResult, setBatchResult] = useState(null);
  const [appeal, setAppeal] = useState(null); // #4 — {doc: ""} when appeal form open
  const [scheduleOpen, setScheduleOpen] = useState(false); // #7
  const [scheduleCadence, setScheduleCadence] = useState("DAILY");
  const [scheduleMsg, setScheduleMsg] = useState("");
  usePageHeader(skill?.name || "Workflow", skill?.description || "");

  useEffect(() => {
    setSkill(null);
    setOutput(null);
    setError("");
    setValues({});
    setBatchResult(null);
    setAppeal(null);
    api.get(`/skills/${slug}/`).then(({ data }) => setSkill(data)).catch(() => setError("Unknown skill."));
    api.get("/connectors/").then(({ data }) => setConnectors(data)).catch(() => setConnectors([]));
    loadHistory();
  }, [slug]);

  function loadHistory() {
    api.get(`/skill-runs/?skill=${slug}`).then(({ data }) => setHistory(data)).catch(() => setHistory([]));
  }

  function setField(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function execute(payload) {
    setRunning(true);
    setError("");
    setOutput(null);
    try {
      const { data } = await api.post(`/skills/${slug}/run/`, payload);
      setOutput(data.output);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not run this skill.");
    } finally {
      setRunning(false);
    }
  }

  function run(event) {
    event.preventDefault();
    setAppeal(null);
    execute(values);
  }

  // Output actions: "appeal" opens a documentation form; others just re-run.
  function runAction(action) {
    if (action.kind === "appeal") {
      setAppeal({ doc: "" });
      return;
    }
    execute({ ...values, ...(action.params || {}) });
  }

  function submitAppeal(event) {
    event.preventDefault();
    execute({ ...values, _appeal: "1", appeal_documentation: appeal.doc });
    setAppeal(null);
  }

  // #6 Batch: parse a CSV (header row -> field names) and run every row.
  async function runBatch(file) {
    setRunning(true);
    setError("");
    setBatchResult(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) throw new Error("empty");
      const { data } = await api.post(`/skills/${slug}/batch/`, { rows });
      setBatchResult(data);
      loadHistory();
    } catch {
      setError("Could not process the CSV. Ensure the first row has column headers.");
    } finally {
      setRunning(false);
    }
  }

  // #7 Schedule: save a recurring job from the current input.
  async function saveSchedule() {
    setScheduleMsg("");
    try {
      await api.post("/scheduled-runs/", { skill_slug: slug, cadence: scheduleCadence, input: values });
      setScheduleMsg("Scheduled! Manage it under Scheduled Runs.");
    } catch {
      setScheduleMsg("Could not schedule.");
    }
  }

  if (error && !skill) return <div className="alert alert--error">{error}</div>;
  if (!skill) return <p className="muted">Loading…</p>;

  const csvColumns = skill.inputs.filter((f) => f.type !== "connector").map((f) => f.name);

  return (
    <>
      {/* Mode toolbar */}
      <div className="page-actions runner__toolbar">
        <div className="segmented">
          <button className={`segmented__btn ${!batchMode ? "is-active" : ""}`} onClick={() => setBatchMode(false)}>
            Single
          </button>
          <button className={`segmented__btn ${batchMode ? "is-active" : ""}`} onClick={() => setBatchMode(true)}>
            Batch
          </button>
        </div>
        {!batchMode && (
          <button className="btn btn--ghost btn--sm" onClick={() => setScheduleOpen((v) => !v)}>
            🕑 Schedule
          </button>
        )}
      </div>

      {/* Schedule popover (#7) */}
      {scheduleOpen && !batchMode && (
        <div className="schedule-pop">
          <span className="field__label" style={{ margin: 0 }}>Run this</span>
          <select className="field__input" style={{ width: "auto" }}
            value={scheduleCadence} onChange={(e) => setScheduleCadence(e.target.value)}>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
          <button className="btn btn--primary btn--sm" onClick={saveSchedule}>Save schedule</button>
          {scheduleMsg && <span className="muted">{scheduleMsg}</span>}
        </div>
      )}

      <div className="runner">
        {/* Input */}
        {batchMode ? (
          <div className="runner__panel">
            <h2 className="section-title" style={{ marginTop: 0 }}>Batch input</h2>
            {error && <div className="alert alert--error">{error}</div>}
            <p className="muted">
              Upload a CSV with one row per record. Columns:&nbsp;
              <code className="mfa__secret" style={{ padding: "2px 6px" }}>{csvColumns.join(", ")}</code>
            </p>
            <label className="btn btn--primary btn--block" style={{ textAlign: "center" }}>
              {running ? "Running batch…" : "Upload CSV & run"}
              <input type="file" accept=".csv,text/csv" hidden disabled={running}
                onChange={(e) => e.target.files?.[0] && runBatch(e.target.files[0])} />
            </label>
          </div>
        ) : (
          <form className="runner__panel" onSubmit={run}>
            <h2 className="section-title" style={{ marginTop: 0 }}>Input</h2>
            {error && <div className="alert alert--error">{error}</div>}
            {skill.inputs.map((f) => (
              <SkillField key={f.name} field={f} value={values[f.name] || ""}
                connectors={connectors} onChange={(v) => setField(f.name, v)} />
            ))}
            <button className="btn btn--primary btn--block" disabled={running}>
              {running ? "Running…" : `Run ${skill.name}`}
            </button>
          </form>
        )}

        {/* Output */}
        <div className="runner__panel">
          <h2 className="section-title" style={{ marginTop: 0 }}>Output</h2>
          {batchMode ? (
            !batchResult ? (
              <p className="muted">Upload a CSV to run the skill for every row.</p>
            ) : (
              <div className="result">
                <div className="result__head">
                  <h3 className="result__headline">{batchResult.count} rows processed</h3>
                </div>
                <div className="batch-summary">
                  {Object.entries(batchResult.summary).map(([k, v]) => (
                    <span key={k} className={STATUS_CLASS[k] || "pill"}>{v} {k}</span>
                  ))}
                </div>
                <div className="table-wrap" style={{ marginTop: "1rem" }}>
                  <table className="table">
                    <thead><tr><th>#</th><th>Result</th><th>Status</th></tr></thead>
                    <tbody>
                      {batchResult.results.map((r) => (
                        <tr key={r.row}>
                          <td>{r.row}</td>
                          <td>{r.headline}</td>
                          <td><span className={STATUS_CLASS[r.status] || "pill"}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : !output ? (
            <p className="muted">Fill in the input and run the skill — the result appears here.</p>
          ) : (
            <div className="result">
              <div className="result__head">
                <span className={STATUS_CLASS[output.status] || "pill"}>{output.status}</span>
                <h3 className="result__headline">{output.headline}</h3>
              </div>
              <dl className="result__fields">
                {output.fields.map((f) => (
                  <div className="result__row" key={f.label}>
                    <dt>{f.label}</dt><dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              {output.meta?.via_connector && <p className="result__via">via {output.meta.via_connector}</p>}

              {output.actions?.length > 0 && !appeal && (
                <div className="result__actions">
                  {output.actions.map((a) => (
                    <button key={a.label} className="btn btn--primary btn--sm" disabled={running} onClick={() => runAction(a)}>
                      {a.label}
                    </button>
                  ))}
                </div>
              )}

              {/* #4 Appeal documentation form */}
              {appeal && (
                <form className="appeal-form" onSubmit={submitAppeal}>
                  <span className="field__label">Additional clinical documentation</span>
                  <textarea className="field__input field__textarea" rows={4} autoFocus
                    value={appeal.doc} onChange={(e) => setAppeal({ doc: e.target.value })}
                    placeholder="Summarise the clinical records supporting this authorization…" required />
                  <div className="result__actions" style={{ borderTop: "none", paddingTop: 0 }}>
                    <button className="btn btn--primary btn--sm" disabled={running}>Submit appeal</button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAppeal(null)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <section className="allocate">
        <h2 className="section-title">Recent runs ({history.length})</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Result</th>
                <th>Status</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.output?.headline || "—"}</td>
                  <td>
                    <span className={STATUS_CLASS[r.status] || "pill"}>{r.status}</span>
                  </td>
                  <td>{r.created_by_name || "—"}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="4" className="muted">
                    No runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------- one input field --- */
function SkillField({ field, value, connectors, onChange }) {
  const label = (
    <span className="field__label">
      {field.label}
      {field.required && " *"}
    </span>
  );

  if (field.type === "textarea") {
    return (
      <label className="field">
        {label}
        <textarea
          className="field__input field__textarea"
          rows={3}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="field">
        {label}
        <select
          className="field__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "connector") {
    return (
      <label className="field">
        {label}
        <select
          className="field__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">MedXFlow managed (default)</option>
          {connectors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.kind_label} ({c.status_label})
            </option>
          ))}
        </select>
        <span className="field__hint">
          Optionally route this run through one of your connectors.
        </span>
      </label>
    );
  }

  return (
    <label className="field">
      {label}
      <input
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        className="field__input"
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
