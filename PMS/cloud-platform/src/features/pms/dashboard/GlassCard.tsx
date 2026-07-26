
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', gradient = false }) => {
  return (
    <div className={`glass-card ${gradient ? 'bg-gradient-to-br from-slate-900/60 to-cyan-500/5' : ''} ${className}`}>
      {children}
    </div>
  );
};
