'use strict';

// =============================================================
// VPPT — src/modules/vendors/vendors.service.js
// Vendor management and performance scoring.
//
// Score calculation formula (weights from system_settings):
//   overall = sla_score × w_sla
//           + delivery_score × w_delivery
//           + quality_score × w_quality
//           + return_score × w_return
//
// Tier thresholds:
//   >= 90  → Platinum
//   >= 75  → Gold
//   >= 60  → Silver
//   <  60  → Probation
// =============================================================

const db = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

function paginate(page, limit) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { offset: (p - 1) * l, limit: l, page: p };
}

function scoreTier(overall) {
  if (overall >= 90) return 'Platinum';
  if (overall >= 75) return 'Gold';
  if (overall >= 60) return 'Silver';
  return 'Probation';
}

// ── getScoreWeights ───────────────────────────────────────────
async function getScoreWeights() {
  const [rows] = await db.query(
    `SELECT setting_value FROM system_settings WHERE setting_key = 'vendor_score_weights'`,
  );
  const raw = rows[0]?.setting_value ?? '{}';
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

// ── listVendors ───────────────────────────────────────────────
async function listVendors({ page, limit, status, tier, search }) {
  const { offset, limit: lim } = paginate(page, limit);
  const conditions = ['v.deleted_at IS NULL'];
  const params     = [];

  if (status) { conditions.push('v.status = ?'); params.push(status); }
  if (tier)   { conditions.push('v.tier = ?');   params.push(tier); }
  if (search) {
    conditions.push('(v.vendor_name LIKE ? OR v.vendor_code LIKE ? OR v.contact_person LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  const where = conditions.join(' AND ');
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM vendors v WHERE ${where}`, params,
  );

  const [rows] = await db.query(
    `SELECT v.vendor_id, v.vendor_name, v.vendor_code, v.contact_person,
            v.email, v.phone, v.status, v.tier, v.overall_score, v.created_at,
            vps.snapshot_date, vps.sla_score, vps.delivery_score,
            vps.quality_score, vps.return_score, vps.po_count
     FROM   vendors v
     LEFT JOIN vendor_performance_snapshots vps
       ON vps.snapshot_id = (
         SELECT snapshot_id FROM vendor_performance_snapshots
         WHERE vendor_id = v.vendor_id ORDER BY snapshot_date DESC LIMIT 1
       )
     WHERE  ${where}
     ORDER  BY v.vendor_name
     LIMIT  ? OFFSET ?`,
    [...params, lim, offset],
  );
  return { total, rows };
}

// ── getVendor ─────────────────────────────────────────────────
async function getVendor(vendorId) {
  const [rows] = await db.query(
    `SELECT v.*, vps.snapshot_id, vps.snapshot_date,
            vps.sla_score, vps.delivery_score, vps.quality_score, vps.return_score,
            vps.overall_score AS snap_score, vps.tier AS snap_tier,
            vps.weight_sla, vps.weight_delivery, vps.weight_quality, vps.weight_return,
            vps.po_count
     FROM   vendors v
     LEFT JOIN vendor_performance_snapshots vps
       ON vps.snapshot_id = (
         SELECT snapshot_id FROM vendor_performance_snapshots
         WHERE vendor_id = v.vendor_id ORDER BY snapshot_date DESC LIMIT 1
       )
     WHERE  v.vendor_id = ? AND v.deleted_at IS NULL`,
    [vendorId],
  );
  if (!rows.length) throw new AppError('Vendor not found.', 404);
  return rows[0];
}

// ── createVendor ──────────────────────────────────────────────
async function createVendor(data) {
  const { vendorName, vendorCode, contactPerson, email, phone, address, status } = data;
  const [result] = await db.query(
    `INSERT INTO vendors (vendor_name, vendor_code, contact_person, email, phone, address, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [vendorName, vendorCode, contactPerson || null, email || null,
     phone || null, address || null, status || 'active'],
  );
  return getVendor(result.insertId);
}

// ── updateVendor ──────────────────────────────────────────────
async function updateVendor(vendorId, data) {
  const allowed = ['vendor_name', 'vendor_code', 'contact_person', 'email', 'phone', 'address', 'status'];
  const setClauses = [];
  const params     = [];
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k)) { setClauses.push(`${k} = ?`); params.push(v); }
  }
  if (!setClauses.length) throw new AppError('No valid fields provided.', 400);
  params.push(vendorId);
  await db.query(
    `UPDATE vendors SET ${setClauses.join(', ')} WHERE vendor_id = ? AND deleted_at IS NULL`,
    params,
  );
  return getVendor(vendorId);
}

