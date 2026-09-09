import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge, action }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-vppt-border/60">
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-cinzel font-bold tracking-wider text-vppt-ivory uppercase">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-vppt-ash/80 mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center space-x-3 flex-shrink-0">{action}</div>}
    </div>
  );
};
