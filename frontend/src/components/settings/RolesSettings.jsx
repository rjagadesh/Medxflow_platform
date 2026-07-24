/**
 * Roles settings — the permission matrix. Pick a role, then toggle View / Edit /
 * Delete per feature (Eligibility, Decision Engine, …). Saving PUTs the whole
 * matrix. Tenant admins and super admins can edit; others see it read-only.
 */
import { Fragment, useEffect, useMemo, useState } from "react";

import api from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

const PERMS = [
  { key: "can_view", label: "View" },
  { key: "can_edit", label: "Edit" },
  { key: "can_delete", label: "Delete" },
];

export default function RolesSettings() {
  const { user } = useAuth();
  const canEdit = user.role === "TENANT_ADMIN" || user.role === "SUPER_ADMIN";

  const [catalog, setCatalog] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [status, setStatus] = useState(null); // saved | error
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/rbac/catalog/"), api.get("/rbac/permissions/")])
      .then(([c, p]) => {
        setCatalog(c.data);
        setMatrix(p.data.matrix);
        setActiveRole(c.data.roles[0]?.value || null);
      })
      .catch(() => setStatus("error"));
  }, []);

  // Group features for display (Overview / Workflows / Platform).
  const grouped = useMemo(() => {
    if (!catalog) return {};
    return catalog.features.reduce((acc, f) => {
      (acc[f.group] = acc[f.group] || []).push(f);
      return acc;
    }, {});
  }, [catalog]);

  function toggle(feature, permKey) {
    if (!canEdit) return;
    setMatrix((m) => ({
      ...m,
      [activeRole]: {
        ...m[activeRole],
        [feature]: {
          ...m[activeRole][feature],
          [permKey]: !m[activeRole][feature][permKey],
        },
      },
    }));
    setStatus(null);
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const { data } = await api.put("/rbac/permissions/", { matrix });
      setMatrix(data.matrix);
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (!catalog || !matrix) return <p className="muted">Loading roles…</p>;

  return (
    <div className="settings__card">
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Role permissions
      </h2>
      <p className="muted" style={{ marginTop: "-0.5rem" }}>
        Choose what each role can do on every screen. Super Admin always has full
        access.
      </p>

      {status === "saved" && <div className="alert alert--success">Permissions saved.</div>}
      {status === "error" && <div className="alert alert--error">Could not save. Try again.</div>}

      {/* Role selector */}
      <div className="role-tabs">
        {catalog.roles.map((r) => (
          <button
            key={r.value}
            className={`role-tab ${activeRole === r.value ? "is-active" : ""}`}
            onClick={() => setActiveRole(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Matrix */}
      <div className="table-wrap">
        <table className="table perm-table">
          <thead>
            <tr>
              <th>Feature</th>
              {PERMS.map((p) => (
                <th key={p.key} className="perm-col">{p.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([group, features]) => (
              <Fragment key={group}>
                <tr className="perm-group">
                  <td colSpan={4}>{group}</td>
                </tr>
                {features.map((f) => {
                  const perms = matrix[activeRole]?.[f.slug] || {};
                  return (
                    <tr key={f.slug}>
                      <td>{f.name}</td>
                      {PERMS.map((p) => (
                        <td key={p.key} className="perm-col">
                          <input
                            type="checkbox"
                            className="perm-check"
                            checked={!!perms[p.key]}
                            disabled={!canEdit}
                            onChange={() => toggle(f.slug, p.key)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <button className="btn btn--primary" style={{ marginTop: "1.25rem" }} onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save permissions"}
        </button>
      )}
    </div>
  );
}
