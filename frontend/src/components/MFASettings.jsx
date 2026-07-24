/**
 * Multi-factor authentication panel for the Settings page.
 *
 * Enrol:  POST /mfa/setup  -> shows a QR code + secret, user scans then enters a
 *         code -> POST /mfa/verify enables it.
 * Disable: user enters a current code -> POST /mfa/disable.
 */
import { useState } from "react";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MFASettings() {
  const { user, refresh } = useAuth();
  const [setup, setSetup] = useState(null); // { qr_code, secret }
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function beginSetup() {
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/mfa/setup/");
      setSetup(data);
    } catch {
      setError("Could not start MFA setup.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/mfa/verify/", { otp: otp.trim() });
      await refresh();
      setSetup(null);
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/mfa/disable/", { otp: otp.trim() });
      await refresh();
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="settings__card">
      <div className="mfa__head">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Two-factor authentication
        </h2>
        <span className={`pill ${user.mfa_enabled ? "pill--active" : "pill--expired"}`}>
          {user.mfa_enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {/* --- Enabled: allow disabling --- */}
      {user.mfa_enabled && (
        <form onSubmit={disable}>
          <p className="muted">
            Your account is protected with an authenticator app. Enter a current
            code to turn it off.
          </p>
          <div className="mfa__verify">
            <input
              className="field__input"
              inputMode="numeric"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button className="btn btn--danger-ghost" disabled={busy}>
              Disable MFA
            </button>
          </div>
        </form>
      )}

      {/* --- Disabled, not yet in setup --- */}
      {!user.mfa_enabled && !setup && (
        <>
          <p className="muted">
            Add a second layer of security. You'll enter a code from an
            authenticator app (Google Authenticator, Authy, 1Password…) each time
            you sign in.
          </p>
          <button className="btn btn--primary" onClick={beginSetup} disabled={busy}>
            {busy ? "Preparing…" : "Enable two-factor auth"}
          </button>
        </>
      )}

      {/* --- Setup in progress: show QR + confirm --- */}
      {!user.mfa_enabled && setup && (
        <div className="mfa__setup">
          <ol className="mfa__steps">
            <li>Scan this QR code with your authenticator app.</li>
            <li>Enter the 6-digit code it shows to confirm.</li>
          </ol>
          <div className="mfa__qr-row">
            <img src={setup.qr_code} alt="MFA QR code" className="mfa__qr" />
            <div>
              <span className="card__label">Can't scan? Enter this key</span>
              <code className="mfa__secret">{setup.secret}</code>
            </div>
          </div>
          <form className="mfa__verify" onSubmit={confirmSetup}>
            <input
              className="field__input"
              inputMode="numeric"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoFocus
            />
            <button className="btn btn--primary" disabled={busy}>
              Confirm & enable
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
