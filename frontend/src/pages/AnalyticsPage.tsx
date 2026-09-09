import React, { useEffect, useState, useCallback } from 'react';
import { analyticsApi } from '../api/analytics';
import {
  DeliveryPerformance,
  DefectHeatmapItem,
  CycleTimePoint,
  BottleneckStage,
  ProcurementPipelineItem,
} from '../types';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { DeliveryPerformanceChart } from '../components/charts/DeliveryPerformanceChart';
import { CycleTimeChart } from '../components/charts/CycleTimeChart';
import { DefectHeatmapChart } from '../components/charts/DefectHeatmapChart';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatHours } from '../utils/formatters';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

export const AnalyticsPage: React.FC = () => {
  const [delivery, setDelivery] = useState<DeliveryPerformance[]>([]);
  const [defects, setDefects] = useState<DefectHeatmapItem[]>([]);
  const [cycleTime, setCycleTime] = useState<CycleTimePoint[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckStage[]>([]);
  const [pipeline, setPipeline] = useState<ProcurementPipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [delivRes, defectRes, cycleRes, bottleRes, pipeRes] = await Promise.allSettled([
        analyticsApi.getDeliveryPerformance(),
        analyticsApi.getDefectHeatmap(),
        analyticsApi.getCycleTime(),
        analyticsApi.getBottlenecks(),
        analyticsApi.getProcurementPipeline(),
      ]);

      const allRejected = [delivRes, defectRes, cycleRes, bottleRes, pipeRes].every((r) => r.status === 'rejected');
      if (allRejected) {
        const firstErr = (delivRes as PromiseRejectedResult).reason;
        const msg = firstErr?.response?.data?.message || firstErr?.message || 'Unable to load analytics telemetry. Please try again.';
        setError(msg);
      } else {
        if (delivRes.status === 'fulfilled' && delivRes.value) {
          setDelivery(delivRes.value);
        }
        if (defectRes.status === 'fulfilled' && defectRes.value) {
          setDefects(defectRes.value);
        }
        if (cycleRes.status === 'fulfilled' && cycleRes.value) {
          setCycleTime(cycleRes.value);
        }
        if (bottleRes.status === 'fulfilled' && bottleRes.value) {
          setBottlenecks(bottleRes.value);
        }
        if (pipeRes.status === 'fulfilled' && pipeRes.value) {
          setPipeline(pipeRes.value);
        }
      }
    } catch (err: any) {
      console.error('Failed to load intelligence telemetry', err);
      setError(err?.response?.data?.message || 'Failed to load intelligence telemetry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return <LoadingSpinner text="Loading Analytics..." fullPage />;
  }

  const safeBottlenecks = Array.isArray(bottlenecks) ? bottlenecks : [];
  const safePipeline = Array.isArray(pipeline) ? pipeline : [];

  return (
    <ErrorBoundary>
      <div className="space-y-8 animate-fade-in">
        <PageHeader
          title="Procurement Analytics"
          subtitle="Analysis of vendor delivery performance, lead times, defect rates, and stage bottlenecks."
        />

        {error && (
          <Card className="p-4 bg-vppt-crimson/15 border-vppt-crimson/40 flex items-center justify-between">
            <div className="text-xs text-red-200">
              <span className="font-semibold uppercase tracking-wider font-cinzel mr-2">Telemetry Error:</span>
              {error}
            </div>
            <Button variant="gold" size="sm" onClick={() => loadAnalytics()}>
              Retry
            </Button>
          </Card>
        )}

        {/* Row 1: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card ornate>
            <CardHeader
              title="Procurement Cycle Time & Lead Time Trend"
              subtitle="Average duration from PO creation to completion across historical months"
            />
            <CardBody>
              <CycleTimeChart data={cycleTime} />
            </CardBody>
          </Card>

          <Card ornate>
            <CardHeader
              title="Vendor Delivery Performance"
              subtitle="Comparison of on-time fulfillment vs delinquent deliveries"
            />
            <CardBody>
              <DeliveryPerformanceChart data={delivery} />
            </CardBody>
          </Card>
        </div>

        {/* Row 2: Defect Heatmap */}
        <Card ornate>
          <CardHeader
            title="Defect Rate Heatmap by Vendor & Category"
            subtitle="Observed defect percentages compared against the 5% SLA threshold"
          />
          <CardBody>
            <DefectHeatmapChart data={defects} />
          </CardBody>
        </Card>

        {/* Row 3: Bottleneck Stage Analysis & Pipeline In Flight */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card ornate>
            <CardHeader
              title="Stage Duration & Bottlenecks"
              subtitle="Duration analysis across all order lifecycle states"
            />
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Stage</TableHeaderCell>
                  <TableHeaderCell align="right">Avg Duration</TableHeaderCell>
                  <TableHeaderCell align="right">Max Duration</TableHeaderCell>
                  <TableHeaderCell align="right">Total Orders</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {safeBottlenecks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-vppt-ash/60">
                      No bottleneck data recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  safeBottlenecks.map((b, idx) => (
                    <TableRow key={b.stage_name || idx}>
                      <TableCell>
                        <span className="font-cinzel text-xs font-semibold text-vppt-gold uppercase">
                          {b.stage_name || 'Stage'}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <span className="font-mono text-xs text-vppt-ivory font-bold">
                          {formatHours(b.avg_duration_hours)}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <span className="font-mono text-xs text-vppt-ash">
                          {formatHours(b.max_duration_hours)}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <span className="font-mono text-xs text-vppt-ash/70">
                          {b.occurrence_count ?? (b as any).transaction_count ?? 0}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Row 4: Pipeline In Flight */}
          <Card ornate>
            <CardHeader
              title="Active Orders in Pipeline"
              subtitle="Active purchase orders currently in progress"
            />
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>PO Number</TableHeaderCell>
                  <TableHeaderCell>Vendor</TableHeaderCell>
                  <TableHeaderCell>Stage</TableHeaderCell>
                  <TableHeaderCell align="right">Days in Stage</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {safePipeline.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-vppt-ash/60">
                      No active orders in pipeline.
                    </TableCell>
                  </TableRow>
                ) : (
                  safePipeline.slice(0, 6).map((p, idx) => {
                    const rowKey = p.po_id ? `po-${p.po_id}` : `pr-${(p as any).pr_id || idx}`;
                    const poNum = p.po_number || (p as any).pr_number || '—';
                    const vendorName = p.vendor_name || 'Unassigned';
                    const status = p.status || (p as any).po_status || (p as any).pr_status || 'draft';
                    const daysVal = p.days_in_current_stage ?? (p as any).days_since_po_created;

                    return (
                      <TableRow key={rowKey}>
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-vppt-gold">{poNum}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-vppt-ivory">{vendorName}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status} type="po" />
                        </TableCell>
                        <TableCell align="right">
                          <span className="font-mono text-xs text-vppt-ash">
                            {daysVal !== null && daysVal !== undefined ? `${daysVal} d` : '—'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};