// ── deleteVendor ──────────────────────────────────────────────
async function deleteVendor(vendorId) {
  const [result] = await db.query(
    `UPDATE vendors SET deleted_at = NOW(), status = 'inactive'
     WHERE vendor_id = ? AND deleted_at IS NULL`,
    [vendorId],
  );
  if (!result.affectedRows) throw new AppError('Vendor not found.', 404);
}

// ── listSnapshots ─────────────────────────────────────────────
async function listSnapshots(vendorId, { page, limit }) {
  const { offset, limit: lim } = paginate(page, limit);
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM vendor_performance_snapshots WHERE vendor_id = ?`, [vendorId],
  );
  const [rows] = await db.query(
    `SELECT * FROM vendor_performance_snapshots WHERE vendor_id = ?
     ORDER BY snapshot_date DESC LIMIT ? OFFSET ?`,
    [vendorId, lim, offset],
  );
  return { total, rows };
}

// ── calculateSnapshot ─────────────────────────────────────────
/**
 * Recalculates vendor performance scores using the last N months of
 * completed PO data, inserts a new snapshot, and updates vendors.overall_score.
 */
async function calculateSnapshot(vendorId) {
  const weights = await getScoreWeights();

  // Determine window
  const [windowRows] = await db.query(
    `SELECT setting_value FROM system_settings WHERE setting_key = 'vendor_score_window_months'`,
  );
  const windowMonths = parseInt(windowRows[0]?.setting_value ?? '12', 10);

  // SLA compliance score
  const [slaRows] = await db.query(
    `SELECT
       COUNT(*) AS total,
       SUM(del.is_on_time) AS on_time
     FROM deliveries del
     JOIN purchase_orders po ON po.po_id = del.po_id
     WHERE po.vendor_id = ?
       AND po.status = 'completed'
       AND po.completed_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)`,
    [vendorId, windowMonths],
  );
  const slaTotal  = slaRows[0].total || 0;
  const slaScore  = slaTotal > 0 ? Math.min(100, (slaRows[0].on_time / slaTotal) * 100) : 100;
  const deliveryScore = slaScore; // Delivery on-time === SLA in this model

  // Quality score (inverted defect rate)
  const [qualRows] = await db.query(
    `SELECT SUM(qi.total_units_checked) AS checked, SUM(qi.units_rejected) AS rejected
     FROM quality_inspections qi
     JOIN purchase_orders po ON po.po_id = qi.po_id
     WHERE po.vendor_id = ?
       AND po.completed_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)`,
    [vendorId, windowMonths],
  );
  const checked     = qualRows[0].checked || 0;
  const defectRate  = checked > 0 ? (qualRows[0].rejected / checked) * 100 : 0;
  const qualityScore = Math.max(0, 100 - defectRate * 10); // 1% defect → -10 pts

  // Return rate score
  const [retRows] = await db.query(
    `SELECT SUM(r.quantity_returned) AS returned, SUM(poi.quantity_ordered) AS ordered
     FROM returns r
     JOIN purchase_orders po ON po.po_id = r.po_id
     JOIN purchase_order_items poi ON poi.po_id = po.po_id AND poi.item_id = r.item_id
     WHERE po.vendor_id = ?
       AND po.completed_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)`,
    [vendorId, windowMonths],
  );
  const ordered    = retRows[0].ordered || 0;
  const returnRate = ordered > 0 ? (retRows[0].returned / ordered) * 100 : 0;
  const returnScore = Math.max(0, 100 - returnRate * 20); // 1% return → -20 pts

  // PO count
  const [[poRow]] = await db.query(
    `SELECT COUNT(*) AS cnt FROM purchase_orders
     WHERE vendor_id = ? AND status = 'completed'
       AND completed_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)`,
    [vendorId, windowMonths],
  );
  const poCount = poRow.cnt;

  // Weighted overall
  const overall = (
    slaScore      * (weights.sla      || 0.40) +
    deliveryScore * (weights.delivery || 0.30) +
    qualityScore  * (weights.quality  || 0.20) +
    returnScore   * (weights.return   || 0.10)
  );
  const tier = scoreTier(overall);
  const today = new Date().toISOString().slice(0, 10);

  return db.transaction(async (conn) => {
    // Upsert snapshot (vendor_id + snapshot_date unique)
    await conn.execute(
      `INSERT INTO vendor_performance_snapshots
         (vendor_id, snapshot_date, sla_score, delivery_score, quality_score, return_score,
          overall_score, tier, weight_sla, weight_delivery, weight_quality, weight_return, po_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         sla_score=VALUES(sla_score), delivery_score=VALUES(delivery_score),
         quality_score=VALUES(quality_score), return_score=VALUES(return_score),
         overall_score=VALUES(overall_score), tier=VALUES(tier), po_count=VALUES(po_count)`,
      [vendorId, today,
       slaScore.toFixed(2), deliveryScore.toFixed(2), qualityScore.toFixed(2), returnScore.toFixed(2),
       overall.toFixed(2), tier,
       weights.sla || 0.40, weights.delivery || 0.30, weights.quality || 0.20, weights.return || 0.10,
       poCount],
    );
    // Update cached values on vendor row
    await conn.execute(
      `UPDATE vendors SET overall_score = ?, tier = ? WHERE vendor_id = ?`,
      [overall.toFixed(2), tier, vendorId],
    );
    return { slaScore, deliveryScore, qualityScore, returnScore, overall, tier, poCount };
  });
}

// ── SLA contracts ─────────────────────────────────────────────
async function getCurrentSLA(vendorId) {
  const [rows] = await db.query(
    `SELECT * FROM vendor_sla_contracts
     WHERE vendor_id = ? AND is_current = 1
     ORDER BY created_at DESC LIMIT 1`,
    [vendorId],
  );
  if (!rows.length) throw new AppError('No active SLA contract found for this vendor.', 404);
  return rows[0];
}

async function createSLA(vendorId, data) {
  return db.transaction(async (conn) => {
    // Deactivate existing
    await conn.execute(
      `UPDATE vendor_sla_contracts SET is_current = 0 WHERE vendor_id = ?`,
      [vendorId],
    );
    // Insert new
    const [result] = await conn.execute(
      `INSERT INTO vendor_sla_contracts
         (vendor_id, delivery_lead_time_days, sla_compliance_target_pct,
          quality_threshold_pct, max_return_rate_pct, contract_start_date, contract_end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vendorId,
       data.deliveryLeadTimeDays ?? 14,
       data.slaComplianceTargetPct ?? 95.00,
       data.qualityThresholdPct ?? 98.00,
       data.maxReturnRatePct ?? 2.00,
       data.contractStartDate,
       data.contractEndDate || null],
    );
    const [[contract]] = await conn.execute(
      `SELECT * FROM vendor_sla_contracts WHERE contract_id = ?`, [result.insertId],
    );
    return contract;
  });
}

module.exports = {
  listVendors, getVendor, createVendor, updateVendor, deleteVendor,
  listSnapshots, calculateSnapshot, getCurrentSLA, createSLA,
};
