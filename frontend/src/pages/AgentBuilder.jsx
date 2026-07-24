/**
 * Guided voice-agent builder — an easy, step-by-step wizard used for both
 * creating (/voice-ai/new) and editing (/voice-ai/:id) an agent.
 *
 * Steps tell a simple story:
 *   1. Identity   — who is this agent?
 *   2. Voice      — how does it sound and greet people?
 *   3. Brain      — how does it think and behave? (prompt, model, creativity)
 *   4. Review     — check everything and launch.
 *
 * Option lists (voices, languages, models) come from /voice-agents/options/ so
 * the backend stays the single source of truth.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/client.js";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const STEPS = [
  { key: "identity", title: "Identity", blurb: "Who is your agent?" },
  { key: "voice", title: "Voice", blurb: "How does it sound?" },
  { key: "brain", title: "Brain", blurb: "How does it behave?" },
  { key: "review", title: "Review", blurb: "Launch it." },
];

const EMPTY = {
  name: "",
  description: "",
  persona: "",
  status: "DRAFT",
  voice: "ARIA",
  language: "en-US",
  greeting: "",
  system_prompt: "",
  model: "claude-sonnet-5",
  temperature: 0.7,
};

export default function AgentBuilder() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  usePageHeader(isEdit ? "Edit agent" : "Create a voice agent", STEPS[step].blurb);

  // Load option catalogue (+ the agent itself when editing).
  useEffect(() => {
    api.get("/voice-agents/options/").then(({ data }) => setOptions(data));
    if (isEdit) {
      api
        .get(`/voice-agents/${id}/`)
        .then(({ data }) => {
          setForm({ ...EMPTY, ...data });
          setLoading(false);
        })
        .catch(() => {
          setError("Could not load this agent.");
          setLoading(false);
        });
    }
  }, [id, isEdit]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const canProceed = useMemo(() => {
    if (step === 0) return form.name.trim().length > 0;
    return true;
  }, [step, form.name]);

  async function save() {
    setSaving(true);
    setError("");
    const payload = { ...form, temperature: Number(form.temperature) };
    try {
      if (isEdit) {
        await api.patch(`/voice-agents/${id}/`, payload);
      } else {
        await api.post("/voice-agents/", payload);
      }
      navigate("/voice-ai");
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Could not save the agent."
      );
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this agent? This cannot be undone.")) return;
    await api.delete(`/voice-agents/${id}/`);
    navigate("/voice-ai");
  }

  if (loading || !options) {
    return <p className="muted">Loading builder…</p>;
  }

  return (
    <>
      <div className="page-actions">
        <button className="btn btn--ghost" onClick={() => navigate("/voice-ai")}>
          ← Back to studio
        </button>
      </div>

      {/* Stepper */}
      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            className={`stepper__item ${i === step ? "is-active" : ""} ${
              i < step ? "is-done" : ""
            }`}
            onClick={() => i < step && setStep(i)}
          >
            <span className="stepper__dot">{i < step ? "✓" : i + 1}</span>
            <span className="stepper__label">{s.title}</span>
          </li>
        ))}
      </ol>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="builder">
        {step === 0 && <IdentityStep form={form} set={set} options={options} />}
        {step === 1 && <VoiceStep form={form} set={set} options={options} />}
        {step === 2 && <BrainStep form={form} set={set} options={options} />}
        {step === 3 && <ReviewStep form={form} options={options} />}
      </div>

      {/* Nav controls */}
      <div className="builder__nav">
        <div>
          {isEdit && (
            <button className="btn btn--danger-ghost" onClick={remove}>
              Delete agent
            </button>
          )}
        </div>
        <div className="builder__nav-right">
          {step > 0 && (
            <button className="btn btn--ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              className="btn btn--primary"
              disabled={!canProceed}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </button>
          ) : (
            <button className="btn btn--primary" disabled={saving} onClick={save}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Launch agent"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Steps --- */

function IdentityStep({ form, set, options }) {
  return (
    <div className="builder__card">
      <label className="field">
        <span className="field__label">Agent name *</span>
        <input
          className="field__input"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Reception Riley"
          autoFocus
        />
      </label>

      <label className="field">
        <span className="field__label">Personality</span>
        <input
          className="field__input"
          value={form.persona}
          onChange={(e) => set("persona", e.target.value)}
          placeholder="e.g. Friendly front-desk receptionist"
        />
        <span className="field__hint">A short description of its character.</span>
      </label>

      <label className="field">
        <span className="field__label">What does it do?</span>
        <textarea
          className="field__input field__textarea"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="e.g. Greets callers and routes them to the right team."
          rows={3}
        />
      </label>

      <label className="field">
        <span className="field__label">Status</span>
        <select
          className="field__input"
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
        >
          {options.statuses.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function VoiceStep({ form, set, options }) {
  return (
    <div className="builder__card">
      <span className="field__label">Pick a voice</span>
      <div className="voice-picker">
        {options.voices.map((o) => (
          <button
            type="button"
            key={o.value}
            className={`voice-option ${form.voice === o.value ? "is-selected" : ""}`}
            onClick={() => set("voice", o.value)}
          >
            <span className="voice-option__name">{o.label.split(" —")[0]}</span>
            <span className="voice-option__desc">{o.label.split("— ")[1]}</span>
          </button>
        ))}
      </div>

      <label className="field" style={{ marginTop: "1.5rem" }}>
        <span className="field__label">Language</span>
        <select
          className="field__input"
          value={form.language}
          onChange={(e) => set("language", e.target.value)}
        >
          {options.languages.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Greeting</span>
        <textarea
          className="field__input field__textarea"
          value={form.greeting}
          onChange={(e) => set("greeting", e.target.value)}
          placeholder="The first thing your agent says, e.g. “Hi! How can I help today?”"
          rows={2}
        />
      </label>
    </div>
  );
}

function BrainStep({ form, set, options }) {
  return (
    <div className="builder__card">
      <label className="field">
        <span className="field__label">System prompt</span>
        <textarea
          className="field__input field__textarea"
          value={form.system_prompt}
          onChange={(e) => set("system_prompt", e.target.value)}
          placeholder="Tell the agent who it is and how to behave. e.g. “You are Riley, a warm receptionist. Keep answers short and friendly, and route callers to the right team.”"
          rows={6}
        />
        <span className="field__hint">
          This is the agent's brain — the clearer you are, the better it behaves.
        </span>
      </label>

      <span className="field__label">Model</span>
      <div className="model-picker">
        {options.models.map((o) => (
          <button
            type="button"
            key={o.value}
            className={`model-option ${form.model === o.value ? "is-selected" : ""}`}
            onClick={() => set("model", o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <label className="field" style={{ marginTop: "1.5rem" }}>
        <span className="field__label">
          Creativity — {Number(form.temperature).toFixed(1)}
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={form.temperature}
          onChange={(e) => set("temperature", e.target.value)}
          className="slider"
        />
        <div className="slider__labels">
          <span>Focused</span>
          <span>Creative</span>
        </div>
      </label>
    </div>
  );
}

function ReviewStep({ form, options }) {
  const label = (list, value) =>
    list.find((o) => o.value === value)?.label || value;

  const rows = [
    ["Name", form.name],
    ["Personality", form.persona || "—"],
    ["Description", form.description || "—"],
    ["Status", label(options.statuses, form.status)],
    ["Voice", label(options.voices, form.voice)],
    ["Language", label(options.languages, form.language)],
    ["Greeting", form.greeting || "—"],
    ["Model", label(options.models, form.model)],
    ["Creativity", Number(form.temperature).toFixed(1)],
  ];

  return (
    <div className="builder__card">
      <p className="muted">Here's your agent. Launch it, or go back to tweak.</p>
      <dl className="review">
        {rows.map(([k, v]) => (
          <div className="review__row" key={k}>
            <dt className="review__key">{k}</dt>
            <dd className="review__val">{v}</dd>
          </div>
        ))}
        {form.system_prompt && (
          <div className="review__row review__row--block">
            <dt className="review__key">System prompt</dt>
            <dd className="review__val review__prompt">{form.system_prompt}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
