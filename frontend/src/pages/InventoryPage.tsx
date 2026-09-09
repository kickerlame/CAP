import React, { useEffect, useState, useCallback } from 'react';
import {
  Boxes,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  TrendingDown,
} from 'lucide-react';
import { inventoryApi } from '../api/inventory';
import { analyticsApi } from '../api/analytics';
import { InventoryItem, RiskLevel } from '../types';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { StatusBadge } from '../components/common/StatusBadge';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/ui/Modal';
import { KpiCard } from '../components/common/KpiCard';
import { formatCurrency, formatNumber } from '../utils/formatters';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('');

  // Transaction / Adjustment Modal
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [txnForm, setTxnForm] = useState({
    transactionType: 'adjustment' as 'in' | 'out' | 'adjustment',
    quantity: 1,
    notes: '',
  });
  const [txnLoading, setTxnLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [recalculatingId, setRecalculatingId] = useState<number | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.list({
        search: search || undefined,
        riskLevel: (riskFilter as RiskLevel) || undefined,
        limit: 100,
      });
      setItems(res.data || []);
    } catch (err: any) {
      console.error('Failed to load inventory assets', err);
      const msg = err.response?.data?.message || err.message || 'Unable to load inventory. Please try again.';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, riskFilter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleRecalculate = async (id: number) => {
    setRecalculatingId(id);
    try {
      await inventoryApi.recalculate(id);
      await fetchInventory();
    } catch (err) {
      console.error('Failed to recalculate inventory health', err);
    } finally {
      setRecalculatingId(null);
    }
  };

  const handleCreateTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setTxnLoading(true);
    setModalError(null);
    try {
      const isAdjustment = txnForm.transactionType === 'adjustment';
      await inventoryApi.createTransaction(selectedItem.inventory_id, {
        transactionType: txnForm.transactionType,
        quantity: isAdjustment ? txnForm.quantity - selectedItem.current_stock : txnForm.quantity,
        newStock: isAdjustment ? txnForm.quantity : undefined,
        notes: txnForm.notes,
      });
      setIsTxnModalOpen(false);
      setSuccessMsg(`Successfully updated stock for ${selectedItem.item_name}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setTxnForm({ transactionType: 'in', quantity: 1, notes: '' });
      await fetchInventory();
    } catch (err: any) {
      console.error('Failed to execute stock movement', err);
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to execute stock movement.';
      setModalError(msg);
    } finally {
      setTxnLoading(false);
    }
  };

  // Metrics calculation
  const totalItems = items.length;
  const criticalCount = items.filter((i) => {
    const r = String(i.risk_level || '').toLowerCase();
    return r === 'critical' || r === 'out_of_stock';
  }).length;
  const warningCount = items.filter((i) => String(i.risk_level || '').toLowerCase() === 'warning').length;
  const healthyCount = items.filter((i) => String(i.risk_level || '').toLowerCase() === 'normal').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Hardware Inventory"
        subtitle="Track physical inventory levels, reorder points, consumption rates, and stock risks."
      />

      {successMsg && (
        <div className="p-3.5 rounded bg-[#6F8F72]/20 border border-[#6F8F72]/40 text-xs text-[#C5E1A5] flex items-center justify-between animate-fade-in">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-vppt-ash hover:text-white ml-2 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Items"
          value={totalItems}
          subtitle="Unique hardware items tracked"
          icon={<Boxes className="w-5 h-5" />}
        />
        <KpiCard
          title="Critical Stock"
          value={criticalCount}
          subtitle="Immediate stockout risk"
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
        />
        <KpiCard
          title="Low Stock"
          value={warningCount}
          subtitle="Approaching reorder point"
          icon={<TrendingDown className="w-5 h-5 text-amber-400" />}
        />
        <KpiCard
          title="Healthy Stock"
          value={healthyCount}
          subtitle="Above reorder threshold"
          icon={<Boxes className="w-5 h-5 text-[#9BC49E]" />}
        />
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-vppt-ash/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by item name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-vppt-surface border border-vppt-border2 rounded pl-9 pr-3 py-2 text-sm text-vppt-ivory placeholder-vppt-ash/40 focus:outline-none focus:border-vppt-gold transition-colors"
            />
          </div>

          <div className="w-full sm:w-56">
            <Select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option value="">All Stock Levels</option>
              <option value="normal">Normal</option>
              <option value="warning">Low Stock</option>
              <option value="critical">Critical Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Inventory Items Table */}
      <Card ornate>
        {loading ? (
          <LoadingSpinner text="Loading Inventory..." />
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="p-3 rounded-full bg-vppt-crimson/15 border border-vppt-crimson/40 text-vppt-crimson mb-3">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-cinzel font-semibold text-vppt-ivory uppercase tracking-wider mb-1">
              Unable to Load Inventory
            </h3>
            <p className="text-xs text-red-300/80 max-w-sm mb-4">{error}</p>
            <Button variant="gold" size="sm" onClick={() => fetchInventory()}>
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No Inventory Items Found"
            description="No items match your search filters."
            icon={<Boxes className="w-8 h-8" />}
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Item Name</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell align="center">Stock / Threshold</TableHeaderCell>
                <TableHeaderCell align="center">Daily Consumption</TableHeaderCell>
                <TableHeaderCell align="center">Days Remaining</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell align="right">Actions</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const isUnderReorder = item.current_stock <= item.reorder_point;
                return (
                  <TableRow key={item.inventory_id}>
                    <TableCell>
                      <div className="font-semibold text-vppt-ivory font-cinzel text-sm">{item.item_name}</div>
                      <div className="text-[10px] font-mono text-vppt-gold">{item.item_code}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-vppt-ash">{item.category_name}</span>
                    </TableCell>
                    <TableCell align="center">
                      <div className="font-mono text-xs">
                        <span className={`font-bold ${isUnderReorder ? 'text-red-400' : 'text-vppt-ivory'}`}>
                          {item.current_stock}
                        </span>
                        <span className="text-vppt-ash/50"> / {Number(item.reorder_point || 0).toFixed(0)} {item.unit_of_measure}</span>
                      </div>
                    </TableCell>
                    <TableCell align="center">
                      <span className="font-mono text-xs text-vppt-ash">
                        {item.avg_daily_consumption !== null && item.avg_daily_consumption !== undefined && !isNaN(Number(item.avg_daily_consumption))
                          ? Number(item.avg_daily_consumption).toFixed(1)
                          : '—'}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      {(() => {
                        const rawDays = item.days_remaining ?? (item as any).estimated_days_remaining;
                        const num = rawDays !== null && rawDays !== undefined && rawDays !== '' ? Number(rawDays) : null;
                        if (num === null || isNaN(num)) {
                          return <span className="text-xs text-vppt-ash/60 font-mono">—</span>;
                        }
                        const isCritical = num < 7;
                        return (
                          <span className={`font-mono text-xs font-semibold ${isCritical ? 'text-red-400' : 'text-vppt-ivory'}`}>
                            {Math.round(num)} d
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.risk_level} type="risk" />
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setModalError(null);
                            setTxnForm({ transactionType: 'in', quantity: 1, notes: '' });
                            setIsTxnModalOpen(true);
                          }}
                          title="Record Stock Transaction"
                          className="p-1.5 rounded hover:bg-vppt-surface text-vppt-gold transition-colors"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRecalculate(item.inventory_id)}
                          title="Recalculate Stock Metrics"
                          className="p-1.5 rounded hover:bg-vppt-surface text-vppt-ash hover:text-vppt-ivory transition-colors"
                          disabled={recalculatingId === item.inventory_id}
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              recalculatingId === item.inventory_id ? 'animate-spin text-vppt-gold' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Stock Movement Modal */}
      <Modal
        isOpen={isTxnModalOpen}
        onClose={() => {
          setIsTxnModalOpen(false);
          setModalError(null);
        }}
        title={`Stock Transaction: ${selectedItem?.item_name || ''}`}
        subtitle="Record stock receipt, issue, or manual count adjustment."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsTxnModalOpen(false);
                setModalError(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleCreateTxn} isLoading={txnLoading}>
              Save Transaction
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTxn} className="space-y-4">
          {/* Item Context Banner */}
          {selectedItem && (
            <div className="p-3 rounded bg-vppt-surface border border-vppt-border2 text-xs flex justify-between items-center">
              <div>
                <span className="text-vppt-ash">Current Stock: </span>
                <span className="font-mono font-bold text-vppt-gold">
                  {selectedItem.current_stock} {selectedItem.unit_of_measure}
                </span>
              </div>
              <div>
                <span className="text-vppt-ash">Reorder Point: </span>
                <span className="font-mono text-vppt-ivory">
                  {selectedItem.reorder_point} {selectedItem.unit_of_measure}
                </span>
              </div>
            </div>
          )}

          {modalError && (
            <div className="p-3 rounded bg-vppt-crimson/15 border border-vppt-crimson/40 text-xs text-red-200">
              <span className="font-semibold uppercase tracking-wider font-cinzel mr-1">Error:</span>
              {modalError}
            </div>
          )}

          <Select
            label="Transaction Type"
            value={txnForm.transactionType}
            onChange={(e) => {
              const newType = e.target.value as 'in' | 'out' | 'adjustment';
              setTxnForm({
                ...txnForm,
                transactionType: newType,
                quantity: newType === 'adjustment' && selectedItem ? selectedItem.current_stock : (txnForm.quantity || 1),
              });
              setModalError(null);
            }}
          >
            <option value="in">Stock In (Receipt / Restock - Add Stock)</option>
            <option value="out">Stock Out (Issue / Consumption - Remove Stock)</option>
            <option value="adjustment">Adjustment (Inventory Count - Set Exact Stock)</option>
          </Select>

          <Input
            label={
              txnForm.transactionType === 'in'
                ? 'Quantity to Add'
                : txnForm.transactionType === 'out'
                ? 'Quantity to Remove'
                : 'New Physical Count'
            }
            type="number"
            min={txnForm.transactionType === 'adjustment' ? '0' : '1'}
            value={txnForm.quantity}
            onChange={(e) => {
              setTxnForm({ ...txnForm, quantity: Math.max(0, parseInt(e.target.value, 10) || 0) });
              setModalError(null);
            }}
            required
          />

          {/* Dynamic Result Preview */}
          {selectedItem && (
            <div className="px-3 py-2 rounded bg-vppt-card/50 border border-vppt-border/60 text-xs flex items-center justify-between">
              <span className="text-vppt-ash">Resulting Stock Level:</span>
              <span className="font-mono font-bold text-vppt-ivory">
                {txnForm.transactionType === 'in'
                  ? `${selectedItem.current_stock + (txnForm.quantity || 0)} ${selectedItem.unit_of_measure} (+${txnForm.quantity || 0})`
                  : txnForm.transactionType === 'out'
                  ? `${Math.max(0, selectedItem.current_stock - (txnForm.quantity || 0))} ${selectedItem.unit_of_measure} (-${txnForm.quantity || 0})`
                  : `${txnForm.quantity || 0} ${selectedItem.unit_of_measure} (${(txnForm.quantity || 0) - selectedItem.current_stock >= 0 ? '+' : ''}${(txnForm.quantity || 0) - selectedItem.current_stock})`}
              </span>
            </div>
          )}

          {txnForm.transactionType === 'out' && selectedItem && txnForm.quantity > selectedItem.current_stock && (
            <div className="text-[11px] text-amber-300/80">
              Notice: Quantity exceeds current stock. Final stock will be reduced to 0.
            </div>
          )}

          <Input
            label="Notes / Reference"
            placeholder="e.g. Received shipment, issued for deployment, count correction"
            value={txnForm.notes}
            onChange={(e) => setTxnForm({ ...txnForm, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};
