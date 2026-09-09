import React from 'react';

export type BadgeVariant = 'gold' | 'success' | 'warning' | 'critical' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'sm', className = '' }) => {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const variants: Record<BadgeVariant, string> = {
    gold: 'bg-vppt-gold/15 text-vppt-gold border border-vppt-gold/40',
    success: 'bg-[#6F8F72]/15 text-[#9BC49E] border border-[#6F8F72]/40',
    warning: 'bg-[#B08A4A]/15 text-[#E6BA6F] border border-[#B08A4A]/40',
    critical: 'bg-[#9B4D4D]/20 text-[#E58080] border border-[#9B4D4D]/40',
    info: 'bg-[#65758B]/15 text-[#A5B4FC] border border-[#65758B]/40',
    neutral: 'bg-vppt-elevated text-vppt-ash border border-vppt-border',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded tracking-wide uppercase transition-colors ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
