/**
 * Settings — a tabbed screen:
 *   • Profile  — avatar + display name
 *   • Security — MFA (TOTP)
 *   • Team     — create/manage tenant sub-users (admins only)
 *   • Roles    — per-feature permission matrix (admins only)
 */
import { useRef, useState } from "react";

import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";
import MFASettings from "../components/MFASettings.jsx";
import RolesSettings from "../components/settings/RolesSettings.jsx";
import TeamSettings from "../components/settings/TeamSettings.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user.role === "TENANT_ADMIN" || user.role === "SUPER_ADMIN";
  usePageHeader("Settings", "Manage your profile, security, team and roles.");

  const TABS = [
    { key: "profile", label: "Profile" },
    { key: "security", label: "Security" },
    ...(isAdmin
      ? [
          { key: "team", label: "Team" },
          { key: "roles", label: "Roles" },
        ]
      : []),
  ];

  const [tab, setTab] = useState("profile");

  return (
    <>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="settings">
        {tab === "profile" && <ProfileTab />}
        {tab === "security" && <MFASettings />}
        {tab === "team" && isAdmin && <TeamSettings />}
        {tab === "roles" && isAdmin && <RolesSettings />}
      </div>
    </>
  );
}

/* ---------------------------------------------------- Profile tab --- */
function ProfileTab() {
  const { user, refresh } = useAuth();
  const fileRef = useRef(null);

  const [fullName, setFullName] = useState(user.full_name || "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await api.patch("/me/", { full_name: fullName });
      await refresh();
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus(null);
    try {
      const data = new FormData();
      data.append("avatar", file);
      await api.patch("/me/", data, { headers: { "Content-Type": "multipart/form-data" } });
      await refresh();
    } catch {
      setStatus("error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="settings__card" onSubmit={handleSave}>
      <h2 className="section-title" style={{ marginTop: 0 }}>Profile</h2>

      {status === "saved" && <div className="alert alert--success">Your profile has been updated.</div>}
      {status === "error" && <div className="alert alert--error">Something went wrong. Try again.</div>}

      <div className="settings__avatar-row">
        <Avatar user={user} size={80} />
        <div>
          <button type="button" className="btn btn--ghost"
            onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading…" : "Change photo"}
          </button>
          <p className="muted settings__hint">PNG or JPG, up to a few MB.</p>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
        </div>
      </div>

      <label className="field">
        <span className="field__label">Full name</span>
        <input className="field__input" value={fullName}
          onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
      </label>

      <label className="field">
        <span className="field__label">Email</span>
        <input className="field__input" value={user.email} disabled />
      </label>

      <div className="settings__row">
        <label className="field">
          <span className="field__label">Role</span>
          <input className="field__input" value={user.role.replace("_", " ")} disabled />
        </label>
        <label className="field">
          <span className="field__label">Organisation</span>
          <input className="field__input" value={user.tenant_name || "Platform (all tenants)"} disabled />
        </label>
      </div>

      <button className="btn btn--primary" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
