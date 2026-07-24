import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, RotateCcw } from "lucide-react";
import { useStore } from "../lib/store";
import { Card, StatusPill } from "../components/ui/primitives";
import { STATUSES, PRIORITY_COLOR } from "../lib/constants";
import type { Referral } from "../types";

type SortKey = keyof Pick<Referral, "id" | "patientName" | "status" | "specialty" | "priority" | "source" | "assignee" | "slaDue" | "createdAt">;

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const SOURCES = ["Fax", "Email", "Portal", "Phone", "EHR"];

export default function Referrals() {
  const { referrals, users } = useStore();
  const navigate = useNavigate();

  const [f, setF] = useState({ status: "", priority: "", payer: "", source: "", assignee: "", specialty: "" });
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "createdAt", dir: -1 });

  const payers = useMemo(() => [...new Set(referrals.map((r) => r.payer))].sort(), [referrals]);

  const rows = useMemo(() => {
    let list = referrals.filter((r) =>
      (!f.status || r.status === f.status) &&
      (!f.priority || r.priority === f.priority) &&
      (!f.payer || r.payer === f.payer) &&
      (!f.source || r.source === f.source) &&
      (!f.assignee || r.assignee === f.assignee) &&
      (!f.specialty || r.specialty.toLowerCase().includes(f.specialty.toLowerCase()))
    );
    list = [...list].sort((a, b) => {
      const av = a[sort.key] ?? "", bv = b[sort.key] ?? "";
      return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
    });
    return list;
  }, [referrals, f, sort]);

  function th(label: string, key: SortKey) {
    return (
      <th onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }))}
        className="cursor-pointer select-none px-3 py-2 text-left font-medium">
        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown size={12} className="opacity-40" /></span>
      </th>
    );
  }
  const sel = "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800";

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-2">
          <select className={sel} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={sel} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
            <option value="">All priorities</option>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={sel} value={f.payer} onChange={(e) => setF({ ...f, payer: e.target.value })}>
            <option value="">All payers</option>{payers.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={sel} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>
            <option value="">All sources</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={sel} value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })}>
            <option value="">All assignees</option>{users.map((u) => <option key={u.id}>{u.name}</option>)}
          </select>
          <input className={sel} placeholder="Specialty…" value={f.specialty}
            onChange={(e) => setF({ ...f, specialty: e.target.value })} />
          <button className="btn-ghost btn-sm" onClick={() => setF({ status: "", priority: "", payer: "", source: "", assignee: "", specialty: "" })}>
            <RotateCcw size={14} /> Reset filters
          </button>
          <span className="ml-auto text-sm text-slate-400">{rows.length} results</span>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                {th("ID", "id")}{th("Patient", "patientName")}{th("Status", "status")}{th("Specialty", "specialty")}
                {th("Priority", "priority")}{th("Source", "source")}{th("Assignee", "assignee")}{th("SLA Due", "slaDue")}{th("Created", "createdAt")}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/referrals/${r.id}`)}
                  className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-400">#{r.id}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{r.patientName}</td>
                  <td className="px-3 py-2.5"><StatusPill status={r.status} /></td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{r.specialty}</td>
                  <td className={`px-3 py-2.5 font-medium ${PRIORITY_COLOR[r.priority]}`}>{r.priority}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.source}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.assignee ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 text-slate-500">{new Date(r.slaDue).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="px-3 py-10 text-center text-slate-400">No referrals match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
