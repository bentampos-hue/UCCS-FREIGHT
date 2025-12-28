import React from 'react';

type BadgeColor = 'blue' | 'green' | 'amber' | 'slate' | 'red' | 'indigo';

export const Badge: React.FC<{ 
  children: React.ReactNode; 
  color?: BadgeColor;
  className?: string;
}> = ({ children, color = 'slate', className = '' }) => {
  const colors = {
    blue: "bg-blue-50/50 text-blue-700 border-blue-100/50",
    green: "bg-emerald-50/50 text-emerald-700 border-emerald-100/50",
    amber: "bg-amber-50/50 text-amber-700 border-amber-100/50",
    red: "bg-rose-50/50 text-rose-700 border-rose-100/50",
    slate: "bg-slate-100/50 text-slate-600 border-slate-200/50",
    indigo: "bg-indigo-50/50 text-indigo-700 border-indigo-100/50"
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border backdrop-blur-sm ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};