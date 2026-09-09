import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center border border-dashed border-vppt-border rounded-lg bg-vppt-surface/30">
      <div className="p-4 rounded-full bg-vppt-surface border border-vppt-border2 text-vppt-gold/60 mb-4 shadow-inner">
        {icon || <ShieldAlert className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-cinzel font-semibold text-vppt-ivory uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-xs text-vppt-ash/70 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
