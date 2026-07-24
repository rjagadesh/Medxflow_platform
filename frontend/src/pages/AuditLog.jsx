/**
 * Audit Log (#9) — chronological, filterable log of every user action (skill
 * runs, vault access, settings/role/user changes, auth). Read-only.
 */
import { useEffect, useState } from "react";

import api from "../api/client.js";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const CATEGORIES = [
  { value: "", label: "All activity" },
  { value: "RUN", label: "Skill Runs" },
  { value: "VAULT", label: "Secret Vault" },
  { value: "SETTINGS", label: "Settings" },
  { value: "ROLES", label: "Roles" },
  { value: "USERS", label: "Users" },
  { value: "AUTH", label: "Authentication" },
];
const CAT_CLASS = {
  RUN: "pill pill--active", VAULT: "pill pill--suspended", SETTINGS: "pill",
  ROLES: "pill pill--suspended", USERS: "pill", AUTH: "pill pill--expired",
};

export default function AuditLog() {
  const [events, setEvents] = useState(null);
  const [category, setCategory] = useState("");
  usePageHeader("Audit Log", "A chronological record of every action in your organisation.");

  useEffect(() => {
    const q = category ? `?category=${category}` : "";
    api.get(`/audit/${q}`).then(({ data }) => setEvents(data));
  }, [category]);

  return (
    <>
      <div className="page-actions">
        <select className="field__input" style={{ width: "auto" }}
          value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>When</th><th>Category</th><th>Action</th><th>Detail</th><th>User</th></tr>
          </thead>
          <tbody>
            {(events || []).map((e) => (
              <tr key={e.id}>
                <td style={{ whiteSpace: "nowrap" }}>{new Date(e.created_at).toLocaleString()}</td>
                <td><span className={CAT_CLASS[e.category] || "pill"}>{e.category_label}</span></td>
                <td>{e.action}</td>
                <td className="muted">{e.description || "—"}</td>
                <td className="muted">{e.user_email || "—"}</td>
              </tr>
            ))}
            {events && events.length === 0 && (
              <tr><td colSpan="5" className="muted">No activity recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
