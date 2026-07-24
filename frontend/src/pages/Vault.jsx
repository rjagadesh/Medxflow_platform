/**
 * Secret Vault — a 1Password-style password manager. Left: searchable item
 * list grouped by favourite; right: the selected item's details with masked
 * secret (reveal + copy) and a built-in password generator when adding/editing.
 * Secrets are encrypted at rest and only fetched on an explicit reveal.
 */
import { useEffect, useMemo, useState } from "react";

import api from "../api/client.js";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const CATEGORIES = [
  { value: "LOGIN", label: "Login", icon: "🌐" },
  { value: "PASSWORD", label: "Password", icon: "🔑" },
  { value: "API_KEY", label: "API Key", icon: "🔌" },
  { value: "SECURE_NOTE", label: "Secure Note", icon: "📝" },
  { value: "CARD", label: "Credit Card", icon: "💳" },
  { value: "DATABASE", label: "Database", icon: "🗄️" },
];
const catMeta = (v) => CATEGORIES.find((c) => c.value === v) || CATEGORIES[0];

const BLANK = {
  title: "", category: "LOGIN", username: "", url: "", notes: "", secret: "", favorite: false,
};

export default function Vault() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("view"); // view | new | edit
  const [draft, setDraft] = useState(BLANK);
  const [revealed, setRevealed] = useState(null); // decrypted secret of selected
  const [copied, setCopied] = useState("");
  usePageHeader("Secret Vault", "Your team's passwords and secrets — encrypted end to end.");

  function load(selectId) {
    api.get("/vault/items/").then(({ data }) => {
      setItems(data);
      if (selectId !== undefined) setSelectedId(selectId);
    });
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );
  const selected = items.find((i) => i.id === selectedId) || null;

  // Reset reveal when selection changes.
  useEffect(() => { setRevealed(null); }, [selectedId]);

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1200);
    } catch { /* clipboard unavailable */ }
  }

  async function reveal() {
    if (revealed !== null) { setRevealed(null); return; }
    const { data } = await api.get(`/vault/items/${selectedId}/reveal/`);
    setRevealed(data.secret);
  }

  async function copySecret() {
    let value = revealed;
    if (value === null) {
      const { data } = await api.get(`/vault/items/${selectedId}/reveal/`);
      value = data.secret;
    }
    copy(value, "secret");
  }

  function startNew() {
    setDraft(BLANK);
    setMode("new");
  }
  function startEdit() {
    setDraft({ ...BLANK, ...selected, secret: "" });
    setMode("edit");
  }
  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  async function generate() {
    const { data } = await api.get("/vault/generate/?length=20");
    set("secret", data.password);
  }

  async function save(event) {
    event.preventDefault();
    const payload = { ...draft };
    if (mode === "edit" && !payload.secret) delete payload.secret; // keep existing
    if (mode === "new") {
      const { data } = await api.post("/vault/items/", payload);
      setMode("view");
      load(data.id);
    } else {
      const { data } = await api.patch(`/vault/items/${selected.id}/`, payload);
      setMode("view");
      load(data.id);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this item permanently?")) return;
    await api.delete(`/vault/items/${selected.id}/`);
    setSelectedId(null);
    setMode("view");
    load();
  }

  return (
    <>
      <div className="page-actions">
        <button className="btn btn--primary" onClick={startNew}>+ New item</button>
      </div>

      <div className="vault">
        {/* Master list */}
        <div className="vault__list">
          <div className="vault__search">
            <input className="field__input" placeholder="Search vault…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <ul className="vault__items">
            {filtered.map((i) => {
              const m = catMeta(i.category);
              return (
                <li key={i.id}>
                  <button
                    className={`vault__item ${selectedId === i.id && mode !== "new" ? "is-selected" : ""}`}
                    onClick={() => { setSelectedId(i.id); setMode("view"); }}
                  >
                    <span className="vault__icon">{m.icon}</span>
                    <span className="vault__item-body">
                      <span className="vault__item-title">
                        {i.favorite && <span className="vault__star">★</span>}
                        {i.title}
                      </span>
                      <span className="vault__item-sub">{i.username || m.label}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="muted vault__empty">No items.</li>}
          </ul>
        </div>

        {/* Detail / editor */}
        <div className="vault__detail">
          {mode === "new" || mode === "edit" ? (
            <VaultForm
              draft={draft} set={set} mode={mode}
              onGenerate={generate} onSave={save} onCancel={() => setMode("view")}
            />
          ) : selected ? (
            <div className="vault__view">
              <div className="vault__view-head">
                <span className="vault__view-icon">{catMeta(selected.category).icon}</span>
                <div>
                  <h2 className="vault__view-title">{selected.title}</h2>
                  <span className="vault__view-cat">{selected.category_label}</span>
                </div>
                <div className="vault__view-actions">
                  <button className="btn btn--ghost btn--sm" onClick={startEdit}>Edit</button>
                  <button className="btn btn--danger-ghost btn--sm" onClick={remove}>Delete</button>
                </div>
              </div>

              {selected.username && (
                <Field label="Username" value={selected.username}
                  onCopy={() => copy(selected.username, "user")} copied={copied === "user"} />
              )}

              {selected.has_secret && (
                <div className="vault__field">
                  <span className="vault__field-label">Secret</span>
                  <div className="vault__field-row">
                    <span className="vault__secret">
                      {revealed !== null ? revealed : "••••••••••••"}
                    </span>
                    <div className="vault__field-btns">
                      <button className="vault__mini" onClick={reveal}>
                        {revealed !== null ? "Hide" : "Reveal"}
                      </button>
                      <button className="vault__mini" onClick={copySecret}>
                        {copied === "secret" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selected.url && (
                <div className="vault__field">
                  <span className="vault__field-label">Website</span>
                  <div className="vault__field-row">
                    <a className="vault__link" href={selected.url} target="_blank" rel="noreferrer">{selected.url}</a>
                    <div className="vault__field-btns">
                      <button className="vault__mini" onClick={() => copy(selected.url, "url")}>
                        {copied === "url" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selected.notes && (
                <div className="vault__field">
                  <span className="vault__field-label">Notes</span>
                  <p className="vault__notes">{selected.notes}</p>
                </div>
              )}

              <p className="vault__updated">Updated {new Date(selected.updated_at).toLocaleString()}</p>
            </div>
          ) : (
            <div className="vault__placeholder">
              <span className="vault__placeholder-icon">🔒</span>
              <p className="muted">Select an item to view its details, or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------- sub-components --- */
function Field({ label, value, onCopy, copied }) {
  return (
    <div className="vault__field">
      <span className="vault__field-label">{label}</span>
      <div className="vault__field-row">
        <span className="vault__field-value">{value}</span>
        <div className="vault__field-btns">
          <button className="vault__mini" onClick={onCopy}>{copied ? "Copied!" : "Copy"}</button>
        </div>
      </div>
    </div>
  );
}

function VaultForm({ draft, set, mode, onGenerate, onSave, onCancel }) {
  return (
    <form className="vault__form" onSubmit={onSave}>
      <h2 className="vault__view-title">{mode === "new" ? "New item" : "Edit item"}</h2>

      <label className="field">
        <span className="field__label">Title *</span>
        <input className="field__input" value={draft.title}
          onChange={(e) => set("title", e.target.value)} placeholder="e.g. Payer Portal Login" required autoFocus />
      </label>

      <div className="settings__row">
        <label className="field">
          <span className="field__label">Category</span>
          <select className="field__input" value={draft.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Username</span>
          <input className="field__input" value={draft.username}
            onChange={(e) => set("username", e.target.value)} placeholder="user@company.com" />
        </label>
      </div>

      <label className="field">
        <span className="field__label">
          Secret {mode === "edit" && <span className="muted">(leave blank to keep current)</span>}
        </span>
        <div className="vault__secret-input">
          <input className="field__input" value={draft.secret}
            onChange={(e) => set("secret", e.target.value)} placeholder="Password, API key, note…" />
          <button type="button" className="btn btn--ghost btn--sm" onClick={onGenerate}>Generate</button>
        </div>
      </label>

      <label className="field">
        <span className="field__label">Website</span>
        <input className="field__input" value={draft.url}
          onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
      </label>

      <label className="field">
        <span className="field__label">Notes</span>
        <textarea className="field__input field__textarea" rows={3} value={draft.notes}
          onChange={(e) => set("notes", e.target.value)} placeholder="Anything else to remember" />
      </label>

      <label className="vault__fav">
        <input type="checkbox" checked={draft.favorite} onChange={(e) => set("favorite", e.target.checked)} />
        <span>Mark as favourite</span>
      </label>

      <div className="vault__form-actions">
        <button className="btn btn--primary">{mode === "new" ? "Create item" : "Save changes"}</button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
