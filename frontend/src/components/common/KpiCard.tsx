import React from 'react';
import { Card } from '../ui/Card';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string | number;
    positive?: boolean;
    label?: string;
  };
  ornate?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon, trend, ornate = true }) => {
  return (
    <Card ornate={ornate} className="p-5 overflow-hidden transition-all duration-300 hover:border-vppt-gold/40">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider font-cinzel text-vppt-ash">{title}</p>
          <div className="text-2xl font-bold font-cinzel text-vppt-ivory tracking-tight">{value}</div>
          {subtitle && <p className="text-xs text-vppt-ash/70">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded bg-vppt-surface border border-vppt-border2 text-vppt-gold shadow-inner">
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-vppt-border/50 flex items-center text-xs">
          <span className={`font-semibold mr-1.5 ${trend.positive ? 'text-[#9BC49E]' : 'text-[#E58080]'}`}>
            {trend.positive ? '▲' : '▼'} {trend.value}
          </span>
          {trend.label && <span className="text-vppt-ash/60">{trend.label}</span>}
        </div>
      )}
    </Card>
  );
};
