
import React from 'react';

export const Sparkline: React.FC = () => (
  <div className="h-8 w-full">
    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
      <path 
        className="stroke-cyan-400 fill-none" 
        d="M0 18 Q 10 10, 20 15 T 40 5 T 60 12 T 80 8 T 100 15" 
        strokeWidth="1.5"
      ></path>
    </svg>
  </div>
);

export const HealthGauge: React.FC<{ score: number }> = ({ score }) => {
  // Simple offset calculation for the arc
  const dashOffset = 126 - (126 * (score / 100));
  
  return (
    <div className="relative w-full aspect-[2/1] max-w-[180px] mx-auto overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 100 50">
        <defs>
          <linearGradient id="neonGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#F43F5E"></stop>
            <stop offset="50%" stopColor="#F59E0B"></stop>
            <stop offset="100%" stopColor="#17c3b2"></stop>
          </linearGradient>
        </defs>
        <path 
          className="stroke-white/10" 
          d="M 10,50 A 40,40 0 0,1 90,50" 
          fill="none" 
          strokeLinecap="round" 
          strokeWidth="8"
        ></path>
        <path 
          className="drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
          d="M 10,50 A 40,40 0 0,1 90,50" 
          fill="none" 
          stroke="url(#neonGradient)" 
          strokeDasharray="126" 
          strokeDashoffset={dashOffset} 
          strokeLinecap="round" 
          strokeWidth="8"
        ></path>
        {/* Needle */}
        <line 
          className="text-white drop-shadow-md" 
          stroke="currentColor" 
          strokeWidth="2" 
          x1="50" x2="82" y1="50" y2="22"
        ></line>
        <circle className="text-white" cx="50" cy="50" fill="currentColor" r="3"></circle>
      </svg>
    </div>
  );
};
