import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Sparkles, FileText, Download, RefreshCw, UserCheck, ExternalLink, Bell, CheckCircle2,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Card, StatusPill, Tag, ConfidenceBadge } from "../components/ui/primitives";
import { CONFIDENCE_THRESHOLD } from "../lib/constants";
import type { PriorAuth } from "../types";

export default function ReferralDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { referrals, users, updateReferral } = useStore();
  const referral = referrals.find((r) => r.id === Number(id));

  const [fields, setFields] = useState(() => referral?.fields ?? []);
  const [pa, setPa] = useState<PriorAuth>(() => referral?.priorAuth ?? { status: "Not required" });
  const [preview, setPreview] = useState(referral?.documents[0]?.id ?? "");

  if (!referral) return <div className="text-slate-400">Referral not found. <Link to="/referrals" className="text-brand-600">Back to list</Link></div>;

  const overdue = new Date(referral.slaDue) < new Date("2026-07-20T12:00:00Z") && referral.status !== "Completed";
  const lowConf = fields.filter((f) => f.confidence < CONFIDENCE_THRESHOLD);

  function setField(key: string, value: string) {
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, value } : f)));
  }
  function saveRerun() {
    updateReferral(referral!.id, { fields }, "Extracted fields saved & rules re-run.");
    alert("Saved & rules re-run.");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/board" className="text-slate-400 hover:text-brand-600"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Referral #{referral.id}</h1>
        <span className="text-sm text-slate-400">{referral.source} · {new Date(referral.createdAt).toLocaleDateString()}</span>
        <Link to="/referrals" className="ml-auto text-sm text-brand-600 hover:underline">← Back to list</Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={referral.status} />
        <Tag>{referral.docType}</Tag>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${overdue ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"}`}>
          SLA {overdue ? "overdue" : "on track"} · due {new Date(referral.slaDue).toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* LEFT — extracted fields, rules, documents */}
        <div className="space-y-5 xl:col-span-2">
          {lowConf.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <Sparkles size={18} className="mt-0.5 shrink-0" />
              <div>
                <b>Auto-enrichment suggestion —</b> {lowConf.length} field(s) below the confidence threshold were
                enriched from the payer database. Please confirm the highlighted values.
              </div>
            </div>
          )}

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="section-title">Extracted Fields</div>
              <button className="btn-primary btn-sm" onClick={saveRerun}><RefreshCw size={14} /> Save & re-run rules</button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((f) => {
                const tone = f.confidence < CONFIDENCE_THRESHOLD
                  ? "border-rose-300 bg-rose-50/50 dark:border-rose-500/40 dark:bg-rose-500/5"
                  : f.confidence >= 0.9 ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-500/40 dark:bg-emerald-500/5"
                  : "border-slate-200 dark:border-slate-700";
                return (
                  <label key={f.key} className={`rounded-lg border p-2.5 ${tone}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{f.label}</span>
                      <ConfidenceBadge value={f.confidence} />
                    </div>
                    <input className="w-full bg-transparent text-sm text-slate-800 outline-none dark:text-slate-100"
                      value={f.value} onChange={(e) => setField(f.key, e.target.value)} />
                  </label>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="section-title mb-3">Rule Results</div>
            <ul className="space-y-2 text-sm">
              <RuleRow ok label="Required fields present" detail="patient, DOB, specialty, provider" />
              <RuleRow ok={referral.eligibility.status === "Verified"} label="Eligibility check" detail={referral.eligibility.status} />
              <RuleRow ok={lowConf.length === 0} label="Confidence threshold" detail={`${lowConf.length} field(s) below ${CONFIDENCE_THRESHOLD * 100}%`} />
              <RuleRow ok={referral.icd10.length > 0} label="Diagnosis coding" detail={referral.icd10.join(", ") || "missing"} />
            </ul>
          </Card>

          <Card>
            <div className="section-title mb-3">Documents</div>
            <div className="flex flex-wrap gap-2">
              {referral.documents.map((d) => (
                <button key={d.id} onClick={() => setPreview(d.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${preview === d.id ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10" : "border-slate-200 dark:border-slate-700"}`}>
                  <FileText size={15} className="text-brand-600" /> {d.name}
                  <span className="text-xs text-slate-400">{d.pages}p · {d.sizeKb}KB</span>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <PdfPreview name={referral.documents.find((d) => d.id === preview)?.name ?? "document.pdf"} />
              <a className="mt-2 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline" href="#" onClick={(e) => e.preventDefault()}>
                <Download size={14} /> Download
              </a>
            </div>
          </Card>
        </div>

        {/* RIGHT — patient, assignment, eligibility, auth, appt, timeline */}
        <div className="space-y-5">
          <Card>
            <div className="section-title mb-2">Patient</div>
            <dl className="space-y-1.5 text-sm">
              <Row k="Name" v={referral.patientName} />
              <Row k="DOB" v={referral.dob} />
              <Row k="Insurance ID" v={referral.insuranceId} />
              <Row k="Payer" v={referral.payer} />
            </dl>
          </Card>

          <Card>
            <div className="section-title mb-2">Assignment</div>
            <select className="input mb-2" value={referral.assignee ?? ""}
              onChange={(e) => updateReferral(referral.id, { assignee: e.target.value }, `Assigned to ${e.target.value}.`)}>
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id}>{u.name}</option>)}
            </select>
            <button className="btn-ghost btn-sm w-full" onClick={() => updateReferral(referral.id, { assignee: "Alex Rivera" }, "Claimed by Alex Rivera.")}>
              <UserCheck size={15} /> Claim for me
            </button>
          </Card>

          <Card>
            <div className="section-title mb-2">Eligibility</div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${referral.eligibility.status === "Verified" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>{referral.eligibility.status}</span>
              <span className="text-slate-400">{referral.eligibility.plan} · {referral.eligibility.copay}</span>
            </div>
            <button className="btn-ghost btn-sm w-full" onClick={() => updateReferral(referral.id, { eligibility: { ...referral.eligibility, status: "Verified", checkedAt: new Date().toISOString() } }, "Eligibility re-checked.")}>
              <RefreshCw size={14} /> Re-check eligibility
            </button>
          </Card>

          <Card>
            <div className="section-title mb-2">Prior Authorization</div>
            <select className="input mb-2" value={pa.status} onChange={(e) => setPa({ ...pa, status: e.target.value as PriorAuth["status"] })}>
              {["Not required", "Required", "Submitted", "Approved", "Denied"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <input className="input mb-2" placeholder="Auth number" value={pa.authNumber ?? ""} onChange={(e) => setPa({ ...pa, authNumber: e.target.value })} />
            <textarea className="input mb-2" rows={2} placeholder="Notes" value={pa.notes ?? ""} onChange={(e) => setPa({ ...pa, notes: e.target.value })} />
            <button className="btn-primary btn-sm w-full" onClick={() => updateReferral(referral.id, { priorAuth: pa }, `Prior auth updated: ${pa.status}.`)}>Update authorization</button>
          </Card>

          <Card>
            <div className="section-title mb-2">Appointment</div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {referral.appointment ? `Scheduled for ${new Date(referral.appointment).toLocaleString()}` : "No appointment scheduled."}
            </p>
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2"><Bell size={15} className="text-slate-400" /><div className="section-title">Notifications</div></div>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>• SLA reminder sent to {referral.assignee ?? "queue"}.</li>
              <li>• Payer eligibility response received.</li>
              <li>• Document ingested from {referral.source}.</li>
            </ul>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="section-title">Timeline</div>
              <button onClick={() => navigate("/board")} className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                View on board <ExternalLink size={12} />
              </button>
            </div>
            <ol className="relative space-y-4 border-l border-slate-200 pl-4 dark:border-slate-700">
              {referral.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900" />
                  <div className="flex items-center gap-2"><StatusPill status={t.status} /><span className="text-[11px] text-slate-400">{new Date(t.at).toLocaleString()}</span></div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.note} {t.by && <span className="text-slate-400">· {t.by}</span>}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-slate-400">{k}</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{v}</dd></div>;
}
function RuleRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 size={16} className={ok ? "text-emerald-500" : "text-slate-300"} />
      <span className="text-slate-700 dark:text-slate-200">{label}</span>
      <span className="ml-auto text-xs text-slate-400">{detail}</span>
    </li>
  );
}
function PdfPreview({ name }: { name: string }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
      <FileText size={40} className="text-slate-300" />
      <p className="mt-2 text-sm font-medium text-slate-500">{name}</p>
      <p className="text-xs text-slate-400">Inline PDF preview</p>
    </div>
  );
}
