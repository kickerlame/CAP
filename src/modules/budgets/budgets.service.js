'use strict';

// =============================================================
// VPPT — src/modules/budgets/budgets.service.js
// Departmental budget management with spend ledger.
// =============================================================

const db = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

function paginate(page, limit) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { offset: (p - 1) * l, limit: l, page: p };
}

async function listBudgets({ page, limit, departmentId, fiscalYear, status }) {
  const { offset, limit: lim } = paginate(page, limit);
  const conditions = [];
  const params     = [];
  if (departmentId) { conditions.push('b.department_id = ?'); params.push(departmentId); }
  if (fiscalYear)   { conditions.push('b.fiscal_year = ?');   params.push(fiscalYear); }
  if (status)       { conditions.push('b.status = ?');        params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM budgets b ${where}`, params,
  );
  const [rows] = await db.query(
    `SELECT b.*, d.dept_name,
            ROUND(b.spent_amount / NULLIF(b.total_amount, 0) * 100, 2) AS utilization_pct
     FROM budgets b JOIN departments d ON d.department_id = b.department_id
     ${where}
     ORDER BY b.fiscal_year DESC, b.fiscal_quarter, d.dept_name
     LIMIT ? OFFSET ?`,
    [...params, lim, offset],
  );
  return { total, rows };
}

async function getBudget(budgetId) {
  const [rows] = await db.query(
    `SELECT b.*, d.dept_name,
            ROUND(b.spent_amount / NULLIF(b.total_amount, 0) * 100, 2) AS utilization_pct
     FROM budgets b JOIN departments d ON d.department_id = b.department_id
     WHERE b.budget_id = ?`,
    [budgetId],
  );
  if (!rows.length) throw new AppError('Budget not found.', 404);
  const [txns] = await db.query(
    `SELECT bt.*, u.full_name AS recorded_by
     FROM budget_transactions bt JOIN users u ON u.user_id = bt.recorded_by_id
     WHERE bt.budget_id = ? ORDER BY bt.created_at DESC LIMIT 20`,
    [budgetId],
  );
  return { ...rows[0], recentTransactions: txns };
}

async function createBudget(data, createdById) {
  const remaining = parseFloat(data.totalAmount) || 0;
  const [result] = await db.query(
    `INSERT INTO budgets
       (department_id, fiscal_year, fiscal_quarter, budget_name,
        total_amount, spent_amount, remaining_amount, status, created_by_id)
     VALUES (?, ?, ?, ?, ?, 0, ?, 'active', ?)`,
    [data.departmentId, data.fiscalYear, data.fiscalQuarter || null,
     data.budgetName, remaining, remaining, createdById],
  );
  return getBudget(result.insertId);
}

async function updateBudget(budgetId, { totalAmount, status }) {
  const setClauses = [];
  const params     = [];
  if (totalAmount !== undefined) {
    setClauses.push('total_amount = ?', 'remaining_amount = total_amount - spent_amount');
    params.push(totalAmount);
  }
  if (status) { setClauses.push('status = ?'); params.push(status); }
  if (!setClauses.length) throw new AppError('No valid fields provided.', 400);
  params.push(budgetId);
  await db.query(`UPDATE budgets SET ${setClauses.join(', ')} WHERE budget_id = ?`, params);
  return getBudget(budgetId);
}

async function addTransaction(budgetId, { poId, amount, transactionType, description }, recordedById) {
  return db.transaction(async (conn) => {
    await conn.execute(
      `INSERT INTO budget_transactions (budget_id, po_id, amount, transaction_type, description, recorded_by_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [budgetId, poId || null, amount, transactionType || 'debit', description || null, recordedById],
    );

    // Update budget running totals
    if (transactionType === 'credit') {
      await conn.execute(
        `UPDATE budgets SET spent_amount = GREATEST(0, spent_amount - ?),
                remaining_amount = remaining_amount + ? WHERE budget_id = ?`,
        [amount, amount, budgetId],
      );
    } else {
      // debit or adjustment
      await conn.execute(
        `UPDATE budgets SET spent_amount = spent_amount + ?,
                remaining_amount = GREATEST(0, remaining_amount - ?) WHERE budget_id = ?`,
        [amount, amount, budgetId],
      );
    }
    return null;
  }).then(() => getBudget(budgetId));
}

async function listTransactions(budgetId, { page, limit }) {
  const { offset, limit: lim } = paginate(page, limit);
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM budget_transactions WHERE budget_id = ?`, [budgetId],
  );
  const [rows] = await db.query(
    `SELECT bt.*, u.full_name AS recorded_by
     FROM budget_transactions bt JOIN users u ON u.user_id = bt.recorded_by_id
     WHERE bt.budget_id = ? ORDER BY bt.created_at DESC LIMIT ? OFFSET ?`,
    [budgetId, lim, offset],
  );
  return { total, rows };
}

// Called by procurement.service when a PO is completed
async function debitBudgetForPO(poId, departmentId, amount, recordedById) {
  // Find the active budget for this department (prefer quarterly > annual for current period)
  const [rows] = await db.query(
    `SELECT budget_id FROM budgets
     WHERE department_id = ? AND status = 'active'
     ORDER BY fiscal_quarter IS NULL ASC, fiscal_year DESC
     LIMIT 1`,
    [departmentId],
  );
  if (!rows.length) return; // No active budget — skip silently
  await addTransaction(rows[0].budget_id, {
    poId, amount, transactionType: 'debit',
    description: `PO completed: PO ID ${poId}`,
  }, recordedById);
}

module.exports = { listBudgets, getBudget, createBudget, updateBudget, addTransaction, listTransactions, debitBudgetForPO };
