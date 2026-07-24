import { useMemo } from "react";
import {
  BarChart, Bar as RBar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Download, Clock } from "lucide-react";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { Card, Bar, EmptyState } from "../components/ui/primitives";
import { FUNNEL, STATUS_COLOR } from "../lib/constants";

export default function Analytics() {
  const { referrals, users } = useStore();
  const { theme } = useTheme();
  const grid = theme === "dark" ? "#1e293b" : "#e2e8f0";

  const stages = useMemo(
    () => FUNNEL.map((s) => {
      const count = referrals.filter((r) => r.status === s).length;
      return { stage: s, count, pct: Math.round((count / referrals.length) * 100) };
    }),
    [referrals]
  );

  const throughput = useMemo(
    () => users.map((u) => ({
      name: u.name.split(" ")[0],
      completed: referrals.filter((r) => r.assignee === u.name && r.status === "Completed").length,
    })),
    [referrals, users]
  );

  const authCount = referrals.filter((r) => r.priorAuth.status !== "Not required").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h2 className="text-sm font-semibold text-slate-500">Reporting period · last 30 days</h2>
        <button className="btn-ghost btn-sm ml-auto"><Download size={14} /> Export CSV</button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="section-title mb-4">Conversion Rates by Stage</div>
          <div className="space-y-3">
            {stages.map((s) => (
              <div key={s.stage}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{s.stage}</span>
                  <span className="text-slate-400">{s.count} · {s.pct}%</span>
                </div>
                <Bar pct={s.pct} color={STATUS_COLOR[s.stage]} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center">
          <div className="section-title self-start">Authorization Delay</div>
          <Clock size={30} className="mt-4 text-brand-500" />
          <div className="mt-2 text-5xl font-bold text-slate-800 dark:text-slate-100">18.4<span className="text-2xl text-slate-400"> hrs</span></div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">avg, based on {authCount} authorizations</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="section-title mb-3">Per-user Throughput (Completed)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={throughput}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <RBar dataKey="completed" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="section-title mb-3">Revenue by Source</div>
          <EmptyState label="Revenue data not connected for this period." />
        </Card>
      </div>
    </div>
  );
}
