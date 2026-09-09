import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-xs font-cinzel uppercase tracking-wider text-vppt-ash mb-1.5">{label}</label>}
        <input
          ref={ref}
          className={`w-full bg-vppt-surface border ${
            error ? 'border-vppt-critical' : 'border-vppt-border2'
          } rounded px-3 py-2 text-sm text-vppt-ivory placeholder-vppt-ash/40 focus:outline-none focus:border-vppt-gold focus:ring-1 focus:ring-vppt-gold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-vppt-critical mt-1">{error}</p>}
        {helper && !error && <p className="text-xs text-vppt-ash/60 mt-1">{helper}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-xs font-cinzel uppercase tracking-wider text-vppt-ash mb-1.5">{label}</label>}
        <select
          ref={ref}
          className={`w-full bg-vppt-surface border ${
            error ? 'border-vppt-critical' : 'border-vppt-border2'
          } rounded px-3 py-2 text-sm text-vppt-ivory focus:outline-none focus:border-vppt-gold focus:ring-1 focus:ring-vppt-gold transition-colors duration-150 ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-vppt-critical mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
