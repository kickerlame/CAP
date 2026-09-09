import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import { Vendor, VendorSnapshot, VendorSLA } from '../types';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { formatDate } from '../utils/formatters';

export const VendorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const vendorId = Number(id);
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [snapshots, setSnapshots] = useState<VendorSnapshot[]>([]);
  const [sla, setSla] = useState<VendorSLA | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchVendorData = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const [vData, snapData, slaData] = await Promise.all([
        vendorsApi.getById(vendorId),
        vendorsApi.getSnapshots(vendorId, 10),
        vendorsApi.getSLA(vendorId).catch(() => null),
      ]);
      setVendor(vData);
      setSnapshots(snapData || []);
      setSla(slaData);
    } catch (err) {
      console.error('Failed to load vendor details', err);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await vendorsApi.recalculateScore(vendorId);
      await fetchVendorData();
    } catch (err) {
      console.error('Failed to recalculate score', err);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Vendor Details..." fullPage />;
  }

  if (!vendor) {
    return (
      <div className="p-8 text-center">
        <p className="text-vppt-ash">Vendor not found.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/vendors')}>
          Back to Vendors
        </Button>
      </div>
    );
  }

  const latestSnapshot = snapshots[0] || null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/vendors')}
          className="text-xs font-cinzel text-vppt-ash hover:text-vppt-gold flex items-center space-x-1.5 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vendors</span>
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRecalculate}
          isLoading={recalculating}
          className="text-xs uppercase font-cinzel tracking-wider"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Recalculate Score
        </Button>
      </div>

      {/* Vendor Header Card */}
      <Card ornate className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-cinzel font-bold text-vppt-ivory tracking-wide">{vendor.vendor_name}</h1>
              {latestSnapshot && <StatusBadge status={latestSnapshot.tier} type="tier" />}
              <StatusBadge status={(vendor as any).status || (vendor.is_active ? 'active' : 'inactive')} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-vppt-ash">
              <span className="font-mono text-vppt-gold">{vendor.vendor_code}</span>
              {vendor.registration_number && <span>Reg: {vendor.registration_number}</span>}
              {vendor.country && (
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-vppt-ash/60" /> {vendor.country}
                </span>
              )}
              {vendor.email && (
                <span className="flex items-center">
                  <Mail className="w-3 h-3 mr-1 text-vppt-ash/60" /> {vendor.email}
                </span>
              )}
              {vendor.phone && (
                <span className="flex items-center">
                  <Phone className="w-3 h-3 mr-1 text-vppt-ash/60" /> {vendor.phone}
                </span>
              )}
            </div>
          </div>

          {/* Overall Rating Block */}
          {latestSnapshot && (
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-vppt-surface border border-vppt-border2 shadow-inner">
              <div className="text-right">
                <div className="text-[10px] font-cinzel uppercase tracking-wider text-vppt-ash">Overall Score</div>
                <div className="text-3xl font-cinzel font-bold text-vppt-gold tracking-tight">
                  {Number(latestSnapshot.overall_score).toFixed(1)}
                </div>
                <div className="text-[10px] text-vppt-ash/60">{latestSnapshot.po_count} Evaluated Orders</div>
              </div>
              <div className="p-3 rounded-full bg-vppt-card border border-vppt-gold/40 text-vppt-gold">
                <Award className="w-6 h-6" />
              </div>
            </div>
          )}
        </div>

        {/* 4 Score Metric Bars */}
        {latestSnapshot && (
          <div className="mt-6 pt-6 border-t border-vppt-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded bg-vppt-surface/60 border border-vppt-border/40">
              <div className="text-[11px] font-cinzel uppercase text-vppt-ash flex justify-between">
                <span>SLA Score</span>
                <span className="text-vppt-ivory font-bold">{Number(latestSnapshot.sla_score).toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-vppt-bg rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-vppt-gold rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, latestSnapshot.sla_score)}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-vppt-ash/50 mt-1">Weight: {latestSnapshot.weight_sla * 100}%</div>
            </div>

            <div className="p-3 rounded bg-vppt-surface/60 border border-vppt-border/40">
              <div className="text-[11px] font-cinzel uppercase text-vppt-ash flex justify-between">
                <span>Delivery Score</span>
                <span className="text-vppt-ivory font-bold">{Number(latestSnapshot.delivery_score).toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-vppt-bg rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-[#6F8F72] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, latestSnapshot.delivery_score)}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-vppt-ash/50 mt-1">Weight: {latestSnapshot.weight_delivery * 100}%</div>
            </div>

            <div className="p-3 rounded bg-vppt-surface/60 border border-vppt-border/40">
              <div className="text-[11px] font-cinzel uppercase text-vppt-ash flex justify-between">
                <span>Quality Score</span>
                <span className="text-vppt-ivory font-bold">{Number(latestSnapshot.quality_score).toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-vppt-bg rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-[#B08A4A] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, latestSnapshot.quality_score)}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-vppt-ash/50 mt-1">Weight: {latestSnapshot.weight_quality * 100}%</div>
            </div>

            <div className="p-3 rounded bg-vppt-surface/60 border border-vppt-border/40">
              <div className="text-[11px] font-cinzel uppercase text-vppt-ash flex justify-between">
                <span>Return Score</span>
                <span className="text-vppt-ivory font-bold">{Number(latestSnapshot.return_score).toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-vppt-bg rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-[#65758B] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, latestSnapshot.return_score)}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-vppt-ash/50 mt-1">Weight: {latestSnapshot.weight_return * 100}%</div>
            </div>
          </div>
        )}
      </Card>

      {/* SLA Terms Card */}
      <Card ornate>
        <CardHeader
          title="Active SLA Terms"
          subtitle="Contractual service benchmarks and fulfillment parameters"
        />
        <CardBody>
          {sla ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-vppt-surface border border-vppt-border rounded">
                <div className="text-vppt-ash/70 uppercase font-cinzel">Lead Time Benchmark</div>
                <div className="text-lg font-bold text-vppt-ivory font-cinzel mt-1">
                  {sla.delivery_lead_time_days} Days
                </div>
                <div className="text-[10px] text-vppt-ash/50 mt-0.5">Maximum permitted delivery window</div>
              </div>

              <div className="p-3 bg-vppt-surface border border-vppt-border rounded">
                <div className="text-vppt-ash/70 uppercase font-cinzel">Minimum On-Time SLA</div>
                <div className="text-lg font-bold text-[#9BC49E] font-cinzel mt-1">
                  {sla.sla_on_time_delivery_pct}%
                </div>
                <div className="text-[10px] text-vppt-ash/50 mt-0.5">Target fulfillment threshold</div>
              </div>

              <div className="p-3 bg-vppt-surface border border-vppt-border rounded">
                <div className="text-vppt-ash/70 uppercase font-cinzel">Max Defect Threshold</div>
                <div className="text-lg font-bold text-[#E58080] font-cinzel mt-1">
                  {sla.sla_defect_rate_pct}%
                </div>
                <div className="text-[10px] text-vppt-ash/50 mt-0.5">Allowable quality reject ceiling</div>
              </div>

              <div className="p-3 bg-vppt-surface border border-vppt-border rounded">
                <div className="text-vppt-ash/70 uppercase font-cinzel">Payment Terms</div>
                <div className="text-lg font-bold text-vppt-gold font-cinzel mt-1">
                  Net {sla.payment_terms_days}
                </div>
                <div className="text-[10px] text-vppt-ash/50 mt-0.5">From invoice validation date</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-vppt-ash/60">No SLA terms defined for this vendor.</p>
          )}
        </CardBody>
      </Card>

      {/* Snapshot History Table */}
      <Card ornate>
        <CardHeader
          title="Historical Performance Evaluations"
          subtitle="History of score recalculations and tier changes"
        />
        {snapshots.length === 0 ? (
          <div className="p-6 text-center text-xs text-vppt-ash/60">No historical performance snapshots on record.</div>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Evaluation Date</TableHeaderCell>
                <TableHeaderCell>Tier</TableHeaderCell>
                <TableHeaderCell align="center">Overall Score</TableHeaderCell>
                <TableHeaderCell align="center">SLA Compliance</TableHeaderCell>
                <TableHeaderCell align="center">Delivery Score</TableHeaderCell>
                <TableHeaderCell align="center">Quality Score</TableHeaderCell>
                <TableHeaderCell align="right">Total Orders</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {snapshots.map((snap) => (
                <TableRow key={snap.snapshot_id}>
                  <TableCell>
                    <span className="text-xs font-mono text-vppt-ivory">{formatDate(snap.snapshot_date)}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={snap.tier} type="tier" />
                  </TableCell>
                  <TableCell align="center">
                    <span className="font-bold text-vppt-gold font-cinzel">
                      {Number(snap.overall_score).toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-xs text-vppt-ash">{Number(snap.sla_score).toFixed(0)}%</span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-xs text-vppt-ash">{Number(snap.delivery_score).toFixed(0)}%</span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-xs text-vppt-ash">{Number(snap.quality_score).toFixed(0)}%</span>
                  </TableCell>
                  <TableCell align="right">
                    <span className="text-xs font-mono text-vppt-ivory">{snap.po_count}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
