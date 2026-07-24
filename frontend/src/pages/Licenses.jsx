/**
 * License management — SUPER ADMIN ONLY (route-guarded in App.jsx).
 *
 * Shows the three license tiers, an allocation form (assign a tier + seats to
 * any tenant), and a table of every license across all tenants. Because a
 * tenant can hold many licenses, allocating simply adds another row.
 */
import { useEffect, useState } from "react";

import api from "../api/client.js";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const STATUS_CLASS = {
  ACTIVE: "pill pill--active",
  SUSPENDED: "pill pill--suspended",
  EXPIRED: "pill pill--expired",
};

export default function Licenses() {
  const [plans, setPlans] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Allocation form state
  const [form, setForm] = useState({ tenant: "", plan: "", seats: "", expires_on: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  usePageHeader("License management", "Allocate license tiers to tenants. Only you, as super admin, can do this.");

  async function loadAll() {
    const [p, t, l] = await Promise.all([
      api.get("/license-plans/"),
      api.get("/tenants/"),
      api.get("/licenses/"),
    ]);
    setPlans(p.data);
    setTenants(t.data);
    setLicenses(l.data);
    setLoading(false);
  }

  useEffect(() => {
    loadAll().catch(() => setLoading(false));
  }, []);

  // Default the seat count to the chosen plan's included seats.
  function onPlanChange(planId) {
    const plan = plans.find((x) => String(x.id) === String(planId));
    setForm((f) => ({ ...f, plan: planId, seats: plan ? plan.default_seats : f.seats }));
  }

  async function handleAllocate(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        tenant: Number(form.tenant),
        plan: Number(form.plan),
        seats: Number(form.seats),
      };
      if (form.expires_on) payload.expires_on = form.expires_on;
      await api.post("/licenses/", payload);
      setForm({ tenant: "", plan: "", seats: "", expires_on: "" });
      await loadAll();
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Could not allocate license."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function revoke(id) {
    if (!window.confirm("Revoke this license? This cannot be undone.")) return;
    await api.delete(`/licenses/${id}/`);
    await loadAll();
  }

  if (loading) {
    return <div className="page-center muted">Loading licenses…</div>;
  }

  return (
    <>
        {/* --- Tier catalogue --- */}
        <section className="tiers">
          {plans.map((plan) => (
            <article key={plan.id} className={`tier tier--${plan.tier.toLowerCase()}`}>
              <h3 className="tier__name">{plan.name}</h3>
              <p className="tier__price">
                {Number(plan.price_monthly) === 0 ? "Free" : `$${plan.price_monthly}`}
                <span className="tier__per">/mo</span>
              </p>
              <ul className="tier__features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        {/* --- Allocation form --- */}
        <section className="allocate">
          <h2 className="section-title">Allocate a license</h2>
          {error && <div className="alert alert--error">{error}</div>}
          <form className="allocate__form" onSubmit={handleAllocate}>
            <label className="field">
              <span className="field__label">Tenant</span>
              <select
                className="field__input"
                value={form.tenant}
                onChange={(e) => setForm((f) => ({ ...f, tenant: e.target.value }))}
                required
              >
                <option value="">Select tenant…</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Tier</span>
              <select
                className="field__input"
                value={form.plan}
                onChange={(e) => onPlanChange(e.target.value)}
                required
              >
                <option value="">Select tier…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Seats</span>
              <input
                type="number"
                min="1"
                className="field__input"
                value={form.seats}
                onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
                required
              />
            </label>

            <label className="field">
              <span className="field__label">Expires on (optional)</span>
              <input
                type="date"
                className="field__input"
                value={form.expires_on}
                onChange={(e) => setForm((f) => ({ ...f, expires_on: e.target.value }))}
              />
            </label>

            <button className="btn btn--primary" disabled={submitting}>
              {submitting ? "Allocating…" : "Allocate license"}
            </button>
          </form>
        </section>

        {/* --- All licenses --- */}
        <section className="allocate">
          <h2 className="section-title">Allocated licenses ({licenses.length})</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Tier</th>
                  <th>Seats</th>
                  <th>Status</th>
                  <th>Starts</th>
                  <th>Expires</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((l) => (
                  <tr key={l.id}>
                    <td>{l.tenant_name}</td>
                    <td>{l.plan_name}</td>
                    <td>{l.seats}</td>
                    <td>
                      <span className={STATUS_CLASS[l.effective_status]}>
                        {l.effective_status}
                      </span>
                    </td>
                    <td>{l.starts_on}</td>
                    <td>{l.expires_on || "—"}</td>
                    <td>
                      <button className="btn btn--danger-ghost" onClick={() => revoke(l.id)}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
                {licenses.length === 0 && (
                  <tr>
                    <td colSpan="7" className="muted">
                      No licenses allocated yet.
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
