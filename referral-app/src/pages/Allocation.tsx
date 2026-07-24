import { useState } from "react";
import { Shuffle, Gauge, Sparkles, Pencil, Power } from "lucide-react";
import { useStore } from "../lib/store";
import { Card, Bar } from "../components/ui/primitives";
import type { User } from "../types";

const STRATEGIES = [
  { key: "round", name: "Round Robin", icon: Shuffle, desc: "Distribute evenly in rotation." },
  { key: "least", name: "Least Loaded", icon: Gauge, desc: "Send to whoever has the fewest open." },
  { key: "skill", name: "Skill Based", icon: Sparkles, desc: "Match on specialty skill tags." },
];

export default function Allocation() {
  const { users, addUser, updateUser } = useStore();
  const [strategy, setStrategy] = useState("least");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Coordinator", capacity: 20, skills: "" });

  function create() {
    if (!form.name || !form.email) return;
    addUser({
      name: form.name, email: form.email, role: form.role as User["role"],
      capacity: Number(form.capacity), skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean), active: true,
    });
    setForm({ name: "", email: "", password: "", role: "Coordinator", capacity: 20, skills: "" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="section-title mb-3">Assignment Strategy</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STRATEGIES.map((s) => (
            <button key={s.key} onClick={() => setStrategy(s.key)}
              className={`rounded-xl border p-4 text-left transition ${strategy === s.key ? "border-brand-500 bg-brand-50 ring-1 ring-brand-400 dark:bg-brand-500/10" : "border-slate-200 hover:border-slate-300 dark:border-slate-700"}`}>
              <s.icon size={20} className="text-brand-600" />
              <div className="mt-2 font-semibold text-slate-700 dark:text-slate-200">{s.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{s.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="section-title mb-4">Live Workload</div>
          <div className="space-y-3">
            {users.filter((u) => u.active).map((u) => {
              const pct = Math.round((u.openCount / u.capacity) * 100);
              return (
                <div key={u.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-300">{u.name}</span>
                    <span className="text-slate-400">{u.openCount}/{u.capacity} · {pct}%</span>
                  </div>
                  <Bar pct={pct} color={pct > 80 ? "#ef4444" : pct > 55 ? "#f59e0b" : "#3b82f6"} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="section-title mb-4">Add User</div>
          <div className="grid grid-cols-2 gap-2">
            <input className="input col-span-2" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Admin</option><option>Coordinator</option><option>Reviewer</option>
            </select>
            <input className="input" type="number" placeholder="Daily capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            <input className="input col-span-2" placeholder="Skills (comma-separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          </div>
          <button className="btn-primary mt-3 w-full" onClick={create}>Create user</button>
        </Card>
      </div>

      <Card className="p-0">
        <div className="section-title p-4">Users</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 text-left">Name / email</th><th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Capacity</th><th className="px-4 py-2 text-left">Skills</th>
                <th className="px-4 py-2 text-left">Active</th><th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-2.5"><div className="font-medium text-slate-700 dark:text-slate-200">{u.name}</div><div className="text-xs text-slate-400">{u.email}</div></td>
                  <td className="px-4 py-2.5 text-slate-500">{u.role}</td>
                  <td className="px-4 py-2.5 text-slate-500">{u.capacity}/day</td>
                  <td className="px-4 py-2.5"><div className="flex flex-wrap gap-1">{u.skills.map((s) => <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500 dark:bg-slate-700/50 dark:text-slate-300">{s}</span>)}</div></td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => updateUser(u.id, { active: !u.active })}
                      className={`relative h-5 w-9 rounded-full transition ${u.active ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${u.active ? "left-4" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      <button className="btn-ghost btn-sm"><Pencil size={13} /> Edit</button>
                      <button className="btn-ghost btn-sm text-rose-600" onClick={() => updateUser(u.id, { active: false })}><Power size={13} /> Deactivate</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
