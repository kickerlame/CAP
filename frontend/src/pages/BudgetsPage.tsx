import React, { useEffect, useState, useCallback } from 'react';
import { Coins, Plus, TrendingUp, PieChart, Landmark } from 'lucide-react';
import { budgetsApi } from '../api/budgets';
import { analyticsApi } from '../api/analytics';
import { usersApi } from '../api/users';
import { Budget, BudgetUtilization } from '../types';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { KpiCard } from '../components/common/KpiCard';
import { BudgetUtilizationChart } from '../components/charts/BudgetUtilizationChart';
import { formatCurrency, formatPct } from '../utils/formatters';

export const BudgetsPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [utilization, setUtilization] = useState<BudgetUtilization[]>([]);
  const [loading, setLoading] = useState(true);

  // New Budget Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Array<{ department_id: number; dept_name: string }>>([]);
  const [form, setForm] = useState({
    departmentId: 1,
    fiscalYear: 2026,
    fiscalQuarter: 1,
    budgetName: '',
    totalAmount: 100000,
  });

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, uRes, dRes] = await Promise.all([
        budgetsApi.list({ limit: 50 }),
        analyticsApi.getBudgetUtilization(),
        usersApi.getDepartments().catch(() => []),
      ]);
      setBudgets(bRes.data || []);
      setUtilization(uRes || []);
      setDepartments(dRes || []);
      if (dRes[0]) setForm((f) => ({ ...f, departmentId: dRes[0].department_id }));
    } catch (err) {
      console.error('Failed to load budget archives', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await budgetsApi.create({
        departmentId: Number(form.departmentId),
        fiscalYear: Number(form.fiscalYear),
        fiscalQuarter: Number(form.fiscalQuarter),
        budgetName: form.budgetName || `FY${form.fiscalYear} Q${form.fiscalQuarter} Allocation`,
        totalAmount: Number(form.totalAmount),
      });
      setIsModalOpen(false);
      await loadBudgets();
    } catch (err) {
      console.error('Failed to allocate budget', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Aggregates
  const totalAllocated = budgets.reduce((acc, b) => acc + Number(b.total_amount), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent_amount), 0);
  const totalRemaining = budgets.reduce((acc, b) => acc + Number(b.remaining_amount), 0);
  const avgUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Department Budgets"
        subtitle="Track departmental procurement budgets, expenditure, and budget utilization."
        action={
          <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Budget</span>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Budget"
          value={formatCurrency(totalAllocated)}
          subtitle="Total allocated across departments"
          icon={<Landmark className="w-5 h-5" />}
        />
        <KpiCard
          title="Total Spent"
          value={formatCurrency(totalSpent)}
          subtitle="Actual procurement expenditure"
          icon={<Coins className="w-5 h-5 text-vppt-gold" />}
        />
        <KpiCard
          title="Remaining Budget"
          value={formatCurrency(totalRemaining)}
          subtitle="Available funds remaining"
          icon={<PieChart className="w-5 h-5 text-[#9BC49E]" />}
        />
        <KpiCard
          title="Average Utilization"
          value={formatPct(avgUtilization)}
          subtitle="Overall budget consumption"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Chart Section */}
      <Card ornate>
        <CardHeader
          title="Department Budget vs. Spend"
          subtitle="Comparison of actual spend against total allocated budget"
        />
        <CardBody>
          <BudgetUtilizationChart data={utilization} />
        </CardBody>
      </Card>

      {/* Budgets Table */}
      <Card ornate>
        <CardHeader
          title="Budget Allocations"
          subtitle="Detailed list of quarterly and annual departmental budgets"
        />
        {loading ? (
          <LoadingSpinner text="Loading Budgets..." />
        ) : budgets.length === 0 ? (
          <div className="p-8 text-center text-xs text-vppt-ash">No budgets found.</div>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Budget Name</TableHeaderCell>
                <TableHeaderCell>Department</TableHeaderCell>
                <TableHeaderCell>Fiscal Period</TableHeaderCell>
                <TableHeaderCell align="right">Allocated</TableHeaderCell>
                <TableHeaderCell align="right">Spent</TableHeaderCell>
                <TableHeaderCell align="right">Remaining</TableHeaderCell>
                <TableHeaderCell align="center">Utilization</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {budgets.map((b) => {
                const util = Number(b.total_amount) > 0 ? (Number(b.spent_amount) / Number(b.total_amount)) * 100 : 0;
                return (
                  <TableRow key={b.budget_id}>
                    <TableCell>
                      <div className="font-semibold text-vppt-ivory font-cinzel text-sm">{b.budget_name}</div>
                      <div className="text-[10px] text-vppt-ash/60 uppercase font-mono">{b.status}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-vppt-ivory">{b.dept_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-vppt-ash">
                        FY{b.fiscal_year} {b.fiscal_quarter ? `Q${b.fiscal_quarter}` : 'Annual'}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-mono text-xs font-semibold text-vppt-ivory">
                        {formatCurrency(b.total_amount)}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-mono text-xs text-vppt-gold">{formatCurrency(b.spent_amount)}</span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-mono text-xs text-[#9BC49E]">
                        {formatCurrency(b.remaining_amount)}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <div className="w-24 mx-auto">
                        <div className="flex justify-between text-[10px] text-vppt-ash mb-1">
                          <span>{util.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-vppt-surface rounded-full overflow-hidden border border-vppt-border2">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              util > 90 ? 'bg-red-400' : util > 70 ? 'bg-amber-400' : 'bg-vppt-gold'
                            }`}
                            style={{ width: `${Math.min(100, util)}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Department Budget"
        subtitle="Allocate procurement budget to a department."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleCreateBudget} isLoading={submitting}>
              Save Budget
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Budget Name"
            placeholder="e.g. FY2026 IT Hardware Budget"
            value={form.budgetName}
            onChange={(e) => setForm({ ...form, budgetName: e.target.value })}
            required
          />

          <Select
            label="Department"
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: Number(e.target.value) })}
          >
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.dept_name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fiscal Year"
              type="number"
              value={form.fiscalYear}
              onChange={(e) => setForm({ ...form, fiscalYear: Number(e.target.value) })}
              required
            />
            <Select
              label="Fiscal Quarter"
              value={form.fiscalQuarter}
              onChange={(e) => setForm({ ...form, fiscalQuarter: Number(e.target.value) })}
            >
              <option value="1">Quarter 1</option>
              <option value="2">Quarter 2</option>
              <option value="3">Quarter 3</option>
              <option value="4">Quarter 4</option>
            </Select>
          </div>

          <Input
            label="Budget Amount ($)"
            type="number"
            min="1000"
            step="1000"
            value={form.totalAmount}
            onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })}
            required
          />
        </form>
      </Modal>
    </div>
  );
};
