'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const request        = require('supertest');
const app            = require('../src/app');
const { authHeader } = require('./helpers/auth');
const { db, dbFindOne, dbCount } = require('./helpers/db');

afterAll(async () => { await db.end(); });

const BASE = '/api/v1/vendors';

// =============================================================
// GET /vendors
// =============================================================
describe('GET /vendors', () => {
  it('returns paginated vendor list for any authenticated user', async () => {
    const res = await request(app)
      .get(BASE)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('filters by status=active', async () => {
    const res = await request(app)
      .get(`${BASE}?status=active`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    res.body.data.forEach((v) => expect(v.status).toBe('active'));
  });

  it('filters by tier=Platinum', async () => {
    const res = await request(app)
      .get(`${BASE}?tier=Platinum`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    res.body.data.forEach((v) => expect(v.tier).toBe('Platinum'));
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });
});

// =============================================================
// GET /vendors/:id
// =============================================================
describe('GET /vendors/:id', () => {
  it('returns vendor detail with latest snapshot', async () => {
    const res = await request(app)
      .get(`${BASE}/1`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(res.body.data.vendor_id).toBe(1);
    expect(res.body.data.vendor_name).toBeDefined();
  });

  it('returns 404 for non-existent vendor', async () => {
    const res = await request(app)
      .get(`${BASE}/99999`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(404);
  });
});

// =============================================================
// POST /vendors  (manage_vendors permission)
// =============================================================
describe('POST /vendors', () => {
  const newVendor = {
    vendorName:    'Test Vendor Sdn Bhd',
    vendorCode:    'TEST-VENDOR-001',
    contactPerson: 'Ali Bin Ahmad',
    email:         'vendor@test.my',
    phone:         '+60123456789',
    status:        'active',
  };

  it('procurement officer can create a vendor', async () => {
    const res = await request(app)
      .post(BASE)
      .set(await authHeader('procurement_officer'))
      .send(newVendor);
    expect(res.status).toBe(201);
    expect(res.body.data.vendor_name).toBe(newVendor.vendorName);
    expect(res.body.data.vendor_code).toBe(newVendor.vendorCode);
    expect(res.body.data.tier).toBe('Unrated');

    // Verify in DB
    const row = await dbFindOne('SELECT vendor_code FROM vendors WHERE vendor_code = ?', [newVendor.vendorCode]);
    expect(row).not.toBeNull();
  });

  it('returns 409 on duplicate vendor_code', async () => {
    const res = await request(app)
      .post(BASE)
      .set(await authHeader('procurement_officer'))
      .send(newVendor); // same vendorCode
    expect(res.status).toBe(409);
  });

  it('returns 422 when vendorName is missing', async () => {
    const res = await request(app)
      .post(BASE)
      .set(await authHeader('procurement_officer'))
      .send({ vendorCode: 'TEST-NONAME' });
    expect(res.status).toBe(422);
  });

  it('returns 403 for manager (read-only role)', async () => {
    const res = await request(app)
      .post(BASE)
      .set(await authHeader('manager'))
      .send(newVendor);
    expect(res.status).toBe(403);
  });
});

// =============================================================
// PATCH /vendors/:id
// =============================================================
describe('PATCH /vendors/:id', () => {
  it('procurement officer can update vendor status', async () => {
    const res = await request(app)
      .patch(`${BASE}/1`)
      .set(await authHeader('procurement_officer'))
      .send({ status: 'probation' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('probation');

    // Restore
    await request(app)
      .patch(`${BASE}/1`)
      .set(await authHeader('procurement_officer'))
      .send({ status: 'active' });
  });
});

// =============================================================
// DELETE /vendors/:id (soft-delete, admin only)
// =============================================================
describe('DELETE /vendors/:id', () => {
  it('admin can soft-delete a vendor', async () => {
    // Create a vendor first
    const createRes = await request(app)
      .post(BASE)
      .set(await authHeader('procurement_officer'))
      .send({ vendorName: 'Delete Me Vendor', vendorCode: 'DEL-VENDOR-001' });
    const vendorId = createRes.body.data.vendor_id;

    const res = await request(app)
      .delete(`${BASE}/${vendorId}`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(200);

    // Vendor should be gone from regular listing
    const row = await dbFindOne(
      'SELECT deleted_at FROM vendors WHERE vendor_id = ?', [vendorId],
    );
    expect(row.deleted_at).not.toBeNull();
  });
});

// =============================================================
// POST /vendors/:id/snapshots  (score recalculation)
// =============================================================
describe('POST /vendors/:id/snapshots', () => {
  it('recalculates and returns a new performance snapshot', async () => {
    const res = await request(app)
      .post(`${BASE}/1/snapshots`)
      .set(await authHeader('procurement_officer'));
    expect(res.status).toBe(200);
    expect(res.body.data.overall).toBeDefined();
    expect(res.body.data.tier).toMatch(/Platinum|Gold|Silver|Probation/);
    expect(typeof res.body.data.slaScore).toBe('number');
  });
});

// =============================================================
// GET /vendors/:id/sla
// =============================================================
describe('GET /vendors/:id/sla', () => {
  it('returns the current SLA contract', async () => {
    const res = await request(app)
      .get(`${BASE}/1/sla`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(res.body.data.is_current).toBe(1);
    expect(res.body.data.delivery_lead_time_days).toBeDefined();
  });
});

// =============================================================
// POST /vendors/:id/sla  (create new SLA)
// =============================================================
describe('POST /vendors/:id/sla', () => {
  it('procurement officer can create a new SLA contract', async () => {
    const res = await request(app)
      .post(`${BASE}/2/sla`)
      .set(await authHeader('procurement_officer'))
      .send({
        deliveryLeadTimeDays:     10,
        slaComplianceTargetPct:   97.00,
        qualityThresholdPct:      99.00,
        maxReturnRatePct:         1.50,
        contractStartDate:        '2026-01-01',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.delivery_lead_time_days).toBe(10);
    expect(res.body.data.is_current).toBe(1);

    // Old SLA should now be inactive
    const oldSlAs = await db.query(
      'SELECT COUNT(*) AS c FROM vendor_sla_contracts WHERE vendor_id = 2 AND is_current = 0',
    );
    expect(oldSlAs[0][0].c).toBeGreaterThanOrEqual(1);
  });

  it('returns 422 with invalid contractStartDate', async () => {
    const res = await request(app)
      .post(`${BASE}/2/sla`)
      .set(await authHeader('procurement_officer'))
      .send({ contractStartDate: 'not-a-date' });
    expect(res.status).toBe(422);
  });
});
