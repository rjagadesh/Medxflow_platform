/**
 * Login screen. Branded split layout. Supports a two-step flow when the account
 * has MFA enabled: after email + password, an authentication-code field appears.
 * Also links to the sign-up page for new organisations.
 */
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import logo from "../assets/logo.webp";
import { useAuth } from "../context/AuthContext.jsx";

// TESTING PHASE ONLY — quick logins for the seeded demo accounts.
// Remove this block before going to production.
const DEMO_ACCOUNTS = [
  { label: "Super Admin", email: "admin@eirim.io", password: "Admin@12345" },
  { label: "Tenant Admin", email: "admin@acme.eirim.io", password: "Tenant@12345" },
  { label: "Member", email: "user@acme.eirim.io", password: "Member@12345" },
];

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [mfaStep, setMfaStep] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // One-click sign-in for a demo account (skips the MFA path — demo users
  // have no MFA — and falls back to filling the form if login fails).
  async function quickLogin(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
    setSubmitting(true);
    try {
      await login(account.email, account.password);
      navigate("/", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.mfa_required
          ? "This account has MFA enabled — enter your code below."
          : data?.detail || "Could not sign in with this demo account."
      );
      if (data?.mfa_required) setMfaStep(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password, otp.trim() || undefined);
      navigate("/", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.mfa_required) {
        // Password was correct; ask for the second factor.
        setMfaStep(true);
        setError(otp ? "Invalid authentication code. Try again." : "");
      } else {
        setError(
          data?.detail || "Invalid email or password. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <aside className="login__brand">
        <img src={logo} alt="MedXFlow" className="login__brand-logo" />
        <p className="login__tagline">
          One platform for every team. Secure, multi-tenant, and built for scale.
        </p>
      </aside>

      <main className="login__panel">
        <form className="login__form" onSubmit={handleSubmit}>
          <h1 className="login__title">Welcome back</h1>
          <p className="login__subtitle">Sign in to your MedXFlow workspace</p>

          {error && <div className="alert alert--error">{error}</div>}

          {!mfaStep ? (
            <>
              <label className="field">
                <span className="field__label">Email</span>
                <input
                  type="email"
                  className="field__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">Password</span>
                <input
                  type="password"
                  className="field__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </label>
            </>
          ) : (
            <label className="field">
              <span className="field__label">Authentication code</span>
              <input
                type="text"
                inputMode="numeric"
                className="field__input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                autoFocus
                required
              />
              <span className="field__hint">
                Enter the code from your authenticator app.
              </span>
            </label>
          )}

          <button className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? "Signing in…" : mfaStep ? "Verify & sign in" : "Sign in"}
          </button>

          {!mfaStep && (
            <>
              <div className="demo">
                <span className="demo__label">Testing — quick login as</span>
                <div className="demo__buttons">
                  {DEMO_ACCOUNTS.map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      className="demo__btn"
                      onClick={() => quickLogin(a)}
                      disabled={submitting}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="login__alt">
                Don't have an account? <Link to="/register">Create one</Link>
              </p>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
