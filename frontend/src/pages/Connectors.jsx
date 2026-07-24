/**
 * Connectors — manage integrations to MCP servers and REST APIs. Skills can run
 * "through" a connector. Add / test / remove connectors here; API keys are
 * write-only and never displayed back.
 */
import { useEffect, useState } from "react";

import api from "../api/client.js";
import { PlugIcon } from "../components/icons.jsx";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const STATUS_CLASS = {
  CONNECTED: "pill pill--active",
  DISCONNECTED: "pill pill--suspended",
  ERROR: "pill pill--expired",
};

const EMPTY = { name: "", kind: "REST", base_url: "", description: "", api_key: "" };

export default function Connectors() {
  const [connectors, setConnectors] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null); // connector id being tested
  usePageHeader("Connectors", "Connect to MCP servers and REST APIs. Your workflows run through them.");

  function load() {
    api.get("/connectors/").then(({ data }) => setConnectors(data)).catch(() => setConnectors([]));
  }
  useEffect(load, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function add(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/connectors/", form);
      setForm(EMPTY);
      load();
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Could not add connector."
      );
    } finally {
      setSaving(false);
    }
  }

  async function test(id) {
    setTesting(id);
    try {
      await api.post(`/connectors/${id}/test/`);
    } finally {
      setTesting(null);
      load();
    }
  }

  async function remove(id) {
    if (!window.confirm("Remove this connector?")) return;
    await api.delete(`/connectors/${id}/`);
    load();
  }

  return (
    <>
      <div className="runner">
        {/* Add connector */}
        <form className="runner__panel" onSubmit={add}>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Add a connector
          </h2>
          {error && <div className="alert alert--error">{error}</div>}

          <label className="field">
            <span className="field__label">Name *</span>
            <input className="field__input" value={form.name}
              onChange={(e) => set("name", e.target.value)} placeholder="e.g. Availity Eligibility API" />
          </label>

          <label className="field">
            <span className="field__label">Type *</span>
            <select className="field__input" value={form.kind} onChange={(e) => set("kind", e.target.value)}>
              <option value="REST">REST API</option>
              <option value="MCP">MCP Server</option>
            </select>
          </label>

          <label className="field">
            <span className="field__label">{form.kind === "MCP" ? "MCP server URL *" : "Base URL *"}</span>
            <input className="field__input" value={form.base_url}
              onChange={(e) => set("base_url", e.target.value)} placeholder="https://…" />
          </label>

          <label className="field">
            <span className="field__label">Description</span>
            <input className="field__input" value={form.description}
              onChange={(e) => set("description", e.target.value)} placeholder="What does it do?" />
          </label>

          <label className="field">
            <span className="field__label">API key / token</span>
            <input className="field__input" type="password" value={form.api_key}
              onChange={(e) => set("api_key", e.target.value)} placeholder="Stored securely, never shown again" />
          </label>

          <button className="btn btn--primary btn--block" disabled={saving}>
            {saving ? "Adding…" : "Add connector"}
          </button>
        </form>

        {/* Connector list */}
        <div className="runner__panel">
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Your connectors {connectors ? `(${connectors.length})` : ""}
          </h2>
          {connectors === null ? (
            <p className="muted">Loading…</p>
          ) : connectors.length === 0 ? (
            <p className="muted">No connectors yet. Add one on the left.</p>
          ) : (
            <ul className="connector-list">
              {connectors.map((c) => (
                <li key={c.id} className="connector">
                  <span className="connector__icon">
                    <PlugIcon width={20} height={20} />
                  </span>
                  <div className="connector__body">
                    <div className="connector__top">
                      <span className="connector__name">{c.name}</span>
                      <span className={STATUS_CLASS[c.status] || "pill"}>{c.status_label}</span>
                    </div>
                    <span className="connector__meta">
                      {c.kind_label} · {c.base_url}
                    </span>
                  </div>
                  <div className="connector__actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => test(c.id)} disabled={testing === c.id}>
                      {testing === c.id ? "Testing…" : "Test"}
                    </button>
                    <button className="btn btn--danger-ghost btn--sm" onClick={() => remove(c.id)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
