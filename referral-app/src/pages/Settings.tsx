import { useState } from "react";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "../lib/theme";
import { Card } from "../components/ui/primitives";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative h-5 w-9 rounded-full transition ${on ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-4" : "left-0.5"}`} />
    </button>
  );
}
const REQUIRED = ["Patient name", "DOB", "Specialty", "Referring provider", "ICD-10 code"];

export default function Settings() {
  const { theme, toggle } = useTheme();
  const [threshold, setThreshold] = useState(75);
  const [validity, setValidity] = useState(90);
  const [required, setRequired] = useState<string[]>(["Patient name", "DOB", "Specialty"]);
  const [report, setReport] = useState({ enabled: true, recipients: "ops@northwind.health, lead@northwind.health", time: "13:00" });
  const [prefs, setPrefs] = useState({ fit: "Fit width", showPassed: false, autoRefresh: true });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <div className="section-title mb-3">Appearance</div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <span className="flex items-center gap-2 text-sm">{theme === "dark" ? <Moon size={16} /> : <Sun size={16} />} {theme === "dark" ? "Dark" : "Light"} theme</span>
          <Toggle on={theme === "dark"} onClick={toggle} />
        </div>
      </Card>

      <Card>
        <div className="section-title mb-3">Validation Rules</div>
        <label className="label">Confidence threshold ({threshold}%)</label>
        <input type="range" min={50} max={95} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-brand-600" />
        <label className="label mt-3">Referral validity window (days)</label>
        <input className="input" type="number" value={validity} onChange={(e) => setValidity(Number(e.target.value))} />
        <label className="label mt-3">Required fields</label>
        <div className="flex flex-wrap gap-3">
          {REQUIRED.map((f) => (
            <label key={f} className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={required.includes(f)} className="accent-brand-600"
                onChange={(e) => setRequired((cur) => e.target.checked ? [...cur, f] : cur.filter((x) => x !== f))} />
              {f}
            </label>
          ))}
        </div>
        <button className="btn-primary btn-sm mt-4">Save</button>
      </Card>

      <Card>
        <div className="section-title mb-3">Daily Report</div>
        <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <span className="text-sm">Enable daily report</span>
          <Toggle on={report.enabled} onClick={() => setReport({ ...report, enabled: !report.enabled })} />
        </div>
        <label className="label">Recipient emails (comma-separated)</label>
        <input className="input" value={report.recipients} onChange={(e) => setReport({ ...report, recipients: e.target.value })} />
        <label className="label mt-3">Send time (UTC)</label>
        <input className="input" type="time" value={report.time} onChange={(e) => setReport({ ...report, time: e.target.value })} />
        <div className="mt-4 flex gap-2"><button className="btn-ghost btn-sm">Send now</button><button className="btn-primary btn-sm">Save</button></div>
      </Card>

      <Card>
        <div className="section-title mb-3">Review &amp; PDF Preferences</div>
        <label className="label">Default PDF fit</label>
        <select className="input" value={prefs.fit} onChange={(e) => setPrefs({ ...prefs, fit: e.target.value })}>
          <option>Fit page</option><option>Fit width</option>
        </select>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <span className="text-sm">Show passed referrals in queue</span>
          <Toggle on={prefs.showPassed} onClick={() => setPrefs({ ...prefs, showPassed: !prefs.showPassed })} />
        </div>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <span className="text-sm">Auto-refresh queue</span>
          <Toggle on={prefs.autoRefresh} onClick={() => setPrefs({ ...prefs, autoRefresh: !prefs.autoRefresh })} />
        </div>
        <button className="btn-ghost btn-sm mt-4">Reset preferences</button>
      </Card>

      <Card>
        <div className="section-title mb-3">Account</div>
        <label className="label">Name</label><input className="input" defaultValue="Alex Rivera" />
        <label className="label mt-3">Email</label><input className="input" defaultValue="alex@referralops.io" />
        <label className="label mt-3">Role</label><input className="input bg-slate-50 dark:bg-slate-800/60" value="Admin" readOnly />
        <button className="btn-ghost btn-sm mt-4 text-rose-600"><LogOut size={14} /> Log out</button>
      </Card>

      <Card>
        <div className="section-title mb-3">System &amp; Pipeline</div>
        <dl className="space-y-2 text-sm">
          {[
            ["Extraction provider", "Azure Document Intelligence"],
            ["Model", "prebuilt-document · v4.0"],
            ["Concurrency", "8 workers"],
            ["Handwriting routing", "Route to Manual Review"],
            ["Stuck-extraction recovery", "Auto-retry ×2, then flag"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-1.5 dark:border-slate-800">
              <dt className="text-slate-400">{k}</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
