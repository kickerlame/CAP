import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Truck,
  ShieldAlert,
  Clock,
  PackageCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { procurementApi } from '../api/procurement';
import { PurchaseOrder, StageLog, POStatus } from '../types';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { formatCurrency, formatDate, formatDateTime, formatHours } from '../utils/formatters';

export const ProcurementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const poId = Number(id);
  const navigate = useNavigate();

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [stages, setStages] = useState<StageLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [statusModal, setStatusModal] = useState(false);
  const [deliveryModal, setDeliveryModal] = useState(false);
  const [inspectionModal, setInspectionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState<POStatus>('processing');
  const [deliveryForm, setDeliveryForm] = useState({
    actualDate: new Date().toISOString().split('T')[0],
    courier: '',
    trackingNumber: '',
  });
  const [inspectionForm, setInspectionForm] = useState({
    unitsPassed: 10,
    unitsRejected: 0,
    outcome: 'accepted',
    notes: '',
  });

  const loadDetails = useCallback(async () => {
    if (!poId) return;
    setLoading(true);
    try {
      const [orderData, stagesData] = await Promise.all([
        procurementApi.getOrder(poId),
        procurementApi.getOrderStages(poId),
      ]);
      setPo(orderData);
      setStages(stagesData || []);
    } catch (err) {
      console.error('Failed to load purchase order details', err);
    } finally {
      setLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleUpdateStatus = async () => {
    setActionLoading(true);
    try {
      await procurementApi.updateOrderStatus(poId, newStatus);
      setStatusModal(false);
      await loadDetails();
    } catch (err) {
      console.error('Failed to advance stage', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordDelivery = async () => {
    setActionLoading(true);
    try {
      await procurementApi.recordDelivery(poId, deliveryForm);
      setDeliveryModal(false);
      await loadDetails();
    } catch (err) {
      console.error('Failed to record delivery', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordInspection = async () => {
    setActionLoading(true);
    try {
      await procurementApi.recordInspection(poId, {
        unitsPassed: Number(inspectionForm.unitsPassed),
        unitsRejected: Number(inspectionForm.unitsRejected),
        outcome: inspectionForm.outcome,
        notes: inspectionForm.notes,
      });
      setInspectionModal(false);
      await loadDetails();
    } catch (err) {
      console.error('Failed to log inspection', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Purchase Order..." fullPage />;
  }

  if (!po) {
    return (
      <div className="p-8 text-center">
        <p className="text-vppt-ash">Purchase order not found.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/procurement')}>
          Back to Procurement
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/procurement')}
          className="text-xs font-cinzel text-vppt-ash hover:text-vppt-gold flex items-center space-x-1.5 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Procurement</span>
        </button>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeliveryModal(true)}
            className="text-xs uppercase font-cinzel"
          >
            <Truck className="w-3.5 h-3.5 mr-1.5" />
            <span>Record Delivery</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setInspectionModal(true)}
            className="text-xs uppercase font-cinzel"
          >
            <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
            <span>Quality Inspection</span>
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              setNewStatus(po.status);
              setStatusModal(true);
            }}
            className="text-xs uppercase font-cinzel"
          >
            <span>Update Status</span>
          </Button>
        </div>
      </div>

      {/* PO Overview Card */}
      <Card ornate className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xl font-bold text-vppt-gold">{po.po_number}</span>
              <StatusBadge status={po.status} type="po" />
            </div>
            <div className="text-sm font-cinzel text-vppt-ivory">
              Vendor: <span className="text-vppt-gold">{po.vendor_name}</span>
            </div>
            <div className="text-xs text-vppt-ash flex flex-wrap gap-4">
              <span>Department: {po.dept_name}</span>
              <span>Date Created: {formatDate(po.po_created_at)}</span>
              {po.expected_delivery_date && (
                <span>Expected Delivery: {formatDate(po.expected_delivery_date)}</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded bg-vppt-surface border border-vppt-border2 text-right">
            <div className="text-[10px] uppercase font-cinzel text-vppt-ash tracking-wider">Total Amount</div>
            <div className="text-2xl font-cinzel font-bold text-vppt-ivory">{formatCurrency(po.total_amount)}</div>
            <div className="text-[10px] text-vppt-ash/60 mt-0.5">Purchase order total</div>
          </div>
        </div>

        {po.notes && (
          <div className="mt-4 pt-4 border-t border-vppt-border/60 text-xs text-vppt-ash/90">
            <span className="font-semibold text-vppt-ivory uppercase font-cinzel mr-2">Special Instructions:</span>
            {po.notes}
          </div>
        )}
      </Card>

      {/* Items Manifest */}
      <Card ornate>
        <CardHeader
          title="Order Items"
          subtitle="Hardware items ordered in this purchase order"
        />
        {po.items && po.items.length > 0 ? (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Item Code</TableHeaderCell>
                <TableHeaderCell>Item Name</TableHeaderCell>
                <TableHeaderCell align="right">Quantity</TableHeaderCell>
                <TableHeaderCell align="right">Unit Price</TableHeaderCell>
                <TableHeaderCell align="right">Total Price</TableHeaderCell>
                <TableHeaderCell align="right">Rejected</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {po.items.map((it) => (
                <TableRow key={it.poi_id}>
                  <TableCell>
                    <span className="font-mono text-xs text-vppt-gold">{it.item_code}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-vppt-ivory">{it.item_name}</span>
                  </TableCell>
                  <TableCell align="right">
                    <span className="font-mono text-xs text-vppt-ivory">{it.quantity_ordered}</span>
                  </TableCell>
                  <TableCell align="right">
                    <span className="font-mono text-xs text-vppt-ash">{formatCurrency(it.unit_price)}</span>
                  </TableCell>
                  <TableCell align="right">
                    <span className="font-mono text-xs font-semibold text-vppt-gold">
                      {formatCurrency(it.total_price)}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <span
                      className={`font-mono text-xs ${
                        it.quantity_rejected > 0 ? 'text-red-400 font-bold' : 'text-vppt-ash/60'
                      }`}
                    >
                      {it.quantity_rejected}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6 text-xs text-vppt-ash/60 text-center">No line items detailed on this order.</div>
        )}
      </Card>

      {/* Stage Progression Timeline */}
      <Card ornate>
        <CardHeader
          title="Order Timeline & Stage History"
          subtitle="History of order status changes and stage durations"
        />
        <CardBody>
          {stages.length === 0 ? (
            <p className="text-xs text-vppt-ash/60 text-center py-4">No stage transitions logged yet.</p>
          ) : (
            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-vppt-border">
              {stages.map((st, idx) => (
                <div key={st.stage_log_id} className="relative flex items-start space-x-4 pl-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 z-10 ${
                      st.exited_at
                        ? 'bg-vppt-surface border-vppt-gold'
                        : 'bg-vppt-gold border-vppt-ivory animate-pulse'
                    }`}
                  ></div>
                  <div className="flex-1 p-3 bg-vppt-surface border border-vppt-border rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel font-semibold text-vppt-gold uppercase tracking-wider">
                        {st.stage_name}
                      </span>
                      {st.duration_hours !== null && (
                        <span className="text-[10px] font-mono text-vppt-ash">
                          {formatHours(st.duration_hours)}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-vppt-ash/80 flex flex-wrap gap-4">
                      <span>Entered: {formatDateTime(st.entered_at)}</span>
                      {st.exited_at && <span>Exited: {formatDateTime(st.exited_at)}</span>}
                    </div>
                    {st.notes && <p className="text-[11px] text-vppt-ivory/80 italic mt-1">{st.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Advance Stage Modal */}
      <Modal
        isOpen={statusModal}
        onClose={() => setStatusModal(false)}
        title="Update Order Status"
        subtitle="Change the current status of this purchase order."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setStatusModal(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleUpdateStatus} isLoading={actionLoading}>
              Update Status
            </Button>
          </>
        }
      >
        <Select
          label="New Status"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as POStatus)}
        >
          <option value="pending">Pending</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </Modal>

      {/* Record Delivery Modal */}
      <Modal
        isOpen={deliveryModal}
        onClose={() => setDeliveryModal(false)}
        title="Record Delivery"
        subtitle="Record the delivery of goods from the vendor."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeliveryModal(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleRecordDelivery} isLoading={actionLoading}>
              Save Delivery
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Actual Delivery Date"
            type="date"
            value={deliveryForm.actualDate}
            onChange={(e) => setDeliveryForm({ ...deliveryForm, actualDate: e.target.value })}
            required
          />
          <Input
            label="Courier / Carrier"
            placeholder="e.g. DHL Express, FedEx"
            value={deliveryForm.courier}
            onChange={(e) => setDeliveryForm({ ...deliveryForm, courier: e.target.value })}
          />
          <Input
            label="Tracking Number"
            placeholder="e.g. TRK-9920188"
            value={deliveryForm.trackingNumber}
            onChange={(e) => setDeliveryForm({ ...deliveryForm, trackingNumber: e.target.value })}
          />
        </div>
      </Modal>

      {/* Record Inspection Modal */}
      <Modal
        isOpen={inspectionModal}
        onClose={() => setInspectionModal(false)}
        title="Record Quality Inspection"
        subtitle="Record units passed, defect rejection count, and inspection result."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setInspectionModal(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleRecordInspection} isLoading={actionLoading}>
              Save Inspection
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Units Passed"
              type="number"
              min="0"
              value={inspectionForm.unitsPassed}
              onChange={(e) => setInspectionForm({ ...inspectionForm, unitsPassed: Number(e.target.value) })}
            />
            <Input
              label="Units Rejected"
              type="number"
              min="0"
              value={inspectionForm.unitsRejected}
              onChange={(e) => setInspectionForm({ ...inspectionForm, unitsRejected: Number(e.target.value) })}
            />
          </div>

          <Select
            label="Inspection Result"
            value={inspectionForm.outcome}
            onChange={(e) => setInspectionForm({ ...inspectionForm, outcome: e.target.value })}
          >
            <option value="accepted">Accepted</option>
            <option value="partially_accepted">Partially Accepted</option>
            <option value="rejected">Rejected</option>
          </Select>

          <Input
            label="Inspection Notes"
            placeholder="Details of physical defects, packaging damage, etc."
            value={inspectionForm.notes}
            onChange={(e) => setInspectionForm({ ...inspectionForm, notes: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};
