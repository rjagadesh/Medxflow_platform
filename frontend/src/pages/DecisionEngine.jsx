/**
 * Decision Engine — a full-page conversational analytics module ("talk to your
 * data"). Pick a data source (the built-in MedXFlow database, or an external one
 * added by connection string); ask a question in plain language; the AI reads
 * the schema, writes a read-only SQL query, pulls the data and answers with a
 * summary, a table and — where it helps — a chart. Off-topic questions are
 * answered from the LLM's general knowledge instead.
 *
 * Backend: POST /decision-engine/ask/, GET/POST/DELETE /decision-engine/connections/.
 */
import { useEffect, useRef, useState } from "react";

import api from "../api/client.js";
import DataChart from "../components/DataChart.jsx";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const SUGGESTIONS = [
  "How many skill runs do we have, by status?",
  "Revenue from claim submissions per month this year",
  "Which connectors are being used most?",
  "Show VOB calls by decision as a chart",
];

function formatCell(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return v.toLocaleString();
  return String(v);
}

function ResultTable({ columns, rows, rowCount }) {
  if (!columns?.length || !rows?.length) return null;
  const shown = rows.slice(0, 50);
  return (
    <div className="de-table-wrap">
      <table className="de-table">
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={i}>{columns.map((c) => <td key={c}>{formatCell(r[c])}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {rowCount > shown.length && (
        <p className="de-table__more">Showing {shown.length} of {rowCount} rows.</p>
      )}
    </div>
  );
}

export default function DecisionEngine() {
  usePageHeader("Decision Engine", "Ask your data anything — the AI writes the query, pulls the numbers and charts them.");

  const [connections, setConnections] = useState([{ id: "builtin", name: "MedXFlow operational database", builtin: true }]);
  const [activeConn, setActiveConn] = useState("builtin");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { loadConnections(); }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function loadConnections() {
    api.get("/decision-engine/connections/").then(({ data }) => setConnections(data)).catch(() => {});
  }

  async function send(text) {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    try {
      const { data } = await api.post("/decision-engine/ask/", { connection_id: activeConn, question });
      setMessages((m) => [...m, { role: "assistant", ...data }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", kind: "error", summary: "Request failed. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const activeName = connections.find((c) => String(c.id) === String(activeConn))?.name || "database";

  return (
    <div className="de-chat">
      {/* Data source bar */}
      <div className="de-bar">
        <label className="de-bar__label">Data source</label>
        <select className="de-bar__select" value={activeConn} onChange={(e) => setActiveConn(e.target.value)}>
          {connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.builtin ? "" : ` · ${c.engine}`}{c.status === "error" ? " (error)" : ""}
            </option>
          ))}
        </select>
        <button className="de-bar__add" onClick={() => setShowAdd(true)}>+ Add data source</button>
      </div>

      {/* Transcript */}
      <div className="de-scroll" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="de-empty">
            <h2>Ask <strong>{activeName}</strong> anything</h2>
            <p>I'll read the schema, write a read-only query and answer with a summary, a table and a chart. Try:</p>
            <div className="de-chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="de-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="de-msg de-msg--user"><div className="de-bubble">{m.text}</div></div>
          ) : (
            <div key={i} className="de-msg de-msg--ai">
              <div className={`de-answer ${m.kind === "error" ? "de-answer--error" : ""}`}>
                <p className="de-summary">{m.summary}</p>
                {m.chart && <DataChart chart={m.chart} rows={m.rows} />}
                {m.kind === "sql" && <ResultTable columns={m.columns} rows={m.rows} rowCount={m.row_count} />}
                {m.kind === "general" && <span className="de-badge">answered from general knowledge</span>}
                {m.sql && (
                  <details className="de-sql">
                    <summary>View SQL</summary>
                    <pre>{m.sql}</pre>
                  </details>
                )}
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="de-msg de-msg--ai">
            <div className="de-answer de-answer--loading">
              <span className="de-dots"><i /><i /><i /></span> Reading the schema and querying…
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form className="de-composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input
          className="de-input" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${activeName}…`} disabled={loading}
        />
        <button className="de-send" type="submit" disabled={loading || !input.trim()}>Ask ➤</button>
      </form>

      {showAdd && (
        <AddConnectionModal connections={connections} onClose={() => setShowAdd(false)} onChanged={loadConnections} />
      )}
    </div>
  );
}

function AddConnectionModal({ connections, onClose, onChanged }) {
  const [form, setForm] = useState({ name: "", engine: "postgres", connection_string: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const stored = connections.filter((c) => !c.builtin);

  async function add(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api.post("/decision-engine/connections/", form);
      setForm({ name: "", engine: "postgres", connection_string: "" });
      onChanged();
    } catch (e2) {
      const d = e2?.response?.data;
      setErr(d?.connection_string || d?.detail || "Could not connect. Check the connection string.");
    } finally { setBusy(false); }
  }

  async function remove(id) {
    await api.delete(`/decision-engine/connections/${id}/`).catch(() => {});
    onChanged();
  }

  return (
    <div className="de-modal-backdrop" onClick={onClose}>
      <div className="de-modal" onClick={(e) => e.stopPropagation()}>
        <div className="de-modal__head">
          <h3>Data sources</h3>
          <button className="de-modal__x" onClick={onClose}>✕</button>
        </div>

        {stored.length > 0 && (
          <ul className="de-connlist">
            {stored.map((c) => (
              <li key={c.id}>
                <span><strong>{c.name}</strong> · {c.engine} · {c.table_count ?? 0} tables</span>
                <button onClick={() => remove(c.id)} title="Remove">✕</button>
              </li>
            ))}
          </ul>
        )}

        <form className="de-form" onSubmit={add}>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Billing warehouse" required />
          <label>Engine</label>
          <select value={form.engine} onChange={(e) => setForm({ ...form, engine: e.target.value })}>
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
          </select>
          <label>Connection string</label>
          <input value={form.connection_string} onChange={(e) => setForm({ ...form, connection_string: e.target.value })}
            placeholder="postgresql://user:pass@host:5432/dbname" required />
          {err && <div className="alert alert--error">{err}</div>}
          <button className="de-bar__add" type="submit" disabled={busy}>
            {busy ? "Connecting…" : "Test & add connection"}
          </button>
          <p className="muted" style={{ fontSize: ".8rem", marginTop: ".5rem" }}>
            The connection string is stored server-side and never shown again. Queries run read-only.
          </p>
        </form>
      </div>
    </div>
  );
}
