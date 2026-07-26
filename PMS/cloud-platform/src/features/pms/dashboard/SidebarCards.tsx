import React, { useState } from "react";
import { Clipboard, ScanBarcode, Brain } from "lucide-react";
import { getDashboardInsight } from "../services/geminiService";

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

export const SidebarCards: React.FC = () => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAudit = async () => {
    setLoading(true);
    // const result = { score: 84, tasks: 14, efficiency: 88 }
    // setInsight(result);
    setLoading(false);
  };

  return (
    <div className="flex flex-col my-6 gap-6">
      <section className="kpi-card p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <IconGradient id="clipboard-gradient" />
          <Clipboard style={{ stroke: "url(#clipboard-gradient)" }} />
          <h2 className="font-normal tracking-wider text-sm my-2 text-white uppercase tracking-tight">
            Follow-Ups
          </h2>
        </div>
        {/* <p className="text-[11px] text-slate-label italic mb-4">
          Actions closed safely?
        </p> */}
        <div className="space-y-3">
          <div className="p-4 bg-black/20 rounded-lg">
            <p className="text-[10px] font-bold text-slate-label uppercase mb-1">
              Due for Closure
            </p>
            <p className="text-2xl font-bold text-white">14 Tasks</p>
          </div>
          <div className="flex mt-4 text-xs justify-between px-1">
            <span className="font-bold tracking-wider font-normal text-slate-label">
              Critical Results
            </span>
            <span className=" font-bold tracking-wider font-normal text-red-400">
              3 High
            </span>
          </div>
        </div>
        {/* <button className="w-full text-center text-[9px] font-bold text-ice-blue uppercase tracking-[0.2em] mt-8 pt-4 border-t border-white/5 hover:text-white">
          View Action Center
        </button> */}
      </section>

      <section className="kpi-card p-6 pb-8 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <IconGradient id="scanbarcode-gradient" />
          <ScanBarcode style={{ stroke: "url(#scanbarcode-gradient)" }} />
          <h2 className="font-normal tracking-wider text-sm my-2 text-white uppercase tracking-tight">
            Charge Capture
          </h2>
        </div>
        {/* <p className="text-[11px] text-slate-label italic mb-4">
          Revenue leakage monitoring
        </p> */}
        <div className="space-y-4">
          <p className="text-2xl font-bold text-white">
            $32.6k{" "}
            <span className="text-[10px] text-slate-label font-normal uppercase">
              Captured
            </span>
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-slate-label py-2 tracking-wider font-normal">
                Coding Accuracy
              </span>
              <span className="text-soft-mint text-xs tracking-wider font-normal">
                88%
              </span>
            </div>
            <div className="w-full h-1.5 bg-black/30 rounded-full">
              <div className="bg-soft-mint h-full rounded-full w-[88%]"></div>
            </div>
          </div>
        </div>
        {/* <button className="w-full text-center text-[9px] font-bold text-ice-blue uppercase tracking-[0.2em] mt-8 pt-4 border-t border-white/5 hover:text-white">
          Coding Audit
        </button> */}
      </section>

      <section className="kpi-card p-6 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-lime-500/5 pointer-events-none"></div>
        <div className="text-center relative z-10">
          <p className="text-[10px] font-bold text-slate-label uppercase tracking-[0.2em] mb-6">
            Executive KPI(Final Outcome)
          </p>
          <div className="relative w-full aspect-[2/1] max-w-[140px] mx-auto overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 50">
              <defs>
                <linearGradient
                  id="scoreGradient"
                  x1="0%"
                  x2="100%"
                  y1="0%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#1a5dad"></stop>
                  <stop offset="100%" stopColor="#84cc16"></stop>
                </linearGradient>
              </defs>
              <path
                className="stroke-white/5"
                d="M 10,50 A 40,40 0 0,1 90,50"
                fill="none"
                strokeLinecap="round"
                strokeWidth="8"
              ></path>
              {/* Dasharray calculation: circumference of semi-circle is ~126. 84/100 * 126 = 106 */}
              <path
                d="M 10,50 A 40,40 0 0,1 90,50"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeDasharray="126"
                strokeDashoffset="20"
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-3xl font-bold text-white">
              84
            </div>
          </div>
          <div className="flex justify-between w-full mt-2">
            <span className="text-[8px] font-bold text-slate-label uppercase">
              Critical
            </span>
            <span className="text-[8px] font-bold text-slate-label uppercase">
              Optimal
            </span>
          </div>
        </div>

        {insight && (
          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5 text-[10px] text-white italic animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-2 mb-1 text-ice-blue font-bold uppercase tracking-tighter">
              <IconGradient id="brain-gradient" />
              <Brain
                className="!text-[14px]"
                style={{ stroke: "url(#brain-gradient)" }}
              />{" "}
              AI Insight
            </div>
            {insight}
          </div>
        )}

        <button
          onClick={handleAudit}
          disabled={loading}
          className="w-full text-center text-[9px] font-bold text-ice-blue uppercase tracking-[0.2em] mt-auto pt-4 border-t border-white/5 hover:text-white disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Patient Velocity"}
        </button>
      </section>
    </div>
  );
};
