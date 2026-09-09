'use strict';

// =============================================================
// VPPT — src/modules/analytics/analytics.service.js
// Read-only queries against the analytical database views and
// aggregated KPI computation.
// =============================================================

const db = require('../../config/database');

// ── vendorScorecards ──────────────────────────────────────────
async function vendorScorecards({ vendorId, tier, status } = {}) {
  const conditions = [];
  const params     = [];
  if (vendorId) { conditions.push('vendor_id = ?');    params.push(vendorId); }
  if (tier)     { conditions.push('tier = ?');          params.push(tier); }
  if (status)   { conditions.push('vendor_status = ?'); params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT * FROM v_vendor_latest_snapshot ${where} ORDER BY overall_score DESC`, params,
  );
  return rows;
}

// ── deliveryPerformance ───────────────────────────────────────
async function deliveryPerformance({ vendorId, departmentId, dateFrom, dateTo } = {}) {
  const conditions = [];
  const params     = [];
  if (vendorId)     { conditions.push('vendor_id = ?');      params.push(vendorId); }
  if (departmentId) { conditions.push('department_id = ?');  params.push(departmentId); }
  if (dateFrom)     { conditions.push('actual_date >= ?');   params.push(dateFrom); }
  if (dateTo)       { conditions.push('actual_date <= ?');   params.push(dateTo); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT * FROM v_delivery_performance ${where} ORDER BY actual_date DESC`, params,
  );

  // Compute summary
  const total    = rows.length;
  const onTime   = rows.filter((r) => r.is_on_time).length;
  const onTimePct = total > 0 ? Math.round((onTime / total) * 100 * 100) / 100 : 0;

  return { summary: { total, onTime, late: total - onTime, onTimePct }, rows };
}

// ── defectHeatmap ─────────────────────────────────────────────
async function defectHeatmap({ vendorId, categoryId } = {}) {
  const conditions = [];
  const params     = [];
  if (vendorId)   { conditions.push('vendor_id = ?');    params.push(vendorId); }
  if (categoryId) { conditions.push('category_id = ?');  params.push(categoryId); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT * FROM v_defect_heatmap ${where} ORDER BY defect_rate_pct DESC`, params,
  );
  return rows;
}

// ── poCycleTime ───────────────────────────────────────────────
async function poCycleTime({ vendorId, departmentId, dateFrom, dateTo } = {}) {
  const conditions = [];
  const params     = [];
  if (vendorId)     { conditions.push('vendor_id = ?');          params.push(vendorId); }
  if (departmentId) { conditions.push('department_id = ?');      params.push(departmentId); }
  if (dateFrom)     { conditions.push('po_created_at >= ?');     params.push(dateFrom); }
  if (dateTo)       { conditions.push('completed_at <= ?');      params.push(dateTo); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT * FROM v_po_cycle_time ${where} ORDER BY total_cycle_days DESC`, params,
  );

  const total = rows.length;
  const avgDays = total > 0
    ? Math.round(rows.reduce((s, r) => s + parseFloat(r.total_cycle_days), 0) / total * 100) / 100
    : 0;

  return { summary: { total, avgCycleDays: avgDays }, rows };
}

// ── bottleneck ────────────────────────────────────────────────
async function bottleneck() {
  const [rows] = await db.query(
    `SELECT * FROM v_bottleneck_summary ORDER BY avg_duration_hours DESC`,
  );
  return rows;
}

// ── inventoryStatus ───────────────────────────────────────────
async function inventoryStatus({ riskLevel, categoryId } = {}) {
  const conditions = [];
  const params     = [];
  if (riskLevel)  { conditions.push('risk_level = ?');    params.push(riskLevel); }
  if (categoryId) { conditions.push('category_id = ?');   params.push(categoryId); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT * FROM v_inventory_status ${where} ORDER BY risk_level DESC, days_remaining ASC`,
    params,
  );
  return rows;
}

// ── budgetUtilization ─────────────────────────────────────────
async function budgetUtilization({ departmentId, fiscalYear } = {}) {
  const conditions = [];
  const params     = [];
  if (departmentId) { conditions.push('department_id = ?'); params.push(departmentId); }
  if (fiscalYear)   { conditions.push('fiscal_year = ?');   params.push(fiscalYear); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT * FROM v_budget_utilization ${where} ORDER BY utilization_pct DESC`, params,
  );
  return rows;
}

