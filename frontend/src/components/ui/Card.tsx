import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  ornate?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ornate = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-vppt-card border border-vppt-border rounded-lg shadow-lg relative ${
        ornate ? 'corner-accent' : ''
      } ${onClick ? 'cursor-pointer hover:border-vppt-gold/50 transition-all duration-200' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`px-5 py-4 border-b border-vppt-border/60 flex items-center justify-between ${className}`}>
      <div>
        <h3 className="text-sm font-semibold font-cinzel tracking-wider text-vppt-ivory uppercase">{title}</h3>
        {subtitle && <p className="text-xs text-vppt-ash/80 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};
