'use strict';

// =============================================================
// VPPT — src/modules/procurement/procurement.service.js
// Full PR/PO lifecycle management with stage logging.
//
// PR status flow:  draft → under_review → dept_approved
//                  → procurement_approved → converted_to_po
//                                        → rejected | cancelled
//
// PO status flow:  pending → acknowledged → processing
//                  → shipped → delivered → inspected → completed
//                                                    → cancelled
//
// Stage log names (procurement_stage_logs.stage_name):
//   PO_CREATED, VENDOR_ACKNOWLEDGED, ORDER_PROCESSING,
//   SHIPPED, DELIVERED, INSPECTION_COMPLETED, COMPLETED
//
// Number format: PR-YYYY-NNNN / PO-YYYY-NNNN
//   Generated via MAX+1 inside a transaction for uniqueness.
// =============================================================

const db = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

function paginate(page, limit) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { offset: (p - 1) * l, limit: l, page: p };
}

// ── Number generators ─────────────────────────────────────────
async function generatePRNumber(conn) {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;
  const [[row]] = await conn.execute(
    `SELECT MAX(CAST(SUBSTRING(pr_number, 9) AS UNSIGNED)) AS max_seq
     FROM purchase_requisitions WHERE pr_number LIKE ?`,
    [`${prefix}%`],
  );
  const seq = (row.max_seq || 0) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

async function generatePONumber(conn) {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  const [[row]] = await conn.execute(
    `SELECT MAX(CAST(SUBSTRING(po_number, 9) AS UNSIGNED)) AS max_seq
     FROM purchase_orders WHERE po_number LIKE ?`,
    [`${prefix}%`],
  );
  const seq = (row.max_seq || 0) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// ── PR stage → timestamp column mapping ───────────────────────
const PR_STATUS_TIMESTAMPS = {
  under_review:          'pr_reviewed_at',
  dept_approved:         'department_approved_at',
  procurement_approved:  'procurement_approved_at',
};

const PR_STATUS_USER_COLS = {
  under_review:          'reviewed_by_id',
  dept_approved:         'dept_approved_by_id',
  procurement_approved:  'proc_approved_by_id',
};

// ── PO status → timestamp column + stage log name ─────────────
const PO_STATUS_META = {
  acknowledged: { tsCol: 'vendor_acknowledged_at',   stageName: 'VENDOR_ACKNOWLEDGED' },
  processing:   { tsCol: 'order_processing_at',       stageName: 'ORDER_PROCESSING' },
  shipped:      { tsCol: 'shipped_at',                stageName: 'SHIPPED' },
  delivered:    { tsCol: 'delivered_at',              stageName: 'DELIVERED' },
  inspected:    { tsCol: 'inspection_completed_at',   stageName: 'INSPECTION_COMPLETED' },
  completed:    { tsCol: 'completed_at',              stageName: 'COMPLETED' },
};

// ── PR functions ──────────────────────────────────────────────
async function listPRs({ page, limit, status, departmentId, priority }) {
  const { offset, limit: lim } = paginate(page, limit);
  const conditions = [];
  const params     = [];
  if (status)       { conditions.push('pr.status = ?');        params.push(status); }
  if (departmentId) { conditions.push('pr.department_id = ?'); params.push(departmentId); }
  if (priority)     { conditions.push('pr.priority = ?');      params.push(priority); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM purchase_requisitions pr ${where}`, params,
  );
  const [rows] = await db.query(
    `SELECT pr.pr_id, pr.pr_number, pr.status, pr.priority,
            pr.total_estimated_cost, pr.pr_created_at,
            d.dept_name, u.full_name AS requested_by
     FROM   purchase_requisitions pr
     JOIN   departments d ON d.department_id = pr.department_id
     JOIN   users u ON u.user_id = pr.requested_by_id
     ${where}
     ORDER  BY pr.pr_created_at DESC LIMIT ? OFFSET ?`,
    [...params, lim, offset],
  );
  return { total, rows };
}

async function getPR(prId) {
  const [rows] = await db.query(
    `SELECT pr.*,
            d.dept_name, u.full_name AS requested_by_name
     FROM   purchase_requisitions pr
     JOIN   departments d ON d.department_id = pr.department_id
     JOIN   users u ON u.user_id = pr.requested_by_id
     WHERE  pr.pr_id = ?`,
    [prId],
  );
  if (!rows.length) throw new AppError('Requisition not found.', 404);
  const [items] = await db.query(
    `SELECT pri.*, hi.item_name, hi.item_code, hi.unit_cost
     FROM   purchase_requisition_items pri
     JOIN   hardware_items hi ON hi.item_id = pri.item_id
     WHERE  pri.pr_id = ?`,
    [prId],
  );
  return { ...rows[0], items };
}

async function createPR({ requestedById, departmentId, priority, notes, items }) {
  return db.transaction(async (conn) => {
    const prNumber = await generatePRNumber(conn);
    const totalEstimated = items.reduce(
      (s, i) => s + (i.quantityRequested * (i.estimatedUnitCost || 0)), 0,
    );

    const [result] = await conn.execute(
      `INSERT INTO purchase_requisitions
         (pr_number, requested_by_id, department_id, priority, status,
          total_estimated_cost, pr_created_at, notes)
       VALUES (?, ?, ?, ?, 'draft', ?, NOW(), ?)`,
      [prNumber, requestedById, departmentId, priority || 'normal',
       totalEstimated || null, notes || null],
    );
    const prId = result.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO purchase_requisition_items
           (pr_id, item_id, quantity_requested, estimated_unit_cost, justification)
         VALUES (?, ?, ?, ?, ?)`,
        [prId, item.itemId, item.quantityRequested,
         item.estimatedUnitCost || null, item.justification || null],
      );
    }
    return prId;
  }).then(getPR);
}

