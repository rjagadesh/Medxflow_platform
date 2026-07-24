/**
 * Verify Coverage — the Availity-style eligibility form: enter payer / member /
 * provider / service types, run the (simulated) 270/271 coverage check, and see
 * the benefit table + AI Verification of Benefits below.
 */
import { useEffect, useState } from "react";

import api from "../../api/client.js";
import EligibilityResult from "./EligibilityResult.jsx";

const BLANK = {
  payer: "", payer_id: "", member_id: "", first_name: "", last_name: "",
  dob: "", npi: "", cpt: "", service_types: ["30", "98"],
};

export default function EligibilityVerify() {
  const [form, setForm] = useState(BLANK);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [payers, setPayers] = useState([]);
  const [running, setRunning] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/eligibility/service-types/").then(({ data }) => setServiceTypes(data)).catch(() => {});
    api.get("/eligibility/payers/").then(({ data }) => setPayers(data)).catch(() => {});
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function pickPayer(name) {
    const p = payers.find((x) => x.name === name);
    setForm((f) => ({ ...f, payer: name, payer_id: p ? p.payerId : f.payer_id }));
  }

  function toggleService(code) {
    setForm((f) => ({
      ...f,
      service_types: f.service_types.includes(code)
        ? f.service_types.filter((c) => c !== code)
        : [...f.service_types, code],
    }));
  }

  async function run(e) {
    e.preventDefault();
    setError(""); setRunning(true);
    try {
      const { data } = await api.post("/eligibility/checks/", form);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not run the eligibility check.");
    } finally { setRunning(false); }
  }

  async function reparse() {
    if (!result) return;
    setReparsing(true);
    try {
      const { data } = await api.post(`/eligibility/checks/${result.id}/reparse/`);
      setResult(data);
    } finally { setReparsing(false); }
  }

  return (
    <div className="elig-page">
      <form className="elig-form" onSubmit={run}>
        {error && <div className="alert alert--error" style={{ gridColumn: "1 / -1" }}>{error}</div>}

        <F label="Payer" list="elig-payers" v={form.payer} on={(x) => pickPayer(x)} ph="Aetna" />
        <datalist id="elig-payers">{payers.map((p) => <option key={p.payerId} value={p.name} />)}</datalist>
        <F label="Payer ID" v={form.payer_id} on={(x) => set("payer_id", x)} ph="60054" mono />
        <F label="Member ID" v={form.member_id} on={(x) => set("member_id", x)} ph="ABC123456789" mono req />
        <F label="Provider NPI" v={form.npi} on={(x) => set("npi", x)} ph="1234567890" mono />
        <F label="First name" v={form.first_name} on={(x) => set("first_name", x)} ph="Jane" />
        <F label="Last name" v={form.last_name} on={(x) => set("last_name", x)} ph="Doe" />
        <F label="Date of birth" v={form.dob} on={(x) => set("dob", x)} ph="MM/DD/YYYY" mono />
        <F label="CPT / HCPCS (optional)" v={form.cpt} on={(x) => set("cpt", x)} ph="99213" mono />

        <div className="elig-services">
          <span className="field__label">Service types</span>
          <div className="elig-chips">
            {serviceTypes.map((s) => (
              <button type="button" key={s.code}
                className={`elig-chip ${form.service_types.includes(s.code) ? "selected" : ""}`}
                onClick={() => toggleService(s.code)} title={s.label}>
                {s.code} · {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="elig-form__actions">
          <button className="btn btn--primary" type="submit" disabled={running || !form.member_id}>
            {running ? "Checking coverage…" : "Check eligibility"}
          </button>
        </div>
      </form>

      {result && <EligibilityResult check={result} onReparse={reparse} reparsing={reparsing} />}
    </div>
  );
}

function F({ label, v, on, ph, mono, req, list }) {
  return (
    <label className="field">
      <span className="field__label">{label}{req && " *"}</span>
      <input className={`field__input ${mono ? "mono" : ""}`} value={v} list={list}
        onChange={(e) => on(e.target.value)} placeholder={ph} />
    </label>
  );
}
