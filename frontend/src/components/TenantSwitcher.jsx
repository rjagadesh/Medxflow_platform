/**
 * Organization / Tenant Switcher (#12) — a dropdown by the profile badge that
 * lets a user switch their active tenant. Only rendered when the user belongs
 * to more than one organisation.
 */
import { useEffect, useRef, useState } from "react";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function TenantSwitcher() {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const tenants = user?.tenants || [];
  if (tenants.length < 2) return null; // only show when multi-org

  async function switchTo(tenantId) {
    if (tenantId === user.tenant) { setOpen(false); return; }
    setSwitching(true);
    try {
      const { data } = await api.post("/switch-tenant/", { tenant_id: tenantId });
      setUser(data);
      setOpen(false);
      // Reload so every page re-fetches data for the new tenant context.
      window.location.reload();
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="orgswitch" ref={ref}>
      <button className="orgswitch__btn" onClick={() => setOpen((v) => !v)} disabled={switching}>
        <span className="orgswitch__name">{user.tenant_name}</span>
        <span className="orgswitch__chev">▾</span>
      </button>
      {open && (
        <div className="orgswitch__menu">
          <div className="orgswitch__head">Switch organisation</div>
          {tenants.map((t) => (
            <button key={t.id} className={`orgswitch__item ${t.id === user.tenant ? "is-active" : ""}`}
              onClick={() => switchTo(t.id)}>
              {t.name}
              {t.id === user.tenant && <span className="orgswitch__check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
