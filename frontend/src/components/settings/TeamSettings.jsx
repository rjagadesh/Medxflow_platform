/**
 * Team settings — list the tenant's users and create new sub-users. Visible to
 * tenant admins and super admins. New users are scoped to the current tenant
 * automatically (backend sets the tenant for a tenant admin).
 */
import { useEffect, useState } from "react";

import api from "../../api/client.js";

const EMPTY = { full_name: "", email: "", password: "", role: "MEMBER" };

const ROLE_LABELS = { TENANT_ADMIN: "Tenant Admin", MEMBER: "Member" };

export default function TeamSettings() {
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api.get("/users/").then(({ data }) => setUsers(data)).catch(() => setUsers([]));
  }
  useEffect(load, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function create(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/users/", form);
      setForm(EMPTY);
      load();
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Could not create user."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings__stack">
      <form className="settings__card" onSubmit={create}>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Add a team member
        </h2>
        {error && <div className="alert alert--error">{error}</div>}

        <div className="settings__row">
          <label className="field">
            <span className="field__label">Full name</span>
            <input className="field__input" value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)} placeholder="Jane Doe" required />
          </label>
          <label className="field">
            <span className="field__label">Email</span>
            <input type="email" className="field__input" value={form.email}
              onChange={(e) => set("email", e.target.value)} placeholder="jane@company.com" required />
          </label>
        </div>

        <div className="settings__row">
          <label className="field">
            <span className="field__label">Temporary password</span>
            <input type="text" className="field__input" value={form.password}
              onChange={(e) => set("password", e.target.value)} placeholder="At least 8 characters" required />
          </label>
          <label className="field">
            <span className="field__label">Role</span>
            <select className="field__input" value={form.role} onChange={(e) => set("role", e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="TENANT_ADMIN">Tenant Admin</option>
            </select>
          </label>
        </div>

        <button className="btn btn--primary" disabled={saving}>
          {saving ? "Creating…" : "Create user"}
        </button>
      </form>

      <div className="settings__card">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Team members {users ? `(${users.length})` : ""}
        </h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
            </thead>
            <tbody>
              {(users || []).map((u) => (
                <tr key={u.id}>
                  <td>{u.display_name}</td>
                  <td>{u.email}</td>
                  <td>{ROLE_LABELS[u.role] || u.role}</td>
                  <td>
                    <span className={`pill ${u.is_active ? "pill--active" : "pill--expired"}`}>
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                </tr>
              ))}
              {users && users.length === 0 && (
                <tr><td colSpan="4" className="muted">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