async function advancePRStatus(prId, newStatus, userId, { reason } = {}) {
  const [rows] = await db.query(
    `SELECT status FROM purchase_requisitions WHERE pr_id = ?`, [prId],
  );
  if (!rows.length) throw new AppError('Requisition not found.', 404);

  const tsCol   = PR_STATUS_TIMESTAMPS[newStatus];
  const userCol = PR_STATUS_USER_COLS[newStatus];

  const setClauses = ['status = ?'];
  const params     = [newStatus];

  if (tsCol)   { setClauses.push(`${tsCol} = NOW()`); }
  if (userCol) { setClauses.push(`${userCol} = ?`);   params.push(userId); }
  if (newStatus === 'rejected' && reason) {
    setClauses.push('rejection_reason = ?');
    params.push(reason);
  }
  params.push(prId);

  await db.query(
    `UPDATE purchase_requisitions SET ${setClauses.join(', ')} WHERE pr_id = ?`, params,
  );
  return getPR(prId);
}

// ── PO functions ──────────────────────────────────────────────
async function listPOs({ page, limit, status, vendorId, departmentId }) {
  const { offset, limit: lim } = paginate(page, limit);
  const conditions = [];
  const params     = [];
  if (status)       { conditions.push('po.status = ?');        params.push(status); }
  if (vendorId)     { conditions.push('po.vendor_id = ?');     params.push(vendorId); }
  if (departmentId) { conditions.push('po.department_id = ?'); params.push(departmentId); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM purchase_orders po ${where}`, params,
  );
  const [rows] = await db.query(
    `SELECT po.po_id, po.po_number, po.status, po.total_amount,
            po.po_created_at, po.completed_at, po.expected_delivery_date,
            v.vendor_name, d.dept_name
     FROM   purchase_orders po
     JOIN   vendors v ON v.vendor_id = po.vendor_id
     JOIN   departments d ON d.department_id = po.department_id
     ${where}
     ORDER  BY po.po_created_at DESC LIMIT ? OFFSET ?`,
    [...params, lim, offset],
  );
  return { total, rows };
}

async function getPO(poId) {
  const [rows] = await db.query(
    `SELECT po.*, v.vendor_name, d.dept_name, u.full_name AS created_by_name
     FROM   purchase_orders po
     JOIN   vendors v ON v.vendor_id = po.vendor_id
     JOIN   departments d ON d.department_id = po.department_id
     JOIN   users u ON u.user_id = po.created_by_id
     WHERE  po.po_id = ?`,
    [poId],
  );
  if (!rows.length) throw new AppError('Purchase order not found.', 404);

  const [items] = await db.query(
    `SELECT poi.*, hi.item_name, hi.item_code
     FROM   purchase_order_items poi JOIN hardware_items hi ON hi.item_id = poi.item_id
     WHERE  poi.po_id = ?`, [poId],
  );
  const [stages] = await db.query(
    `SELECT * FROM procurement_stage_logs WHERE po_id = ? ORDER BY entered_at`, [poId],
  );
  const [delivery] = await db.query(
    `SELECT delivery_id, po_id, courier, tracking_number, is_on_time,
            DATE_FORMAT(expected_date, '%Y-%m-%d') AS expected_date,
            DATE_FORMAT(actual_date, '%Y-%m-%d') AS actual_date,
            received_by_id, created_at, updated_at
     FROM deliveries WHERE po_id = ?`, [poId],
  );
  const [inspection] = await db.query(
    `SELECT * FROM quality_inspections WHERE po_id = ?`, [poId],
  );

  return { ...rows[0], items, stages, delivery: delivery[0] || null, inspection: inspection[0] || null };
}

async function createPO({ prId, vendorId, departmentId, createdById, items, notes }) {
  // Get vendor lead time for expected delivery date
  const [slaRows] = await db.query(
    `SELECT delivery_lead_time_days FROM vendor_sla_contracts
     WHERE vendor_id = ? AND is_current = 1`, [vendorId],
  );
  const leadDays = slaRows[0]?.delivery_lead_time_days ?? 14;

  return db.transaction(async (conn) => {
    const poNumber = await generatePONumber(conn);
    const totalAmount = items.reduce((s, i) => s + i.quantityOrdered * i.unitPrice, 0);

    const [result] = await conn.execute(
      `INSERT INTO purchase_orders
         (po_number, pr_id, vendor_id, department_id, created_by_id, status,
          total_amount, po_created_at, expected_delivery_date, notes)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW(),
               DATE_ADD(CURDATE(), INTERVAL ? DAY), ?)`,
      [poNumber, prId || null, vendorId, departmentId, createdById,
       totalAmount.toFixed(2), leadDays, notes || null],
    );
    const poId = result.insertId;

    for (const item of items) {
      const totalPrice = item.quantityOrdered * item.unitPrice;
      await conn.execute(
        `INSERT INTO purchase_order_items (po_id, item_id, quantity_ordered, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [poId, item.itemId, item.quantityOrdered, item.unitPrice.toFixed(2), totalPrice.toFixed(2)],
      );
    }

    // Log PO_CREATED stage
    await conn.execute(
      `INSERT INTO procurement_stage_logs (po_id, stage_name, entered_at, performed_by_id)
       VALUES (?, 'PO_CREATED', NOW(), ?)`,
      [poId, createdById],
    );

    // Mark PR as converted if linked
    if (prId) {
      await conn.execute(
        `UPDATE purchase_requisitions SET status = 'converted_to_po' WHERE pr_id = ?`, [prId],
      );
    }

    return poId;
  }).then(getPO);
}

