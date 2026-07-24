import { useMemo, useState } from "react";
import { Search, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { useStore } from "../lib/store";
import { Card, Tag, ConfidenceBadge } from "../components/ui/primitives";
import { CONFIDENCE_THRESHOLD, PRIORITY_COLOR } from "../lib/constants";

export default function ManualReview() {
  const { referrals, updateReferral, moveStatus } = useStore();
  const queue = useMemo(() => referrals.filter((r) => r.needsReview), [referrals]);
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<number | null>(queue[0]?.id ?? null);

  const filtered = queue.filter((r) =>
    `${r.id} ${r.patientName} ${r.specialty}`.toLowerCase().includes(q.toLowerCase()));
  const selected = referrals.find((r) => r.id === selId) ?? filtered[0];
  const [fields, setFields] = useState(() => selected?.fields ?? []);

  function selectRow(id: number) {
    setSelId(id);
    setFields(referrals.find((r) => r.id === id)?.fields ?? []);
  }
  function setField(key: string, value: string) {
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, value } : f)));
  }
  function approve() {
    if (!selected) return;
    updateReferral(selected.id, { fields }, "Corrected in manual review.");
    moveStatus(selected.id, "Extracted", "Approved from manual review.");
    const next = queue.find((r) => r.id !== selected.id);
    if (next) selectRow(next.id);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr_360px]">
      {/* Queue */}
      <Card className="flex flex-col p-0">
        <div className="border-b border-slate-200 p-3 dark:border-slate-800">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input className="input pl-8" placeholder="Search queue…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 220px)" }}>
          {filtered.map((r) => (
            <button key={r.id} onClick={() => selectRow(r.id)}
              className={`mb-1.5 w-full rounded-lg border p-2.5 text-left ${selected?.id === r.id ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10" : "border-slate-200 dark:border-slate-700"}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">#{r.id}</span>
                <span className={`text-xs font-medium ${PRIORITY_COLOR[r.priority]}`}>{r.priority}</span>
              </div>
              <div className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">{r.specialty}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <Tag>{r.docType}</Tag>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400"><AlertCircle size={11} /> Needs review</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString()}</div>
            </button>
          ))}
          {filtered.length === 0 && <p className="p-4 text-center text-sm text-slate-400">Queue is clear 🎉</p>}
        </div>
      </Card>

      {/* Document viewer */}
      <Card className="flex flex-col">
        <div className="section-title mb-3">Document — {selected?.documents[0]?.name ?? "—"}</div>
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50" style={{ minHeight: 420 }}>
          <FileText size={56} className="text-slate-300" />
          <p className="mt-3 font-medium text-slate-500">{selected ? `Referral #${selected.id} · ${selected.patientName}` : "Select an item"}</p>
          <p className="text-xs text-slate-400">Embedded PDF / document viewer</p>
        </div>
      </Card>

      {/* Correction form */}
      <Card className="flex flex-col">
        <div className="section-title mb-3">Extracted fields (correct then approve)</div>
        <div className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
          {fields.map((f) => (
            <div key={f.key} className={`rounded-lg border p-2 ${f.confidence < CONFIDENCE_THRESHOLD ? "border-rose-300 bg-rose-50/40 dark:border-rose-500/40 dark:bg-rose-500/5" : "border-slate-200 dark:border-slate-700"}`}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{f.label}</span>
                <ConfidenceBadge value={f.confidence} />
              </div>
              <input className="w-full bg-transparent text-sm text-slate-800 outline-none dark:text-slate-100" value={f.value} onChange={(e) => setField(f.key, e.target.value)} />
            </div>
          ))}
        </div>
        <button className="btn-primary mt-3 w-full" onClick={approve} disabled={!selected}>
          <RefreshCw size={15} /> Correct (save &amp; re-run)
        </button>
      </Card>
    </div>
  );
}
