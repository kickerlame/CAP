import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, Check, CheckCheck, AlertTriangle, Info, AlertOctagon, Filter } from 'lucide-react';
import { analyticsApi } from '../api/analytics';
import { Alert, AlertSeverity } from '../types';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { formatDateTime } from '../utils/formatters';

interface OutletContextType {
  refreshAlerts?: () => void;
}

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);

  const { refreshAlerts } = useOutletContext<OutletContextType>() || {};

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getAlerts({
        severity: severityFilter || undefined,
        isRead: unreadOnly ? false : undefined,
        limit: 50,
      });
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, unreadOnly]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAcknowledge = async (id: number) => {
    setAcknowledgingId(id);
    try {
      await analyticsApi.acknowledgeAlert(id);
      setAlerts((prev) => prev.map((a) => (a.alert_id === id ? { ...a, is_read: true } : a)));
      if (refreshAlerts) refreshAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const getAlertIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="System Alerts & Notifications"
        subtitle="Operational alerts, stock-out warnings, SLA violations, and budget notifications."
      />

      {/* Filter Tabs */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSeverityFilter('')}
              className={`px-3 py-1.5 rounded text-xs font-cinzel uppercase tracking-wider transition-colors ${
                severityFilter === ''
                  ? 'bg-vppt-elevated text-vppt-gold border border-vppt-gold/40'
                  : 'text-vppt-ash hover:text-vppt-ivory'
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-3 py-1.5 rounded text-xs font-cinzel uppercase tracking-wider transition-colors ${
                severityFilter === 'critical'
                  ? 'bg-vppt-critical/30 text-red-200 border border-vppt-critical/50'
                  : 'text-vppt-ash hover:text-vppt-ivory'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setSeverityFilter('warning')}
              className={`px-3 py-1.5 rounded text-xs font-cinzel uppercase tracking-wider transition-colors ${
                severityFilter === 'warning'
                  ? 'bg-amber-900/30 text-amber-200 border border-amber-600/50'
                  : 'text-vppt-ash hover:text-vppt-ivory'
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setSeverityFilter('info')}
              className={`px-3 py-1.5 rounded text-xs font-cinzel uppercase tracking-wider transition-colors ${
                severityFilter === 'info'
                  ? 'bg-indigo-900/30 text-indigo-200 border border-indigo-500/50'
                  : 'text-vppt-ash hover:text-vppt-ivory'
              }`}
            >
              Info
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-xs text-vppt-ash cursor-pointer select-none">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded bg-vppt-surface border-vppt-border2 text-vppt-gold focus:ring-0"
              />
              <span>Unread Only</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <LoadingSpinner text="Loading Alerts..." />
        ) : alerts.length === 0 ? (
          <Card ornate>
            <EmptyState
              title="No Alerts Found"
              description="No alerts currently match your selected filters."
              icon={<CheckCheck className="w-8 h-8 text-vppt-gold" />}
            />
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card
              key={alert.alert_id}
              ornate
              className={`p-4 transition-all duration-200 ${
                alert.is_read
                  ? 'opacity-60 hover:opacity-100 bg-vppt-card/50'
                  : 'border-l-4 border-l-vppt-gold bg-vppt-card'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  {getAlertIcon(alert.severity)}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2.5 flex-wrap">
                      <StatusBadge status={alert.severity} type="severity" />
                      <span className="text-[11px] font-mono text-vppt-ash/60 uppercase">
                        {alert.entity_type} {alert.entity_id ? `#${alert.entity_id}` : ''}
                      </span>
                      <span className="text-[10px] text-vppt-ash/50">&bull;</span>
                      <span className="text-[11px] text-vppt-ash/60">{formatDateTime(alert.created_at)}</span>
                      {alert.is_read && (
                        <span className="text-[10px] uppercase font-cinzel text-vppt-ash/50 bg-vppt-surface px-1.5 py-0.5 rounded">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-vppt-ivory leading-relaxed">{alert.message}</p>
                  </div>
                </div>

                {!alert.is_read && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAcknowledge(alert.alert_id)}
                    isLoading={acknowledgingId === alert.alert_id}
                    className="flex-shrink-0 text-xs font-cinzel uppercase"
                  >
                    <Check className="w-3.5 h-3.5 mr-1 text-vppt-gold" />
                    <span>Acknowledge</span>
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
