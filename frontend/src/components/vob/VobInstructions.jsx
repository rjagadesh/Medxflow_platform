/**
 * Agent Instruction Library — named instruction sets the VOB agent can use.
 * List on the left, editor on the right.
 */
import { useEffect, useState } from "react";

import api from "../../api/client.js";

const BLANK = { name: "", voice: "rachel", instructions: "" };

export default function VobInstructions() {
  const [items, setItems] = useState([]);
  const [voices, setVoices] = useState([]);
  const [draft, setDraft] = useState(BLANK);
  const [editing, setEditing] = useState(null); // id or "new" or null

  function load() { api.get("/vob/instructions/").then(({ data }) => setItems(data)); }
  useEffect(() => {
    load();
    api.get("/vob/options/").then(({ data }) => setVoices(data.voices));
  }, []);

  function startNew() { setDraft(BLANK); setEditing("new"); }
  function startEdit(it) { setDraft({ ...it }); setEditing(it.id); }

  async function save(e) {
    e.preventDefault();
    if (editing === "new") await api.post("/vob/instructions/", draft);
    else await api.patch(`/vob/instructions/${editing}/`, draft);
    setEditing(null);
    load();
  }
  async function remove(id) {
    if (!window.confirm("Delete this instruction set?")) return;
    await api.delete(`/vob/instructions/${id}/`);
    setEditing(null);
    load();
  }

  return (
    <div className="vault">
      <div className="vault__list">
        <div className="vault__search">
          <button className="btn btn--primary btn--block" onClick={startNew}>+ New instruction set</button>
        </div>
        <ul className="vault__items">
          {items.map((it) => (
            <li key={it.id}>
              <button className={`vault__item ${editing === it.id ? "is-selected" : ""}`} onClick={() => startEdit(it)}>
                <span className="vault__icon">📋</span>
                <span className="vault__item-body">
                  <span className="vault__item-title">{it.name}</span>
                  <span className="vault__item-sub">Voice: {it.voice}</span>
                </span>
              </button>
            </li>
          ))}
          {items.length === 0 && <li className="vault__empty muted">No instruction sets yet.</li>}
        </ul>
      </div>

      <div className="vault__detail">
        {editing === null ? (
          <div className="vault__placeholder">
            <span className="vault__placeholder-icon">📋</span>
            <p className="muted">Select an instruction set to edit, or create a new one.</p>
          </div>
        ) : (
          <form className="vault__form" onSubmit={save}>
            <h2 className="vault__view-title">{editing === "new" ? "New instruction set" : draft.name}</h2>
            <label className="field">
              <span className="field__label">Name *</span>
              <input className="field__input" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} required />
            </label>
            <label className="field">
              <span className="field__label">Agent voice</span>
              <select className="field__input" value={draft.voice} onChange={(e) => setDraft((d) => ({ ...d, voice: e.target.value }))}>
                {voices.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Instructions</span>
              <textarea className="field__input field__textarea" rows={10} value={draft.instructions}
                onChange={(e) => setDraft((d) => ({ ...d, instructions: e.target.value }))}
                placeholder="How should the agent behave with reps and IVR menus?" />
            </label>
            <div className="vault__form-actions">
              <button className="btn btn--primary">Save</button>
              {editing !== "new" && <button type="button" className="btn btn--danger-ghost" onClick={() => remove(editing)}>Delete</button>}
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
