import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  isLoading, 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-5 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-[0.98]";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200/50",
    secondary: "bg-white/70 backdrop-blur-md text-slate-700 hover:bg-white border border-white/50 shadow-sm",
    outline: "bg-transparent border border-slate-200 text-slate-600 hover:bg-white/40 hover:border-slate-300",
    danger: "bg-rose-50/80 backdrop-blur-sm text-rose-600 hover:bg-rose-100 border border-rose-200/40",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100/40"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
      ) : children}
    </button>
  );
};