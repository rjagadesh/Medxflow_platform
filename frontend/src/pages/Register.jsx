/**
 * Sign-up screen. Creates a new organisation and makes the registrant its
 * tenant admin, then signs them straight in. Shares the branded split layout
 * with the login page.
 */
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import logo from "../assets/logo.webp";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    organization_name: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    if (form.password !== form.password_confirm) {
      setErrors({ password_confirm: "Passwords do not match." });
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      const data = err.response?.data || {};
      // DRF returns { field: ["message"] }; flatten to first message per field.
      const flat = {};
      Object.entries(data).forEach(([k, v]) => {
        flat[k] = Array.isArray(v) ? v[0] : String(v);
      });
      setErrors(
        Object.keys(flat).length ? flat : { detail: "Could not create account." }
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <aside className="login__brand">
        <img src={logo} alt="MedXFlow" className="login__brand-logo" />
        <p className="login__tagline">
          Create your organisation in seconds. You'll be its first administrator.
        </p>
      </aside>

      <main className="login__panel">
        <form className="login__form" onSubmit={handleSubmit}>
          <h1 className="login__title">Create your account</h1>
          <p className="login__subtitle">Start your MedXFlow workspace</p>

          {errors.detail && <div className="alert alert--error">{errors.detail}</div>}

          <label className="field">
            <span className="field__label">Full name</span>
            <input
              className="field__input"
              value={form.full_name}
              onChange={update("full_name")}
              placeholder="Jane Doe"
              required
            />
            {errors.full_name && <span className="field__error">{errors.full_name}</span>}
          </label>

          <label className="field">
            <span className="field__label">Organisation name</span>
            <input
              className="field__input"
              value={form.organization_name}
              onChange={update("organization_name")}
              placeholder="Acme Inc."
              required
            />
            {errors.organization_name && (
              <span className="field__error">{errors.organization_name}</span>
            )}
          </label>

          <label className="field">
            <span className="field__label">Work email</span>
            <input
              type="email"
              className="field__input"
              value={form.email}
              onChange={update("email")}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
            {errors.email && <span className="field__error">{errors.email}</span>}
          </label>

          <div className="settings__row">
            <label className="field">
              <span className="field__label">Password</span>
              <input
                type="password"
                className="field__input"
                value={form.password}
                onChange={update("password")}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />
              {errors.password && <span className="field__error">{errors.password}</span>}
            </label>

            <label className="field">
              <span className="field__label">Confirm password</span>
              <input
                type="password"
                className="field__input"
                value={form.password_confirm}
                onChange={update("password_confirm")}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
              {errors.password_confirm && (
                <span className="field__error">{errors.password_confirm}</span>
              )}
            </label>
          </div>

          <button className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="login__alt">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
