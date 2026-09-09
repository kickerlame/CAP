'use strict';

// =============================================================
// VPPT — src/modules/inventory/inventory.service.js
// Stock management and ADC/ROP/EDR recalculation engine.
//
// Formulas (mirrors the schema documentation in 03_hardware_inventory.sql):
//   ADC  = total OUT qty in window / window_days             (90-day default)
//   ROP  = (ADC × lead_time_days) + safety_stock
//   EDR  = current_stock / ADC  (NULL if ADC = 0)
//   Risk = CRITICAL if stock = 0 OR stock <= ROP
//          WARNING  if EDR <= lead_time_days
//          NORMAL   otherwise
// =============================================================

const db = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

function paginate(page, limit) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { offset: (p - 1) * l, limit: l, page: p };
}

// ── listInventory ─────────────────────────────────────────────
async function listInventory({ page, limit, riskLevel, categoryId, search }) {
  const { offset, limit: lim } = paginate(page, limit);
  const conditions = ['hi.is_active = 1'];
  const params     = [];

  if (riskLevel)  { conditions.push('LOWER(inv.risk_level) = LOWER(?)'); params.push(riskLevel); }
  if (categoryId) { conditions.push('hi.category_id = ?');   params.push(categoryId); }
  if (search) {
    conditions.push('(hi.item_name LIKE ? OR hi.item_code LIKE ? OR hi.brand LIKE ? OR hi.model LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  const where = conditions.join(' AND ');
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM   inventory inv JOIN hardware_items hi ON hi.item_id = inv.item_id
     WHERE  ${where}`, params,
  );

  const [rows] = await db.query(
    `SELECT inv.*, inv.estimated_days_remaining AS days_remaining,
            hi.item_code, hi.item_name, hi.brand, hi.model,
            hi.unit_cost, hi.safety_stock, hi.lead_time_days, hi.unit_of_measure,
            hc.category_id, hc.category_name,
            ROUND(inv.current_stock * hi.unit_cost, 2) AS stock_value
     FROM   inventory inv
     JOIN   hardware_items hi ON hi.item_id = inv.item_id
     JOIN   hardware_categories hc ON hc.category_id = hi.category_id
     WHERE  ${where}
     ORDER  BY inv.risk_level DESC, hi.item_name
     LIMIT  ? OFFSET ?`,
    [...params, lim, offset],
  );
  return { total, rows };
}

// ── getInventoryItem ──────────────────────────────────────────
async function getInventoryItem(inventoryId) {
  const [rows] = await db.query(
    `SELECT inv.*, inv.estimated_days_remaining AS days_remaining,
            hi.item_code, hi.item_name, hi.brand, hi.model,
            hi.unit_cost, hi.safety_stock, hi.lead_time_days, hi.unit_of_measure,
            hc.category_id, hc.category_name,
            ROUND(inv.current_stock * hi.unit_cost, 2) AS stock_value
     FROM   inventory inv
     JOIN   hardware_items hi ON hi.item_id = inv.item_id
     JOIN   hardware_categories hc ON hc.category_id = hi.category_id
     WHERE  inv.inventory_id = ?`,
    [inventoryId],
  );
  if (!rows.length) throw new AppError('Inventory record not found.', 404);
  return rows[0];
}

// ── recalculate ───────────────────────────────────────────────
async function recalculate(inventoryId) {
  // Load item + current inventory
  const [invRows] = await db.query(
    `SELECT inv.inventory_id, inv.item_id, inv.current_stock,
            hi.safety_stock, hi.lead_time_days
     FROM   inventory inv JOIN hardware_items hi ON hi.item_id = inv.item_id
     WHERE  inv.inventory_id = ?`,
    [inventoryId],
  );
  if (!invRows.length) throw new AppError('Inventory record not found.', 404);
  const inv = invRows[0];

  // Load ADC window
  const [[settingRow]] = await db.query(
    `SELECT setting_value FROM system_settings WHERE setting_key = 'adc_window_days'`,
  );
  const windowDays = parseInt(settingRow?.setting_value ?? '90', 10);

  // Sum OUT transactions in the window
  const [[txnRow]] = await db.query(
    `SELECT COALESCE(SUM(ABS(quantity)), 0) AS total_out
     FROM   inventory_transactions
     WHERE  inventory_id = ?
       AND  txn_type = 'OUT'
       AND  txn_date >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [inventoryId, windowDays],
  );
  const totalOut = parseFloat(txnRow.total_out) || 0;
  const adc      = totalOut / windowDays;

  const rop          = adc > 0 ? adc * inv.lead_time_days + inv.safety_stock : inv.safety_stock;
  const edr          = adc > 0 ? inv.current_stock / adc : null;
  const currentStock = inv.current_stock;

  let riskLevel;
  if (currentStock === 0 || currentStock <= rop) {
    riskLevel = 'CRITICAL';
  } else if (edr !== null && edr <= inv.lead_time_days) {
    riskLevel = 'WARNING';
  } else {
    riskLevel = 'NORMAL';
  }

  await db.query(
    `UPDATE inventory
     SET    avg_daily_consumption = ?, reorder_point = ?,
            estimated_days_remaining = ?, risk_level = ?, last_calculated_at = NOW()
     WHERE  inventory_id = ?`,
    [adc.toFixed(4), rop.toFixed(4), edr !== null ? edr.toFixed(2) : null, riskLevel, inventoryId],
  );

  return getInventoryItem(inventoryId);
}

// ── listTransactions ──────────────────────────────────────────
async function listTransactions(inventoryId, { page, limit }) {
  const { offset, limit: lim } = paginate(page, limit);
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM inventory_transactions WHERE inventory_id = ?`, [inventoryId],
  );
  const [rows] = await db.query(
    `SELECT t.*, u.full_name AS performed_by
     FROM   inventory_transactions t
     JOIN   users u ON u.user_id = t.performed_by_id
     WHERE  t.inventory_id = ?
     ORDER  BY t.txn_date DESC LIMIT ? OFFSET ?`,
    [inventoryId, lim, offset],
  );
  return { total, rows };
}

// ── recordTransaction ─────────────────────────────────────────
async function recordTransaction(inventoryId, { txnType, transactionType, quantity, newStock, referenceType, referenceId, notes }, performedById) {
  const type = String(txnType || transactionType || '').toUpperCase();
  const validTypes = ['IN', 'OUT', 'ADJUSTMENT', 'RETURN'];
  if (!validTypes.includes(type)) throw new AppError(`Invalid txn_type. Must be one of: ${validTypes.join(', ')}`, 400);

  // Load current stock
  const [invRows] = await db.query('SELECT current_stock FROM inventory WHERE inventory_id = ?', [inventoryId]);
  if (!invRows.length) throw new AppError('Inventory record not found.', 404);
  const currentStock = invRows[0].current_stock;

  let signedQty = 0;
  if (type === 'IN' || type === 'RETURN') {
    signedQty = Math.abs(parseInt(quantity, 10) || 0);
  } else if (type === 'OUT') {
    signedQty = -Math.abs(parseInt(quantity, 10) || 0);
  } else if (type === 'ADJUSTMENT') {
    if (newStock !== undefined && newStock !== null && newStock !== '') {
      signedQty = parseInt(newStock, 10) - currentStock;
    } else {
      signedQty = parseInt(quantity, 10) || 0;
    }
  }

  if (signedQty === 0 && type !== 'ADJUSTMENT') {
    throw new AppError('Transaction quantity must not be zero.', 400);
  }

  return db.transaction(async (conn) => {
    await conn.execute(
      `INSERT INTO inventory_transactions
         (inventory_id, txn_type, quantity, reference_type, reference_id, performed_by_id, txn_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [inventoryId, type, signedQty, referenceType || 'MANUAL', referenceId || null, performedById, notes || null],
    );

    // Update current stock
    await conn.execute(
      `UPDATE inventory SET current_stock = GREATEST(0, current_stock + ?) WHERE inventory_id = ?`,
      [signedQty, inventoryId],
    );
    return null;
  });
}

// ── Hardware catalog helpers ───────────────────────────────────
async function listHardwareItems({ page, limit, categoryId, isActive }) {
  const { offset, limit: lim } = paginate(page, limit);
  const conditions = [];
  const params     = [];
  if (categoryId !== undefined) { conditions.push('hi.category_id = ?'); params.push(categoryId); }
  if (isActive   !== undefined) { conditions.push('hi.is_active = ?');   params.push(isActive === 'true' || isActive === '1' ? 1 : 0); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM hardware_items hi ${where}`, params);
  const [rows] = await db.query(
    `SELECT hi.*, hc.category_name FROM hardware_items hi
     JOIN hardware_categories hc ON hc.category_id = hi.category_id
     ${where} ORDER BY hi.item_name LIMIT ? OFFSET ?`,
    [...params, lim, offset],
  );
  return { total, rows };
}

async function listCategories() {
  const [rows] = await db.query(`SELECT * FROM hardware_categories ORDER BY category_name`);
  return rows;
}

module.exports = {
  listInventory, getInventoryItem, recalculate,
  listTransactions, recordTransaction,
  listHardwareItems, listCategories,
};
