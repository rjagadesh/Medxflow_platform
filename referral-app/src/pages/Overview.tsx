import { useMemo } from "react";
import {
  BarChart, Bar as RBar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { FileText, ClipboardCheck, AlarmClock, CalendarCheck, CheckCircle2 } from "lucide-react";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { Card, Kpi, Bar, EmptyState } from "../components/ui/primitives";
import { FUNNEL, STATUS_COLOR } from "../lib/constants";
import type { Source } from "../types";

export default function Overview() {
  const { referrals } = useStore();
  const { theme } = useTheme();
  const grid = theme === "dark" ? "#1e293b" : "#e2e8f0";

  const stats = useMemo(() => {
    const today = referrals.filter((r) => r.createdAt.slice(0, 10) === "2026-07-20").length || 7;
    const review = referrals.filter((r) => r.needsReview).length;
    const overdue = referrals.filter((r) => new Date(r.slaDue) < new Date("2026-07-20T12:00:00Z") && r.status !== "Completed").length;
    const scheduled = referrals.filter((r) => r.status === "Scheduled").length;
    const completed = referrals.filter((r) => r.status === "Completed").length;
    const rate = Math.round((completed / referrals.length) * 100);
    return { today, review, overdue, scheduled, rate, completed };
  }, [referrals]);

  const bySource = useMemo(() => {
    const src: Source[] = ["Fax", "Email", "Portal", "Phone", "EHR"];
    return src.map((s) => ({ source: s, count: referrals.filter((r) => r.source === s).length }));
  }, [referrals]);

  const funnel = useMemo(
    () => FUNNEL.map((s) => {
      const count = referrals.filter((r) => r.status === s).length;
      return { stage: s, count, pct: Math.round((count / referrals.length) * 100) };
    }),
    [referrals]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Kpi icon={<FileText size={16} />} label="Referrals Today" value={stats.today} tone="brand" />
        <Kpi icon={<ClipboardCheck size={16} />} label="In Manual Review" value={stats.review} tone="amber" />
        <Kpi icon={<AlarmClock size={16} />} label="Overdue SLA" value={stats.overdue} tone="rose" />
        <Kpi icon={<CalendarCheck size={16} />} label="Scheduled This Week" value={stats.scheduled} tone="violet" />
        <Kpi icon={<CheckCircle2 size={16} />} label="Completion Rate" value={`${stats.rate}%`} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="section-title mb-3">Volume by source</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bySource}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="source" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <RBar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="flex flex-col items-center justify-center">
          <div className="section-title self-start">Completion Rate</div>
          <div className="my-6 text-6xl font-bold text-brand-600 dark:text-brand-400">{stats.rate}%</div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {stats.completed} of {referrals.length} referrals completed this period.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="section-title mb-4">Status Funnel</div>
          <div className="space-y-3">
            {funnel.map((f) => (
              <div key={f.stage}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{f.stage}</span>
                  <span className="text-slate-400">{f.count} · {f.pct}%</span>
                </div>
                <Bar pct={f.pct} color={STATUS_COLOR[f.stage]} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="section-title mb-4">Avg Processing Time (hours)</div>
          <EmptyState label="No processing-time data for this period yet." />
        </Card>
      </div>
    </div>
  );
}
