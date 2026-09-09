import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Clock,
  Coins,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { analyticsApi } from '../api/analytics';
import {
  KPIs,
  DeliveryPerformance,
  CycleTimePoint,
  VendorScorecard,
  Alert,
} from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { DeliveryPerformanceChart } from '../components/charts/DeliveryPerformanceChart';
import { CycleTimeChart } from '../components/charts/CycleTimeChart';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { formatCurrency, formatPct, formatDate } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [deliveryData, setDeliveryData] = useState<DeliveryPerformance[]>([]);
  const [cycleData, setCycleData] = useState<CycleTimePoint[]>([]);
  const [scorecards, setScorecards] = useState<VendorScorecard[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, delivRes, cycleRes, scoreRes, alertsRes] = await Promise.all([
        analyticsApi.getKPIs(),
        analyticsApi.getDeliveryPerformance(),
        analyticsApi.getCycleTime({ months: 6 }),
        analyticsApi.getVendorScorecards(),
        analyticsApi.getAlerts({ limit: 4 }),
      ]);

      setKpis(kpiRes);
      setDeliveryData(delivRes);
      setCycleData(cycleRes);
      setScorecards(scoreRes);
      setRecentAlerts(alertsRes.data || []);
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load dashboard metrics.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return <LoadingSpinner text="Loading Dashboard Metrics..." fullPage />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Real-time metrics for vendor reliability, cycle times, and inventory risk."
        badge={
          <span className="px-2.5 py-0.5 rounded text-[10px] font-cinzel uppercase tracking-widest bg-vppt-gold/15 text-vppt-gold border border-vppt-gold/30">
            Phase 1 &bull; Active
          </span>
        }
      />

      {error && (
        <Card className="p-4 bg-vppt-crimson/15 border-vppt-crimson/40 flex items-center justify-between">
          <div className="text-xs text-red-200">
            <span className="font-semibold uppercase tracking-wider font-cinzel mr-2">Telemetry Error:</span>
            {error}
          </div>
          <button
            onClick={() => loadDashboard()}
            className="px-3 py-1.5 rounded text-xs font-cinzel uppercase tracking-wider bg-vppt-gold text-black font-semibold hover:bg-vppt-gold2 transition-colors"
          >
            Retry
          </button>
        </Card>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="On-Time Delivery"
          value={formatPct(kpis?.onTimeDeliveryPct ?? kpis?.onTimeDeliveryRate)}
          subtitle="Vendor delivery compliance SLA"
          icon={<Truck className="w-5 h-5" />}
        />
        <KpiCard
          title="Average Cycle Time"
          value={`${kpis?.avgCycleDays ?? kpis?.avgCycleTimeDays ?? 0} Days`}
          subtitle="PO creation to goods fulfillment"
          icon={<Clock className="w-5 h-5" />}
        />
        <KpiCard
          title="Open Purchase Orders"
          value={kpis?.openPOs || 0}
          subtitle="Orders in active fulfillment"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <KpiCard
          title="Critical Stock Items"
          value={kpis?.criticalStockItems || 0}
          subtitle="Items below safety threshold"
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
        />
        <KpiCard
          title="Pending Requisitions"
          value={kpis?.openPRs ?? kpis?.openRequisitions ?? 0}
          subtitle="Awaiting department approval"
          icon={<FileSpreadsheet className="w-5 h-5" />}
        />
        <KpiCard
          title="Budget Utilization"
          value={formatPct(kpis?.avgBudgetUtilPct ?? kpis?.avgBudgetUtilization)}
          subtitle="Average department budget spend"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KpiCard
          title="Unresolved Alerts"
          value={kpis?.unresolvedAlerts || 0}
          subtitle="Unresolved system alerts"
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
        />
        <KpiCard
          title="Active Vendors"
          value={kpis?.activeVendors ?? 0}
          subtitle={`${kpis?.activeVendors ?? 0} of ${kpis?.totalVendors ?? 0} suppliers active`}
          icon={<Layers className="w-5 h-5" />}
        />
      </div>

      {/* Two Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card ornate>
          <CardHeader
            title="Vendor Delivery Performance"
            subtitle="On-time vs delinquent shipments by registered vendor"
            action={
              <button
                onClick={() => navigate('/analytics')}
                className="text-xs font-cinzel text-vppt-gold hover:underline flex items-center space-x-1"
              >
                <span>View Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <CardBody>
            <DeliveryPerformanceChart data={deliveryData} />
          </CardBody>
        </Card>

        <Card ornate>
          <CardHeader
            title="Procurement Cycle Velocity"
            subtitle="Average lead time in days from order generation to reception"
            action={
              <button
                onClick={() => navigate('/analytics')}
                className="text-xs font-cinzel text-vppt-gold hover:underline flex items-center space-x-1"
              >
                <span>View Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <CardBody>
            <CycleTimeChart data={cycleData} />
          </CardBody>
        </Card>
      </div>

      {/* Bottom Section: Vendor Scorecards + Urgent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor Scorecard Leaderboard (2 cols) */}
        <div className="lg:col-span-2">
          <Card ornate>
            <CardHeader
              title="Top Vendor Performance"
              subtitle="Composite ratings based on SLA compliance, quality, and delivery speed"
              action={
                <button
                  onClick={() => navigate('/vendors')}
                  className="text-xs font-cinzel text-vppt-gold hover:underline flex items-center space-x-1"
                >
                  <span>All Vendors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            />
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Vendor</TableHeaderCell>
                  <TableHeaderCell>Tier</TableHeaderCell>
                  <TableHeaderCell align="center">Overall Score</TableHeaderCell>
                  <TableHeaderCell align="center">Delivery</TableHeaderCell>
                  <TableHeaderCell align="center">Quality</TableHeaderCell>
                  <TableHeaderCell align="right">Orders</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {scorecards.slice(0, 5).map((row) => (
                  <TableRow
                    key={row.vendor_id}
                    onClick={() => navigate(`/vendors/${row.vendor_id}`)}
                  >
                    <TableCell>
                      <div className="font-medium text-vppt-ivory">{row.vendor_name}</div>
                      <div className="text-[10px] font-mono text-vppt-ash/60">{row.vendor_code}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.tier} type="tier" />
                    </TableCell>
                    <TableCell align="center">
                      <span className="font-bold text-vppt-gold font-cinzel text-sm">
                        {row.overall_score !== null && row.overall_score !== undefined ? Number(row.overall_score).toFixed(1) : '—'}
                      </span>
                      {row.overall_score !== null && row.overall_score !== undefined && (
                        <span className="text-[10px] text-vppt-ash/60"> / 100</span>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-xs text-vppt-ash">
                        {row.delivery_score !== null && row.delivery_score !== undefined ? `${Number(row.delivery_score).toFixed(0)}%` : '—'}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-xs text-vppt-ash">
                        {row.quality_score !== null && row.quality_score !== undefined ? `${Number(row.quality_score).toFixed(0)}%` : '—'}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="text-xs font-mono text-vppt-ivory">{row.po_count ?? '—'}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Priority Alerts (1 col) */}
        <div>
          <Card ornate>
            <CardHeader
              title="Recent Alerts"
              subtitle="Issues requiring attention"
              action={
                <button
                  onClick={() => navigate('/alerts')}
                  className="text-xs font-cinzel text-vppt-gold hover:underline flex items-center space-x-1"
                >
                  <span>All Alerts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            />
            <CardBody className="space-y-3">
              {recentAlerts.length === 0 ? (
                <p className="text-xs text-vppt-ash/60 text-center py-6">No active alerts.</p>
              ) : (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.alert_id}
                    onClick={() => navigate('/alerts')}
                    className="p-3 rounded bg-vppt-surface border border-vppt-border hover:border-vppt-gold/40 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={alert.severity} type="severity" />
                      <span className="text-[10px] text-vppt-ash/60">{formatDate(alert.created_at)}</span>
                    </div>
                    <p className="text-xs text-vppt-ivory line-clamp-2 leading-relaxed">{alert.message}</p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
