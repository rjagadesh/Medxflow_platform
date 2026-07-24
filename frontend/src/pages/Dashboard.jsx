/**
 * Dashboard — a per-tenant CUSTOMIZABLE dashboard. Renders the metric tiles this
 * tenant configured (saved on the backend), plus the standard account cards.
 *
 * Tiles can be added/removed here directly, OR — the headline feature — through
 * the page-scoped developer chat ("show me revenue" adds a Revenue tile). When
 * the dashboard chat changes the layout it fires an "eirim:dashboard-updated"
 * event, which this page listens for to refresh live.
 */
import { useEffect, useState } from "react";

import api from "../api/client.js";
import TenantLicenses from "../components/TenantLicenses.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatValue(value, unit) {
  if (unit === "$") return `$${Number(value).toLocaleString()}`;
  if (unit === "%") return `${value}%`;
  return Number(value).toLocaleString();
}

const TILE_TONE = {
  green: "tile--green", emerald: "tile--emerald", amber: "tile--amber",
  rose: "tile--rose", violet: "tile--violet", blue: "tile--blue",
};
const TONE_HEX = {
  green: "#1a5dad", emerald: "#17c3b2", amber: "#e0a020",
  rose: "#c0392b", violet: "#7c5cd6", blue: "#3b82f6",
};

// Lightweight inline bar chart (no external dependency) for trend tiles.
function MiniChart({ series, color }) {
  const data = series || [];
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 460, H = 120, pad = 6;
  const bw = data.length ? (W - pad * 2) / data.length : 0;
  const hex = TONE_HEX[color] || "#1a5dad";
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} className="tile__chart" preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = Math.round((d.value / max) * H);
        const x = pad + i * bw;
        return (
          <g key={i}>
            <rect x={x + bw * 0.15} y={H - h} width={bw * 0.7} height={h} rx="3" fill={hex} opacity="0.85" />
            <text x={x + bw / 2} y={H + 15} textAnchor="middle" fontSize="10" fill="#8aa0b8">{d.day}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  usePageHeader(`${greeting()}, ${user.display_name}`, "Your workspace — customise it in the developer chat.");

  const [dash, setDash] = useState(null);
  const [picking, setPicking] = useState(false);

  function loadDashboard() {
    api.get("/dashboard/").then(({ data }) => setDash(data)).catch(() => setDash({ tiles: [], available: [] }));
  }

  useEffect(() => {
    loadDashboard();
    // The dashboard developer chat fires this after it edits the layout.
    const onUpdate = () => loadDashboard();
    window.addEventListener("eirim:dashboard-updated", onUpdate);
    return () => window.removeEventListener("eirim:dashboard-updated", onUpdate);
  }, []);

  async function addTile(metric) {
    setPicking(false);
    const { data } = await api.post("/dashboard/tiles/", { metric });
    setDash(data);
  }
  async function removeTile(id) {
    const { data } = await api.delete(`/dashboard/tiles/${id}/`);
    setDash(data);
  }

  const usedMetrics = new Set((dash?.tiles || []).map((t) => t.metric));
  const addable = (dash?.available || []).filter((m) => !usedMetrics.has(m.key));

  return (
    <>
      {/* Customizable metric tiles */}
      <section className="dash-tiles">
        {(dash?.tiles || []).map((t) => (
          <article key={t.id}
            className={`tile ${TILE_TONE[t.color] || "tile--green"} ${t.type === "chart" ? "tile--chart" : ""}`}>
            {!dash.read_only && (
              <button className="tile__x" title="Remove tile" onClick={() => removeTile(t.id)}>✕</button>
            )}
            <span className="tile__label">{t.title}{t.type === "chart" ? " · last 7 days" : ""}</span>
            {t.type === "chart" ? (
              <MiniChart series={t.series} color={t.color} />
            ) : (
              <span className="tile__value">{formatValue(t.value, t.unit)}</span>
            )}
          </article>
        ))}

        {/* Add-a-metric control (also achievable via the developer chat) */}
        {dash && !dash.read_only && (
          <div className="tile tile--add">
            {picking ? (
              <select
                className="tile__select" autoFocus defaultValue=""
                onChange={(e) => e.target.value && addTile(e.target.value)}
                onBlur={() => setPicking(false)}
              >
                <option value="" disabled>Choose a metric…</option>
                {addable.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            ) : (
              <button className="tile__addbtn" onClick={() => setPicking(true)} disabled={addable.length === 0}>
                <span className="tile__plus">＋</span>
                Add metric
              </button>
            )}
          </div>
        )}
      </section>

      {dash?.read_only && (
        <p className="muted dash-note">The platform dashboard is read-only. Sign in as a tenant to customise yours.</p>
      )}
      {dash && !dash.read_only && (
        <p className="muted dash-note">
          💬 Tip: turn on <strong>Developer</strong> mode and describe any metric — the AI designs the tile for you.
          Try <em>"revenue from paid claims"</em>, <em>"trend of denials per day"</em>, or
          <em> "what share of runs succeeded, in blue"</em>. Changes save to your organisation.
        </p>
      )}

      {!isSuperAdmin && <TenantLicenses />}
    </>
  );
}