async function advancePOStatus(poId, newStatus, userId, notes) {
  const meta = PO_STATUS_META[newStatus];
  if (!meta && newStatus !== 'cancelled') {
    throw new AppError(`Invalid status: ${newStatus}`, 400);
  }

  return db.transaction(async (conn) => {
    const [[po]] = await conn.execute(
      `SELECT status FROM purchase_orders WHERE po_id = ?`, [poId],
    );
    if (!po) throw new AppError('Purchase order not found.', 404);

    const now = new Date();

    // Close the current open stage
    const [[openStage]] = await conn.execute(
      `SELECT stage_log_id, entered_at FROM procurement_stage_logs
       WHERE po_id = ? AND exited_at IS NULL ORDER BY entered_at DESC LIMIT 1`,
      [poId],
    );
    if (openStage) {
      const durationHours = (now - new Date(openStage.entered_at)) / 3600000;
      await conn.execute(
        `UPDATE procurement_stage_logs
         SET exited_at = NOW(), duration_hours = ? WHERE stage_log_id = ?`,
        [durationHours.toFixed(2), openStage.stage_log_id],
      );
    }

    // Open new stage (unless cancelling or completing)
    if (meta) {
      await conn.execute(
        `UPDATE purchase_orders SET status = ?, ${meta.tsCol} = NOW() WHERE po_id = ?`,
        [newStatus, poId],
      );
      await conn.execute(
        `INSERT INTO procurement_stage_logs (po_id, stage_name, entered_at, performed_by_id, notes)
         VALUES (?, ?, NOW(), ?, ?)`,
        [poId, meta.stageName, userId, notes || null],
      );
    } else {
      // cancelled
      await conn.execute(
        `UPDATE purchase_orders SET status = 'cancelled' WHERE po_id = ?`, [poId],
      );
    }

    return null;
  }).then(() => getPO(poId));
}

