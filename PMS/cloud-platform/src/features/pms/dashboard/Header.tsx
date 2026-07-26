import React from "react";
import { Activity, Bell } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-obsidian/80 backdrop-blur-md border-b border-white/5 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-ice-blue to-blue-600 rounded-xl flex items-center justify-center text-obsidian shadow-lg">
          <Activity className="!font-semibold" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            MedCore <span className="text-ice-blue">Charcoal</span>
          </h1>
          <p className="text-[10px] text-slate-label font-bold uppercase tracking-widest">
            Practice Management Systems
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-label">
          <button className="text-ice-blue">Overview</button>
          <button className="hover:text-white transition-colors">
            Financials
          </button>
          <button className="hover:text-white transition-colors">
            Clinical
          </button>
          <button className="hover:text-white transition-colors">
            Operations
          </button>
        </nav>

        <div className="h-6 w-px bg-white/10"></div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-white/5 text-slate-label hover:text-white transition-colors">
            <Bell />
          </button>
          <div className="w-10 h-10 rounded-full bg-charcoal flex items-center justify-center border border-white/10 overflow-hidden">
            <img
              alt="User Avatar"
              src="https://picsum.photos/id/64/100/100"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
