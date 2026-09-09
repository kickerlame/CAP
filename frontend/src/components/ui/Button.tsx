import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline' | 'ghost' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'gold',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-vppt-gold disabled:opacity-50 disabled:cursor-not-allowed rounded';

  const sizes = {
    sm: 'px-2.5 py-1 text-xs tracking-wide',
    md: 'px-4 py-2 text-sm tracking-wide',
    lg: 'px-5 py-2.5 text-base tracking-wider',
  };

  const variants = {
    gold: 'bg-gradient-to-r from-[#8F7440] via-[#C6A15B] to-[#8F7440] text-black font-semibold shadow-md hover:brightness-110 active:brightness-95 border border-[#C6A15B]/40',
    outline:
      'border border-vppt-border2 text-vppt-ivory hover:border-vppt-gold hover:text-vppt-gold hover:bg-vppt-gold/5 active:bg-vppt-gold/10',
    secondary: 'bg-vppt-elevated border border-vppt-border text-vppt-ivory hover:bg-vppt-card hover:border-vppt-gold/40',
    ghost: 'text-vppt-ash hover:text-vppt-ivory hover:bg-vppt-surface',
    danger: 'bg-vppt-critical/20 border border-vppt-critical/40 text-red-300 hover:bg-vppt-critical/30',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};