// ── procurementPipeline ───────────────────────────────────────
async function procurementPipeline({ departmentId, prStatus, poStatus } = {}) {
  const conditions = [];
  const params     = [];
  if (departmentId) { conditions.push('department_id = ?'); params.push(departmentId); }
  if (prStatus)     { conditions.push('pr_status = ?');     params.push(prStatus); }
  if (poStatus)     { conditions.push('po_status = ?');     params.push(poStatus); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT * FROM v_procurement_pipeline ${where} ORDER BY pr_created_at DESC`, params,
  );
  return rows;
}

// ── kpis ──────────────────────────────────────────────────────
async function kpis() {
  const [[openPRs]] = await db.query(
    `SELECT COUNT(*) AS count FROM purchase_requisitions
     WHERE status NOT IN ('cancelled','converted_to_po','rejected')`,
  );
  const [[criticalStock]] = await db.query(
    `SELECT COUNT(*) AS count FROM inventory WHERE risk_level = 'CRITICAL'`,
  );
  const [[cycleTime]] = await db.query(
    `SELECT ROUND(AVG(total_cycle_days), 1) AS avg_days FROM v_po_cycle_time`,
  );
  const [[budgetUtil]] = await db.query(
    `SELECT ROUND(AVG(utilization_pct), 1) AS avg_pct FROM v_budget_utilization WHERE status = 'active'`,
  );
  const [[deliveryRate]] = await db.query(
    `SELECT ROUND(SUM(is_on_time) / NULLIF(COUNT(*), 0) * 100, 1) AS pct
     FROM deliveries WHERE actual_date IS NOT NULL`,
  );
  const [[openPOs]] = await db.query(
    `SELECT COUNT(*) AS count FROM purchase_orders
     WHERE status NOT IN ('completed','cancelled')`,
  );
  const [[alerts]] = await db.query(
    `SELECT COUNT(*) AS count FROM alerts WHERE is_read = 0 AND resolved_at IS NULL`,
  );
  const [[totalVendors]] = await db.query(
    `SELECT COUNT(*) AS count FROM vendors WHERE deleted_at IS NULL`,
  );
  const [[activeVendors]] = await db.query(
    `SELECT COUNT(*) AS count FROM vendors WHERE status = 'active' AND deleted_at IS NULL`,
  );

  return {
    openPRs:           openPRs.count,
    openPOs:           openPOs.count,
    criticalStockItems: criticalStock.count,
    avgCycleDays:      cycleTime.avg_days,
    avgBudgetUtilPct:  budgetUtil.avg_pct,
    onTimeDeliveryPct: deliveryRate.pct,
    unresolvedAlerts:  alerts.count,
    totalVendors:      totalVendors.count,
    activeVendors:     activeVendors.count,
  };
}

// ── alerts ────────────────────────────────────────────────────
async function listAlerts({ severity, alertType, isRead, limit, page } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (p - 1) * lim;

  const conditions = ['resolved_at IS NULL'];
  const params     = [];
  if (severity)  { conditions.push('severity = ?');    params.push(severity); }
  if (alertType) { conditions.push('alert_type = ?');  params.push(alertType); }
  if (isRead !== undefined) {
    conditions.push('is_read = ?');
    params.push(isRead === 'true' || isRead === '1' || isRead === true ? 1 : 0);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM alerts ${where}`, params,
  );
  const [rows] = await db.query(
    `SELECT * FROM alerts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, lim, offset],
  );
  return { total, rows };
}

async function markAlertRead(alertId, userId) {
  await db.query(
    `UPDATE alerts SET is_read = 1, read_by_id = ?, read_at = NOW()
     WHERE alert_id = ?`,
    [userId, alertId],
  );
}

module.exports = {
  vendorScorecards, deliveryPerformance, defectHeatmap,
  poCycleTime, bottleneck, inventoryStatus, budgetUtilization,
  procurementPipeline, kpis, listAlerts, markAlertRead,
};
