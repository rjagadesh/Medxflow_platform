/**
 * IVR Config Library — saved payer phone-tree mappings. Each config is a step
 * table: a heard trigger phrase → an action (press DTMF or say a phrase), whose
 * value can be bound to a per-call field (NPI / Member ID / …).
 */
import { useEffect, useState } from "react";

import api from "../../api/client.js";

const VALUE_SOURCES = ["Custom", "NPI", "Member ID", "Group Number", "DOB", "Patient Name", "Tax ID", "CPT Codes", "Callback Number", "Fax Number"];
const BLANK = { name: "", payer_label: "", summary: "", steps: [] };
const BLANK_STEP = { trigger: "", action_type: "dtmf", value: "", value_source: "Custom" };

export default function VobIvrConfigs() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(BLANK);
  const [editing, setEditing] = useState(null);

  function load() { api.get("/vob/ivr-configs/").then(({ data }) => setItems(data)); }
  useEffect(load, []);

  function startNew() { setDraft({ ...BLANK, steps: [{ ...BLANK_STEP }] }); setEditing("new"); }
  function startEdit(it) { setDraft({ ...it, steps: it.steps || [] }); setEditing(it.id); }

  function setStep(i, k, v) {
    setDraft((d) => {
      const steps = d.steps.map((s, j) => (j === i ? { ...s, [k]: v } : s));
      return { ...d, steps };
    });
  }
  function addStep() { setDraft((d) => ({ ...d, steps: [...d.steps, { ...BLANK_STEP }] })); }
  function removeStep(i) { setDraft((d) => ({ ...d, steps: d.steps.filter((_, j) => j !== i) })); }

  async function save(e) {
    e.preventDefault();
    if (editing === "new") await api.post("/vob/ivr-configs/", draft);
    else await api.patch(`/vob/ivr-configs/${editing}/`, draft);
    setEditing(null);
    load();
  }
  async function remove(id) {
    if (!window.confirm("Delete this IVR config?")) return;
    await api.delete(`/vob/ivr-configs/${id}/`);
    setEditing(null);
    load();
  }

  return (
    <>
      <div className="page-actions"><button className="btn btn--primary" onClick={startNew}>+ New IVR config</button></div>

      {editing !== null ? (
        <form className="builder__card" style={{ maxWidth: "none" }} onSubmit={save}>
          <h2 className="section-title" style={{ marginTop: 0 }}>{editing === "new" ? "New IVR config" : draft.name}</h2>
          <div className="settings__row">
            <label className="field">
              <span className="field__label">Config name *</span>
              <input className="field__input" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} required />
            </label>
            <label className="field">
              <span className="field__label">Payer / label</span>
              <input className="field__input" value={draft.payer_label} onChange={(e) => setDraft((d) => ({ ...d, payer_label: e.target.value }))} placeholder="e.g. Aetna" />
            </label>
          </div>

          <span className="field__label">Step table (statement heard → action taken)</span>
          <div className="table-wrap" style={{ marginBottom: "0.75rem" }}>
            <table className="table ivr-steps">
              <thead>
                <tr><th>Trigger phrase (heard)</th><th>Action</th><th>Value</th><th>Bind to</th><th></th></tr>
              </thead>
              <tbody>
                {draft.steps.map((s, i) => (
                  <tr key={i}>
                    <td><input className="field__input" value={s.trigger} onChange={(e) => setStep(i, "trigger", e.target.value)} placeholder="e.g. press 2 for eligibility" /></td>
                    <td>
                      <select className="field__input" value={s.action_type} onChange={(e) => setStep(i, "action_type", e.target.value)}>
                        <option value="dtmf">Press (DTMF)</option>
                        <option value="say">Say</option>
                      </select>
                    </td>
                    <td><input className="field__input" value={s.value} onChange={(e) => setStep(i, "value", e.target.value)} placeholder="2 or {{npi}}" /></td>
                    <td>
                      <select className="field__input" value={s.value_source}
                        onChange={(e) => {
                          const src = e.target.value;
                          setStep(i, "value_source", src);
                          if (src !== "Custom") setStep(i, "value", `{{${src.toLowerCase().replace(/ /g, "_")}}}`);
                        }}>
                        {VALUE_SOURCES.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td><button type="button" className="fm__x fm__x--static" onClick={() => removeStep(i)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={addStep}>+ Add Row</button>

          <label className="field" style={{ marginTop: "1rem" }}>
            <span className="field__label">Notes / summary (for your reference only)</span>
            <textarea className="field__input field__textarea" rows={3} value={draft.summary}
              onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))} />
          </label>

          <div className="vault__form-actions">
            <button className="btn btn--primary">Save Config</button>
            {editing !== "new" && <button type="button" className="btn btn--danger-ghost" onClick={() => remove(editing)}>Delete</button>}
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="agent-grid">
          {items.map((c) => (
            <button key={c.id} className="agent-card" style={{ textAlign: "left" }} onClick={() => startEdit(c)}>
              <div className="agent-card__top">
                <span className="agent-card__avatar">🛠</span>
                <span className="pill pill--suspended">{c.step_count} steps</span>
              </div>
              <h3 className="agent-card__name">{c.name}</h3>
              <p className="agent-card__persona">{c.payer_label || "IVR mapping"}</p>
            </button>
          ))}
          {items.length === 0 && <p className="muted">No IVR configs yet. Create one to map a payer's phone tree.</p>}
        </div>
      )}
    </>
  );
}
