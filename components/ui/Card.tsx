import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children: React.ReactNode; 
  title?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'glass' | 'secondary' | 'none';
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, footer, variant = 'glass', ...props }) => {
  const baseClass = "rounded-[24px] transition-all duration-500 flex flex-col overflow-hidden";
  
  const variants = {
    glass: "liquid-glass",
    secondary: "liquid-glass-secondary",
    none: ""
  };

  return (
    <div 
      {...props} 
      className={`${baseClass} ${variants[variant]} ${className}`}
    >
      {title && (
        <div className="px-8 py-5 border-b border-black/[0.03] bg-white/[0.02] shrink-0">
          {typeof title === 'string' ? (
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      <div className="p-8 flex-1">
        {children}
      </div>
      {footer && (
        <div className="px-8 py-5 border-t border-black/[0.03] bg-slate-50/[0.02] shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
};