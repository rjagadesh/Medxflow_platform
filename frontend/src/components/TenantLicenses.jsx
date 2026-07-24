/**
 * Read-only list of the current tenant's licenses, shown on the Home page for
 * tenant admins and members. Allocation is not possible here — only a super
 * admin can allocate, on the License management page.
 */
import { useEffect, useState } from "react";

import api from "../api/client.js";

const STATUS_CLASS = {
  ACTIVE: "pill pill--active",
  SUSPENDED: "pill pill--suspended",
  EXPIRED: "pill pill--expired",
};

export default function TenantLicenses() {
  const [licenses, setLicenses] = useState(null);

  useEffect(() => {
    api
      .get("/licenses/")
      .then(({ data }) => setLicenses(data))
      .catch(() => setLicenses([]));
  }, []);

  if (licenses === null) return null;

  return (
    <section className="tenant-list">
      <h2 className="tenant-list__title">Your licenses</h2>
      {licenses.length === 0 ? (
        <p className="muted">No licenses have been allocated to your organisation yet.</p>
      ) : (
        <ul className="tenant-list__items">
          {licenses.map((l) => (
            <li key={l.id} className="tenant-list__item">
              <span className="tenant-list__name">
                {l.plan_name}
                <span className="tenant-list__seats"> · {l.seats} seats</span>
              </span>
              <span className={STATUS_CLASS[l.effective_status]}>
                {l.effective_status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
