import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingCart, FileText, ChevronRight, Filter } from 'lucide-react';
import { procurementApi } from '../api/procurement';
import { vendorsApi } from '../api/vendors';
import { usersApi } from '../api/users';
import { inventoryApi } from '../api/inventory';
import { PurchaseRequisition, PurchaseOrder, PRStatus, POStatus, Vendor, HardwareItem } from '../types';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';

export const ProcurementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prs' | 'pos'>('prs');
  const [prs, setPrs] = useState<PurchaseRequisition[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [prStatus, setPrStatus] = useState<string>('');
  const [poStatus, setPoStatus] = useState<string>('');
  const [prPage, setPrPage] = useState<number>(1);
  const [poPage, setPoPage] = useState<number>(1);
  const [prTotal, setPrTotal] = useState<number>(0);
  const [poTotal, setPoTotal] = useState<number>(0);

  // Modals
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reference data
  const [departments, setDepartments] = useState<Array<{ department_id: number; dept_name: string }>>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<HardwareItem[]>([]);

  // New PR form
  const [prForm, setPrForm] = useState({
    departmentId: 1,
    priority: 'normal',
    notes: '',
    itemId: 1,
    quantity: 10,
    estimatedCost: 100,
  });

  // New PO form
  const [poForm, setPoForm] = useState({
    vendorId: 1,
    departmentId: 1,
    expectedDeliveryDate: '',
    notes: '',
    itemId: 1,
    quantity: 10,
    unitPrice: 150,
  });

  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'prs') {
        const res = await procurementApi.listRequisitions({
          page: prPage,
          limit: 15,
          status: prStatus || undefined,
        });
        setPrs(res.data || []);
        if (res.meta) setPrTotal(res.meta.total);
      } else {
        const res = await procurementApi.listOrders({
          page: poPage,
          limit: 15,
          status: poStatus || undefined,
        });
        setPos(res.data || []);
        if (res.meta) setPoTotal(res.meta.total);
      }
    } catch (err) {
      console.error('Failed to load procurement records', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, prStatus, poStatus, prPage, poPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load initial totals for tabs
  useEffect(() => {
    procurementApi.listRequisitions({ limit: 1 }).then((r) => { if (r.meta) setPrTotal(r.meta.total); }).catch(() => {});
    procurementApi.listOrders({ limit: 1 }).then((r) => { if (r.meta) setPoTotal(r.meta.total); }).catch(() => {});
  }, []);

  // Load auxiliary reference data on mount
  useEffect(() => {
    async function loadAux() {
      try {
        const [deptRes, vendorRes, itemRes] = await Promise.all([
          usersApi.getDepartments().catch(() => []),
          vendorsApi.list({ limit: 50 }).then((r) => r.data || []).catch(() => []),
          inventoryApi.listHardwareItems().catch(() => []),
        ]);
        setDepartments(deptRes);
        setVendors(vendorRes);
        setItems(itemRes);
        if (deptRes[0]) {
          setPrForm((f) => ({ ...f, departmentId: deptRes[0].department_id }));
          setPoForm((f) => ({ ...f, departmentId: deptRes[0].department_id }));
        }
        if (vendorRes[0]) {
          setPoForm((f) => ({ ...f, vendorId: vendorRes[0].vendor_id }));
        }
        if (itemRes[0]) {
          setPrForm((f) => ({ ...f, itemId: itemRes[0].item_id }));
          setPoForm((f) => ({ ...f, itemId: itemRes[0].item_id }));
        }
      } catch (err) {
        console.error('Error fetching auxiliary data', err);
      }
    }
    loadAux();
  }, []);

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await procurementApi.createRequisition({
        departmentId: Number(prForm.departmentId),
        priority: prForm.priority,
        notes: prForm.notes,
        items: [
          {
            itemId: Number(prForm.itemId),
            quantityRequested: Number(prForm.quantity),
            estimatedUnitCost: Number(prForm.estimatedCost),
          },
        ],
      });
      setIsPrModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to submit requisition', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await procurementApi.createOrder({
        vendorId: Number(poForm.vendorId),
        departmentId: Number(poForm.departmentId),
        expectedDeliveryDate: poForm.expectedDeliveryDate || undefined,
        notes: poForm.notes,
        items: [
          {
            itemId: Number(poForm.itemId),
            quantityOrdered: Number(poForm.quantity),
            unitPrice: Number(poForm.unitPrice),
          },
        ],
      });
      setIsPoModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to issue purchase order', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Procurement Management"
        subtitle="Manage purchase requisitions, approve orders, and track fulfillment lifecycles."
        action={
          activeTab === 'prs' ? (
            <Button variant="gold" size="sm" onClick={() => setIsPrModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New Requisition</span>
            </Button>
          ) : (
            <Button variant="gold" size="sm" onClick={() => setIsPoModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New Purchase Order</span>
            </Button>
          )
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-vppt-border">
        <button
          onClick={() => setActiveTab('prs')}
          className={`px-5 py-2.5 text-xs uppercase font-cinzel font-semibold tracking-wider transition-all border-b-2 ${
            activeTab === 'prs'
              ? 'border-vppt-gold text-vppt-gold bg-vppt-surface/50'
              : 'border-transparent text-vppt-ash hover:text-vppt-ivory'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Requisitions ({prTotal || prs.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-5 py-2.5 text-xs uppercase font-cinzel font-semibold tracking-wider transition-all border-b-2 ${
            activeTab === 'pos'
              ? 'border-vppt-gold text-vppt-gold bg-vppt-surface/50'
              : 'border-transparent text-vppt-ash hover:text-vppt-ivory'
          }`}
        >
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Purchase Orders ({poTotal || pos.length})</span>
          </div>
        </button>
      </div>

      {/* Filter Options */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-vppt-ash/60" />
          {activeTab === 'prs' ? (
            <div className="w-64">
              <Select value={prStatus} onChange={(e) => { setPrStatus(e.target.value); setPrPage(1); }}>
                <option value="">All Requisition Statuses</option>
                <option value="draft">Draft</option>
                <option value="under_review">Under Review</option>
                <option value="dept_approved">Department Approved</option>
                <option value="procurement_approved">Procurement Approved</option>
                <option value="converted_to_po">Converted to PO</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
          ) : (
            <div className="w-64">
              <Select value={poStatus} onChange={(e) => { setPoStatus(e.target.value); setPoPage(1); }}>
                <option value="">All Order Statuses</option>
                <option value="pending">Pending</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Data Table */}
      <Card ornate>
        {loading ? (
          <LoadingSpinner text="Loading Procurement Records..." />
        ) : activeTab === 'prs' ? (
          prs.length === 0 ? (
            <EmptyState
              title="No Requisitions Found"
              description="No purchase requisitions match the current filter."
              icon={<FileText className="w-8 h-8" />}
            />
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Requisition #</TableHeaderCell>
                  <TableHeaderCell>Department</TableHeaderCell>
                  <TableHeaderCell>Requester</TableHeaderCell>
                  <TableHeaderCell>Priority</TableHeaderCell>
                  <TableHeaderCell>Est. Cost</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Date Created</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {prs.map((pr) => (
                  <TableRow key={pr.pr_id}>
                    <TableCell>
                      <span className="font-mono font-semibold text-vppt-gold text-xs">{pr.pr_number}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-vppt-ivory">{pr.dept_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-vppt-ash">{pr.requested_by}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs uppercase font-cinzel ${
                          pr.priority === 'urgent'
                            ? 'text-red-400 font-bold'
                            : pr.priority === 'high'
                            ? 'text-amber-400'
                            : 'text-vppt-ash'
                        }`}
                      >
                        {pr.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-vppt-ivory">
                        {formatCurrency(pr.total_estimated_cost)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={pr.status} type="pr" />
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-vppt-ash/70">{formatDate(pr.pr_created_at)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : pos.length === 0 ? (
          <EmptyState
            title="No Purchase Orders Found"
            description="No purchase orders match the selected filters."
            icon={<ShoppingCart className="w-8 h-8" />}
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>PO Number</TableHeaderCell>
                <TableHeaderCell>Vendor</TableHeaderCell>
                <TableHeaderCell>Department</TableHeaderCell>
                <TableHeaderCell>Total Amount</TableHeaderCell>
                <TableHeaderCell>Expected Delivery</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell align="right">Action</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {pos.map((po) => (
                <TableRow
                  key={po.po_id}
                  onClick={() => navigate(`/procurement/orders/${po.po_id}`)}
                >
                  <TableCell>
                    <span className="font-mono font-semibold text-vppt-gold text-xs">{po.po_number}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-vppt-ivory font-cinzel">{po.vendor_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-vppt-ash">{po.dept_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-vppt-ivory font-semibold">
                      {formatCurrency(po.total_amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-vppt-ash/80">{formatDate(po.expected_delivery_date)}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={po.status} type="po" />
                  </TableCell>
                  <TableCell align="right">
                    <button className="text-vppt-gold hover:text-vppt-ivory p-1 rounded inline-flex items-center text-xs">
                      <span>View Order</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination Footer */}
        {((activeTab === 'prs' && prs.length > 0) || (activeTab === 'pos' && pos.length > 0)) && (
          <div className="px-5 py-3 border-t border-vppt-border/60 flex items-center justify-between text-xs text-vppt-ash">
            <div>
              {activeTab === 'prs'
                ? `Showing ${prs.length} of ${prTotal} requisitions`
                : `Showing ${pos.length} of ${poTotal} purchase orders`}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={activeTab === 'prs' ? prPage <= 1 : poPage <= 1}
                onClick={() => (activeTab === 'prs' ? setPrPage((p) => Math.max(1, p - 1)) : setPoPage((p) => Math.max(1, p - 1)))}
              >
                Previous
              </Button>
              <span className="px-2 font-mono">{activeTab === 'prs' ? prPage : poPage}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={activeTab === 'prs' ? prPage * 15 >= prTotal : poPage * 15 >= poTotal}
                onClick={() => (activeTab === 'prs' ? setPrPage((p) => p + 1) : setPoPage((p) => p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create PR Modal */}
      <Modal
        isOpen={isPrModalOpen}
        onClose={() => setIsPrModalOpen(false)}
        title="Create Purchase Requisition"
        subtitle="Submit a new purchase requisition for department hardware."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsPrModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleCreatePR} isLoading={submitting}>
              Submit Requisition
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Requesting Department"
              value={prForm.departmentId}
              onChange={(e) => setPrForm({ ...prForm, departmentId: Number(e.target.value) })}
            >
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.dept_name}
                </option>
              ))}
            </Select>

            <Select
              label="Priority"
              value={prForm.priority}
              onChange={(e) => setPrForm({ ...prForm, priority: e.target.value })}
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Select
                label="Hardware Item"
                value={prForm.itemId}
                onChange={(e) => setPrForm({ ...prForm, itemId: Number(e.target.value) })}
              >
                {items.map((i) => (
                  <option key={i.item_id} value={i.item_id}>
                    {i.item_code} — {i.item_name}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={prForm.quantity}
              onChange={(e) => setPrForm({ ...prForm, quantity: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Est. Unit Cost ($)"
            type="number"
            step="0.01"
            value={prForm.estimatedCost}
            onChange={(e) => setPrForm({ ...prForm, estimatedCost: Number(e.target.value) })}
          />

          <Input
            label="Justification / Notes"
            placeholder="Reason for requisition..."
            value={prForm.notes}
            onChange={(e) => setPrForm({ ...prForm, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Create PO Modal */}
      <Modal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        title="Create Purchase Order"
        subtitle="Create and issue a new purchase order."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsPoModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleCreatePO} isLoading={submitting}>
              Create Order
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Vendor"
              value={poForm.vendorId}
              onChange={(e) => setPoForm({ ...poForm, vendorId: Number(e.target.value) })}
            >
              {vendors.map((v) => (
                <option key={v.vendor_id} value={v.vendor_id}>
                  {v.vendor_name} ({v.vendor_code})
                </option>
              ))}
            </Select>

            <Select
              label="Department"
              value={poForm.departmentId}
              onChange={(e) => setPoForm({ ...poForm, departmentId: Number(e.target.value) })}
            >
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.dept_name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Select
                label="Hardware Item"
                value={poForm.itemId}
                onChange={(e) => setPoForm({ ...poForm, itemId: Number(e.target.value) })}
              >
                {items.map((i) => (
                  <option key={i.item_id} value={i.item_id}>
                    {i.item_code} — {i.item_name}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={poForm.quantity}
              onChange={(e) => setPoForm({ ...poForm, quantity: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit Price ($)"
              type="number"
              step="0.01"
              value={poForm.unitPrice}
              onChange={(e) => setPoForm({ ...poForm, unitPrice: Number(e.target.value) })}
            />
            <Input
              label="Expected Delivery Date"
              type="date"
              value={poForm.expectedDeliveryDate}
              onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
            />
          </div>

          <Input
            label="Special Instructions / Notes"
            placeholder="Packaging requirements, delivery dock, etc."
            value={poForm.notes}
            onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};
