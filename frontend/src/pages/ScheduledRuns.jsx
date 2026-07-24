/**
 * Scheduled Runs (#7) — view and manage recurring skill jobs. Create one by
 * picking a skill + cadence; toggle active/paused; delete. (New schedules are
 * usually created from a skill page via the "Schedule" button.)
 */
import { useEffect, useState } from "react";

import api from "../api/client.js";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

export default function ScheduledRuns() {
  const [jobs, setJobs] = useState(null);
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({ skill_slug: "", cadence: "DAILY" });
  usePageHeader("Scheduled Runs", "Recurring jobs that run your workflows automatically.");

  function load() {
    api.get("/scheduled-runs/").then(({ data }) => setJobs(data));
  }
  useEffect(() => {
    load();
    api.get("/skills/").then(({ data }) => setSkills(data));
  }, []);

  async function create(e) {
    e.preventDefault();
    if (!form.skill_slug) return;
    await api.post("/scheduled-runs/", { ...form, input: {} });
    setForm({ skill_slug: "", cadence: "DAILY" });
    load();
  }
  async function toggle(job) {
    await api.patch(`/scheduled-runs/${job.id}/`, { active: !job.active });
    load();
  }
  async function remove(id) {
    if (!window.confirm("Delete this scheduled job?")) return;
    await api.delete(`/scheduled-runs/${id}/`);
    load();
  }

  if (!jobs) return <p className="muted">Loading…</p>;

  return (
    <>
      <form className="page-actions schedule-form" onSubmit={create}>
        <select className="field__input" value={form.skill_slug}
          onChange={(e) => setForm((f) => ({ ...f, skill_slug: e.target.value }))}>
          <option value="">Choose a workflow…</option>
          {skills.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
        <select className="field__input" value={form.cadence}
          onChange={(e) => setForm((f) => ({ ...f, cadence: e.target.value }))}>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
        </select>
        <button className="btn btn--primary">+ Schedule</button>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Workflow</th><th>Cadence</th><th>Next run</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>{j.skill_name}</td>
                <td>{j.cadence_label}</td>
                <td>{j.next_run || "—"}</td>
                <td>
                  <button className={`pill ${j.active ? "pill--active" : "pill--expired"}`}
                    style={{ border: "none", cursor: "pointer" }} onClick={() => toggle(j)}>
                    {j.active ? "Active" : "Paused"}
                  </button>
                </td>
                <td><button className="btn btn--danger-ghost btn--sm" onClick={() => remove(j.id)}>Delete</button></td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan="5" className="muted">No scheduled jobs yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
