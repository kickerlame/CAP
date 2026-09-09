import React from 'react';
import { Badge, BadgeVariant } from '../ui/Badge';
import { PRStatus, POStatus, RiskLevel, AlertSeverity } from '../../types';

interface StatusBadgeProps {
  status: PRStatus | POStatus | RiskLevel | AlertSeverity | string;
  type?: 'pr' | 'po' | 'tier' | 'risk' | 'severity' | 'generic';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'generic' }) => {
  let variant: BadgeVariant = 'neutral';
  const raw = String(status || '').trim();
  const normStatus = raw.toLowerCase();
  let label = raw.replace(/_/g, ' ');

  if (type === 'tier' || ['platinum', 'gold', 'silver', 'bronze', 'probation'].includes(normStatus)) {
    switch (normStatus) {
      case 'platinum':
      case 'gold':
        variant = 'gold';
        label = normStatus.charAt(0).toUpperCase() + normStatus.slice(1);
        break;
      case 'silver':
        variant = 'info';
        label = 'Silver';
        break;
      case 'bronze':
        variant = 'warning';
        label = 'Bronze';
        break;
      case 'probation':
        variant = 'critical';
        label = 'Probation';
        break;
      default:
        variant = 'neutral';
        label = raw;
    }
  } else if (type === 'risk' || ['normal', 'warning', 'critical', 'out_of_stock'].includes(normStatus)) {
    switch (normStatus) {
      case 'normal':
        variant = 'success';
        label = 'Normal Stock';
        break;
      case 'warning':
        variant = 'warning';
        label = 'Low Stock';
        break;
      case 'critical':
        variant = 'critical';
        label = 'Critical Stock';
        break;
      case 'out_of_stock':
        variant = 'critical';
        label = 'Out of Stock';
        break;
    }
  } else if (type === 'severity' || ['critical', 'warning', 'info'].includes(normStatus)) {
    switch (normStatus) {
      case 'critical':
        variant = 'critical';
        label = 'Critical';
        break;
      case 'warning':
        variant = 'warning';
        label = 'Warning';
        break;
      case 'info':
        variant = 'info';
        label = 'Info';
        break;
    }
  } else if (type === 'pr' || type === 'po' || [
    'draft', 'under_review', 'dept_approved', 'procurement_approved', 'converted_to_po', 'rejected',
    'pending', 'acknowledged', 'processing', 'shipped', 'delivered', 'inspected', 'completed', 'cancelled'
  ].includes(normStatus)) {
    switch (normStatus) {
      case 'completed':
      case 'procurement_approved':
      case 'converted_to_po':
        variant = 'success';
        break;
      case 'processing':
      case 'shipped':
      case 'acknowledged':
      case 'dept_approved':
      case 'under_review':
        variant = 'info';
        break;
      case 'pending':
      case 'draft':
        variant = 'warning';
        break;
      case 'rejected':
      case 'cancelled':
        variant = 'critical';
        break;
      default:
        variant = 'neutral';
    }
  } else {
    if (normStatus === 'active') variant = 'success';
    else if (normStatus === 'inactive' || normStatus === 'closed') variant = 'neutral';
    else if (normStatus === 'probation') variant = 'critical';
  }

  return <Badge variant={variant}>{label}</Badge>;
};
