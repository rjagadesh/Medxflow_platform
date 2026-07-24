/**
 * Review Queue (#5) — every run across all workflows with a warning/error status
 * that's still open. Select one, take an action (approve / retry / escalate /
 * resolve); resolving removes it from the queue.
 */
import { useEffect, useState } from "react";

import api from "../api/client.js";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const STATUS_CLASS = { warning: "pill pill--suspended", error: "pill pill--expired" };
const ACTIONS = [
  { key: "approve", label: "Approve" },
  { key: "retry", label: "Retry" },
  { key: "escalate", label: "Escalate" },
  { key: "resolve", label: "Resolve" },
];

export default function ReviewQueue() {
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  usePageHeader("Review Queue", "Runs with warnings or errors that need attention.");

  function load() {
    api.get("/review-queue/").then(({ data }) => {
      setItems(data);
      setSelected((s) => data.find((r) => r.id === s?.id) || null);
    });
  }
  useEffect(load, []);

  async function act(action) {
    if (!selected) return;
    setBusy(true);
    try {
      await api.post(`/skill-runs/${selected.id}/resolve/`, { action });
      setSelected(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  if (!items) return <p className="muted">Loading queue…</p>;

  return (
    <div className="vault">
      {/* List */}
      <div className="vault__list">
        <div className="vault__search" style={{ fontWeight: 600, color: "var(--green-900)" }}>
          {items.length} open item{items.length === 1 ? "" : "s"}
        </div>
        <ul className="vault__items">
          {items.map((r) => (
            <li key={r.id}>
              <button
                className={`vault__item ${selected?.id === r.id ? "is-selected" : ""}`}
                onClick={() => setSelected(r)}
              >
                <span className={STATUS_CLASS[r.status]} style={{ minWidth: 60, textAlign: "center" }}>
                  {r.status}
                </span>
                <span className="vault__item-body">
                  <span className="vault__item-title">{r.skill_name}</span>
                  <span className="vault__item-sub">{r.output?.headline || "—"}</span>
                </span>
              </button>
            </li>
          ))}
          {items.length === 0 && <li className="vault__empty muted">🎉 Queue is clear — nothing to review.</li>}
        </ul>
      </div>

      {/* Detail + actions */}
      <div className="vault__detail">
        {!selected ? (
          <div className="vault__placeholder">
            <span className="vault__placeholder-icon">📥</span>
            <p className="muted">Select an item to review and take action.</p>
          </div>
        ) : (
          <>
            <div className="vault__view-head">
              <span className={STATUS_CLASS[selected.status]}>{selected.status}</span>
              <div>
                <h2 className="vault__view-title">{selected.skill_name}</h2>
                <span className="vault__view-cat">{new Date(selected.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="result">
              <h3 className="result__headline">{selected.output?.headline}</h3>
              <dl className="result__fields">
                {(selected.output?.fields || []).map((f) => (
                  <div className="result__row" key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="result__actions">
              {ACTIONS.map((a) => (
                <button key={a.key} className="btn btn--primary btn--sm" disabled={busy} onClick={() => act(a.key)}>
                  {a.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
