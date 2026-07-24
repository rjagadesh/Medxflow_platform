/**
 * Notifications Center (#10) — a bell in the top bar. Fetches computed alerts
 * (review queue, pending prior auths, disconnected connectors) and shows them in
 * a dropdown; each links to the relevant page.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/client.js";
import { BellIcon } from "./icons.jsx";

const LEVEL_DOT = { info: "#4a90d9", warning: "#e0a020", critical: "var(--danger)" };

export default function NotificationsBell() {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/notifications/").then(({ data }) => setAlerts(data.alerts)).catch(() => setAlerts([]));
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(link) {
    setOpen(false);
    if (link) navigate(link);
  }

  return (
    <div className="notif" ref={ref}>
      <button className="notif__btn" onClick={() => setOpen((v) => !v)} aria-label="Notifications">
        <BellIcon width={20} height={20} />
        {alerts.length > 0 && <span className="notif__badge">{alerts.length}</span>}
      </button>

      {open && (
        <div className="notif__menu">
          <div className="notif__head">Notifications</div>
          {alerts.length === 0 ? (
            <div className="notif__empty muted">You're all caught up 🎉</div>
          ) : (
            alerts.map((a, i) => (
              <button key={i} className="notif__item" onClick={() => go(a.link)}>
                <span className="notif__dot" style={{ background: LEVEL_DOT[a.level] || "var(--muted)" }} />
                <span>
                  <span className="notif__title">{a.title}</span>
                  <span className="notif__detail">{a.detail}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
