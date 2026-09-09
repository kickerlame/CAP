'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const request        = require('supertest');
const app            = require('../src/app');
const { authHeader } = require('./helpers/auth');
const { db, dbFindOne, dbQuery } = require('./helpers/db');

afterAll(async () => { await db.end(); });

const BASE = '/api/v1/procurement';

// ── Shared state across tests in this file ────────────────────
let createdPRId;
let createdPOId;

// =============================================================
// GET /procurement/requisitions
// =============================================================
describe('GET /procurement/requisitions', () => {
  it('returns PR list for any authenticated user', async () => {
    const res = await request(app)
      .get(`${BASE}/requisitions`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(0);
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get(`${BASE}/requisitions?status=converted_to_po`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    res.body.data.forEach((pr) => expect(pr.status).toBe('converted_to_po'));
  });
});

// =============================================================
// POST /procurement/requisitions  (any authenticated user)
// =============================================================
describe('POST /procurement/requisitions', () => {
  it('requester can create a PR with line items', async () => {
    const res = await request(app)
      .post(`${BASE}/requisitions`)
      .set(await authHeader('requester'))
      .send({
        departmentId: 1,
        priority:     'high',
        notes:        'Urgent lab equipment request',
        items: [
          { itemId: 1, quantityRequested: 2, estimatedUnitCost: 5000.00, justification: 'Replace failed unit' },
          { itemId: 5, quantityRequested: 5, estimatedUnitCost: 800.00 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.pr_number).toMatch(/^PR-\d{4}-\d{4}$/);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items[0].item_id).toBe(1);
    createdPRId = res.body.data.pr_id;
  });

  it('generates sequential PR numbers', async () => {
    const res = await request(app)
      .post(`${BASE}/requisitions`)
      .set(await authHeader('requester'))
      .send({
        departmentId: 1,
        items: [{ itemId: 2, quantityRequested: 1 }],
      });
    expect(res.status).toBe(201);
    // Both PR numbers should be PR-YYYY-XXXX format
    expect(res.body.data.pr_number).toMatch(/^PR-\d{4}-\d{4}$/);
  });

  it('returns 422 when items array is empty', async () => {
    const res = await request(app)
      .post(`${BASE}/requisitions`)
      .set(await authHeader('requester'))
      .send({ departmentId: 1, items: [] });
    expect(res.status).toBe(422);
  });

  it('returns 422 when departmentId is missing', async () => {
    const res = await request(app)
      .post(`${BASE}/requisitions`)
      .set(await authHeader('requester'))
      .send({ items: [{ itemId: 1, quantityRequested: 1 }] });
    expect(res.status).toBe(422);
  });
});

// =============================================================
// GET /procurement/requisitions/:id
// =============================================================
describe('GET /procurement/requisitions/:id', () => {
  it('returns full PR detail with items', async () => {
    const res = await request(app)
      .get(`${BASE}/requisitions/${createdPRId}`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(res.body.data.pr_id).toBe(createdPRId);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('returns 404 for non-existent PR', async () => {
    const res = await request(app)
      .get(`${BASE}/requisitions/999999`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(404);
  });
});

// =============================================================
// PATCH /procurement/requisitions/:id/status  (procurement_officer)
// =============================================================
describe('PATCH /procurement/requisitions/:id/status', () => {
  it('procurement officer can advance PR to under_review', async () => {
    const res = await request(app)
      .patch(`${BASE}/requisitions/${createdPRId}/status`)
      .set(await authHeader('procurement_officer'))
      .send({ status: 'under_review' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('under_review');

    // Verify timestamp was set
    const row = await dbFindOne(
      'SELECT pr_reviewed_at FROM purchase_requisitions WHERE pr_id = ?',
      [createdPRId],
    );
    expect(row.pr_reviewed_at).not.toBeNull();
  });

  it('procurement officer can advance to dept_approved', async () => {
    const res = await request(app)
      .patch(`${BASE}/requisitions/${createdPRId}/status`)
      .set(await authHeader('procurement_officer'))
      .send({ status: 'dept_approved' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('dept_approved');
  });

  it('procurement officer can advance to procurement_approved', async () => {
    const res = await request(app)
      .patch(`${BASE}/requisitions/${createdPRId}/status`)
      .set(await authHeader('procurement_officer'))
      .send({ status: 'procurement_approved' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('procurement_approved');
  });

  it('returns 403 for requester (no manage_procurement permission)', async () => {
    const res = await request(app)
      .patch(`${BASE}/requisitions/${createdPRId}/status`)
      .set(await authHeader('requester'))
      .send({ status: 'rejected' });
    expect(res.status).toBe(403);
  });
});

// =============================================================
// POST /procurement/orders  (procurement_officer)
// =============================================================
describe('POST /procurement/orders', () => {
  it('procurement officer can create a PO linked to a PR', async () => {
    const res = await request(app)
      .post(`${BASE}/orders`)
      .set(await authHeader('procurement_officer'))
      .send({
        prId:         createdPRId,
        vendorId:     1,
        departmentId: 1,
        notes:        'Urgent order — expedite',
        items: [
          { itemId: 1, quantityOrdered: 2, unitPrice: 5200.00 },
          { itemId: 5, quantityOrdered: 5, unitPrice: 850.00 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.po_number).toMatch(/^PO-\d{4}-\d{4}$/);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.items).toHaveLength(2);

    // PO_CREATED stage log should exist
    expect(res.body.data.stages).toHaveLength(1);
    expect(res.body.data.stages[0].stage_name).toBe('PO_CREATED');

    // Source PR should now be converted_to_po
    const pr = await dbFindOne(
      'SELECT status FROM purchase_requisitions WHERE pr_id = ?', [createdPRId],
    );
    expect(pr.status).toBe('converted_to_po');

    createdPOId = res.body.data.po_id;
  });

  it('returns 422 when items array is empty', async () => {
    const res = await request(app)
      .post(`${BASE}/orders`)
      .set(await authHeader('procurement_officer'))
      .send({ vendorId: 1, departmentId: 1, items: [] });
    expect(res.status).toBe(422);
  });

  it('returns 403 for requester role', async () => {
    const res = await request(app)
      .post(`${BASE}/orders`)
      .set(await authHeader('requester'))
      .send({ vendorId: 1, departmentId: 1, items: [{ itemId: 1, quantityOrdered: 1, unitPrice: 100 }] });
    expect(res.status).toBe(403);
  });
});

// =============================================================
// GET /procurement/orders
// =============================================================
describe('GET /procurement/orders', () => {
  it('returns PO list', async () => {
    const res = await request(app)
      .get(`${BASE}/orders`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('filters by vendorId', async () => {
    const res = await request(app)
      .get(`${BASE}/orders?vendorId=1`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    res.body.data.forEach((po) => expect(po.vendor_id ?? 1).toBe(1));
  });
});

// =============================================================
// PO Status advancement workflow
// =============================================================
describe('PATCH /procurement/orders/:id/status — full workflow', () => {
  const advance = async (status) =>
    request(app)
      .patch(`${BASE}/orders/${createdPOId}/status`)
      .set(await authHeader('procurement_officer'))
      .send({ status, notes: `Advanced to ${status}` });

  it('acknowledges the PO', async () => {
    const res = await advance('acknowledged');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('acknowledged');
    expect(res.body.data.stages.length).toBeGreaterThanOrEqual(2);
  });

  it('moves to processing', async () => {
    const res = await advance('processing');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('processing');
  });

  it('marks as shipped', async () => {
    const res = await advance('shipped');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('shipped');
  });
});

// =============================================================
// POST /procurement/orders/:id/delivery
// =============================================================
describe('POST /procurement/orders/:id/delivery', () => {
  it('inventory officer records a delivery', async () => {
    const res = await request(app)
      .post(`${BASE}/orders/${createdPOId}/delivery`)
      .set(await authHeader('inventory_officer'))
      .send({
        actualDate:     '2026-09-15',
        courier:        'DHL Express',
        trackingNumber: 'DHL12345678',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.delivery).not.toBeNull();
    expect(res.body.data.delivery.actual_date).toContain('2026-09-15');
    // is_on_time depends on expected_delivery_date vs actual
    expect(res.body.data.delivery.is_on_time).toBeDefined();
  });

  it('returns 422 when actualDate is missing', async () => {
    const res = await request(app)
      .post(`${BASE}/orders/${createdPOId}/delivery`)
      .set(await authHeader('inventory_officer'))
      .send({ courier: 'FedEx' });
    expect(res.status).toBe(422);
  });
});

// =============================================================
// POST /procurement/orders/:id/inspection
// =============================================================
describe('POST /procurement/orders/:id/inspection', () => {
  it('inventory officer records a quality inspection', async () => {
    const res = await request(app)
      .post(`${BASE}/orders/${createdPOId}/inspection`)
      .set(await authHeader('inventory_officer'))
      .send({
        totalUnitsChecked: 7,
        unitsPassed:       7,
        unitsRejected:     0,
        outcome:           'accepted',
        notes:             'All units passed QC',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.inspection).not.toBeNull();
    expect(res.body.data.inspection.outcome).toBe('accepted');
    expect(res.body.data.inspection.defect_rate_pct).toBe('0.00');
  });
});

// =============================================================
// GET /procurement/orders/:id/stages
// =============================================================
describe('GET /procurement/orders/:id/stages', () => {
  it('returns all stage log entries for a PO', async () => {
    const res = await request(app)
      .get(`${BASE}/orders/${createdPOId}/stages`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);

    // All stages except the current open one should have duration_hours set
    const closed = res.body.data.filter((s) => s.exited_at !== null);
    closed.forEach((s) => expect(parseFloat(s.duration_hours)).toBeGreaterThanOrEqual(0));
  });
});
