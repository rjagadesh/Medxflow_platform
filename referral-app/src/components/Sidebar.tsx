import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ListChecks, Kanban, ClipboardCheck, Upload, Users,
  BarChart3, Settings, Activity,
} from "lucide-react";

const GROUPS = [
  {
    heading: "Workspace",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/referrals", label: "Referrals", icon: ListChecks },
      { to: "/board", label: "Board", icon: Kanban },
    ],
  },
  {
    heading: "Operations",
    items: [
      { to: "/review", label: "Manual Review", icon: ClipboardCheck },
      { to: "/upload", label: "Upload", icon: Upload },
      { to: "/allocation", label: "Allocation", icon: Users },
    ],
  },
  {
    heading: "Insights",
    items: [{ to: "/analytics", label: "Analytics", icon: BarChart3 }],
  },
];

export default function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
          <Activity size={20} />
        </span>
        <div>
          <div className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">ReferralOps</div>
          <div className="text-[11px] text-slate-400">Northwind Health</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {GROUPS.map((g) => (
          <div key={g.heading} className="mb-4">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{g.heading}</div>
            {g.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to} to={to} end={end}
                className={({ isActive }) =>
                  `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`
                }
              >
                <Icon size={17} /> {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
        <NavLink to="/settings"
          className={({ isActive }) =>
            `mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}>
          <Settings size={17} /> Settings
        </NavLink>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">AR</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">Alex Rivera</div>
            <div className="truncate text-[11px] text-slate-400">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