// ── Delivery ──────────────────────────────────────────────────
async function recordDelivery(poId, { actualDate, courier, trackingNumber }, receivedById) {
  const [[po]] = await db.query(
    `SELECT expected_delivery_date FROM purchase_orders WHERE po_id = ?`, [poId],
  );
  if (!po) throw new AppError('Purchase order not found.', 404);

  const isOnTime = po.expected_delivery_date
    ? (new Date(actualDate) <= new Date(po.expected_delivery_date) ? 1 : 0)
    : null;

  const [existing] = await db.query(`SELECT delivery_id FROM deliveries WHERE po_id = ?`, [poId]);
  if (existing.length) {
    await db.query(
      `UPDATE deliveries SET actual_date = ?, is_on_time = ?, courier = ?,
              tracking_number = ?, received_by_id = ? WHERE po_id = ?`,
      [actualDate, isOnTime, courier || null, trackingNumber || null, receivedById, poId],
    );
  } else {
    await db.query(
      `INSERT INTO deliveries (po_id, expected_date, actual_date, is_on_time, courier, tracking_number, received_by_id)
       SELECT po_id, expected_delivery_date, ?, ?, ?, ?, ?
       FROM purchase_orders WHERE po_id = ?`,
      [actualDate, isOnTime, courier || null, trackingNumber || null, receivedById, poId],
    );
  }
  return getPO(poId);
}

// ── Inspection ────────────────────────────────────────────────
async function recordInspection(poId, {
  totalUnitsChecked, unitsPassed, unitsRejected, outcome, notes,
}, inspectedById) {
  const defectRate = totalUnitsChecked > 0
    ? ((unitsRejected / totalUnitsChecked) * 100).toFixed(2)
    : '0.00';

  await db.query(
    `INSERT INTO quality_inspections
       (po_id, inspected_by_id, inspection_date, total_units_checked,
        units_passed, units_rejected, defect_rate_pct, outcome, notes)
     VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       total_units_checked=VALUES(total_units_checked), units_passed=VALUES(units_passed),
       units_rejected=VALUES(units_rejected), defect_rate_pct=VALUES(defect_rate_pct),
       outcome=VALUES(outcome), notes=VALUES(notes)`,
    [poId, inspectedById, totalUnitsChecked, unitsPassed, unitsRejected, defectRate, outcome, notes || null],
  );

  // Update POI rejected quantities
  await db.query(
    `UPDATE purchase_order_items SET quantity_rejected = ?
     WHERE po_id = ?`,
    [unitsRejected, poId],
  );
  return getPO(poId);
}

// ── Returns ───────────────────────────────────────────────────
async function recordReturn(poId, { inspectionId, itemId, quantityReturned, reason, creditReceived }, processedById) {
  await db.query(
    `INSERT INTO returns
       (inspection_id, po_id, item_id, quantity_returned, reason, return_date, processed_by_id, credit_received)
     VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
    [inspectionId, poId, itemId, quantityReturned, reason, processedById, creditReceived ? 1 : 0],
  );
  return getPO(poId);
}

// ── Stage log ─────────────────────────────────────────────────
async function getStages(poId) {
  const [rows] = await db.query(
    `SELECT psl.*, u.full_name AS performed_by
     FROM   procurement_stage_logs psl
     LEFT JOIN users u ON u.user_id = psl.performed_by_id
     WHERE  psl.po_id = ? ORDER BY psl.entered_at`,
    [poId],
  );
  return rows;
}

module.exports = {
  listPRs, getPR, createPR, advancePRStatus,
  listPOs, getPO, createPO, advancePOStatus,
  recordDelivery, recordInspection, recordReturn, getStages,
};
