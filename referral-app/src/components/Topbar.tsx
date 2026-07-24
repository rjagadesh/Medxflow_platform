import { useLocation } from "react-router-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "../lib/theme";

const META: Record<string, { title: string; badge: string; desc: string }> = {
  "/": { title: "Overview", badge: "Dashboard", desc: "Today's referral operations at a glance." },
  "/referrals": { title: "Referrals", badge: "Workspace", desc: "Search, filter and triage every referral." },
  "/board": { title: "Board", badge: "Workspace", desc: "Drag referrals across the pipeline." },
  "/review": { title: "Manual Review", badge: "Operations", desc: "Correct low-confidence extractions and approve." },
  "/upload": { title: "Upload", badge: "Operations", desc: "Ingest new referral documents." },
  "/allocation": { title: "Allocation", badge: "Operations", desc: "Balance workload across your team." },
  "/analytics": { title: "Analytics", badge: "Insights", desc: "Conversion, throughput and revenue trends." },
  "/settings": { title: "Settings", badge: "System", desc: "Appearance, rules, reports and account." },
};

export default function Topbar() {
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  const key = pathname.startsWith("/referrals/") ? "/referrals" : pathname;
  const meta = META[key] ?? META["/"];

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{meta.title}</h1>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">{meta.badge}</span>
        </div>
        <p className="truncate text-xs text-slate-400">{meta.desc}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={toggle} title="Toggle theme"
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">AR</span>
        <button className="btn-ghost btn-sm"><LogOut size={15} /> Logout</button>
      </div>
    </header>
  );
}
