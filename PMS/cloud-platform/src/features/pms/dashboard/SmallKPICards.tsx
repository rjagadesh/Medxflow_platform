import React from "react";
import { DollarSign, TrendingUp, Settings } from "lucide-react";

const IconGradient = ({ id }: { id: string }) => (
  <svg
    width="0"
    height="0"
    className="absolute"
    style={{ visibility: "hidden" }}
  >
    <defs>
      <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="rgba(0, 91, 127, 1)" />
        <stop offset="72%" stopColor="rgba(0, 187, 242, 1)" />
        <stop offset="100%" stopColor="rgba(0, 187, 242, 1)" />
      </linearGradient>
    </defs>
  </svg>
);

export const SmallKPICards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <section className="kpi-card p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <IconGradient id="dollar-sign-gradient" />
          <DollarSign style={{ stroke: "url(#dollar-sign-gradient)" }} />
          <h2 className="font-normal tracking-wider my-2 text-sm text-white uppercase tracking-tight">
            Payments & Collections
          </h2>
        </div>
        <div className="mb-4">
          <p className="text-2xl font-bold text-white">$78.4k</p>
          <p className="text-[10px] text-slate-label">Today's Collections</p>
        </div>
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px] font-normal">
            <span className="text-soft-mint text-xs tracking-wider">
              ↑ 36% Day/Day
            </span>
            <span className="text-slate-label text-xs tracking-wider">
              Grade: A+
            </span>
          </div>
        </div>
      </section>

      <section className="kpi-card p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <IconGradient id="trending-up-gradient" />
          <TrendingUp style={{ stroke: "url(#trending-up-gradient)" }} />
          <h2 className="font-normal tracking-wider my-2 text-sm text-white uppercase tracking-tight">
            Claims Performance
          </h2>
        </div>
        <div className="mb-4">
          <p className="text-2xl font-bold text-white">+12%</p>
          <p className="text-[10px] text-slate-label">Patient Volume MoM</p>
        </div>
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex justify-between items-center text-xs tracking-wider font-normal">
            <span className="text-slate-label">Leads: 24</span>
            <span className="text-ice-blue">Referral: 8%</span>
          </div>
        </div>
      </section>

      <section className="kpi-card p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <IconGradient id="settings-gradient" />
          <Settings style={{ stroke: "url(#settings-gradient)" }} />
          <h2 className="font-normal tracking-wider my-2 text-sm text-white uppercase tracking-tight">
            Account KPI
          </h2>
        </div>
        <div className="mb-4">
          <p className="text-2xl font-bold text-white">88%</p>
          <p className="text-[10px] text-slate-label">Staff Productivity</p>
        </div>
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex justify-between items-center text-xs font-normal tracking-wider">
            <span className="text-slate-label">Turnover: 22m</span>
            <span className="text-amber-400">Wait Lag: +4m</span>
          </div>
        </div>
      </section>
    </div>
  );
};
