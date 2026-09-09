'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const request        = require('supertest');
const app            = require('../src/app');
const { authHeader } = require('./helpers/auth');
const { db, dbFindOne } = require('./helpers/db');

afterAll(async () => { await db.end(); });

const BASE = '/api/v1/inventory';

// =============================================================
// GET /inventory/hardware-categories
// =============================================================
describe('GET /inventory/hardware-categories', () => {
  it('returns hardware categories list', async () => {
    const res = await request(app)
      .get(`${BASE}/hardware-categories`)
      .set(await authHeader('requester'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('category_name');
  });
});

// =============================================================
// GET /inventory/hardware-items
// =============================================================
describe('GET /inventory/hardware-items', () => {
  it('returns paginated hardware items', async () => {
    const res = await request(app)
      .get(`${BASE}/hardware-items`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('filters by categoryId', async () => {
    const res = await request(app)
      .get(`${BASE}/hardware-items?categoryId=1`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    res.body.data.forEach((item) => expect(item.category_id).toBe(1));
  });
});

// =============================================================
// GET /inventory
// =============================================================
describe('GET /inventory', () => {
  it('returns inventory list with risk metrics', async () => {
    const res = await request(app)
      .get(BASE)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThan(0);

    const item = res.body.data[0];
    expect(item).toHaveProperty('current_stock');
    expect(item).toHaveProperty('risk_level');
    expect(item).toHaveProperty('stock_value');
  });

  it('filters by riskLevel=CRITICAL', async () => {
    const res = await request(app)
      .get(`${BASE}?riskLevel=CRITICAL`)
      .set(await authHeader('inventory_officer'));
    expect(res.status).toBe(200);
    res.body.data.forEach((item) => expect(item.risk_level).toBe('CRITICAL'));
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });
});

// =============================================================
// GET /inventory/:id
// =============================================================
describe('GET /inventory/:id', () => {
  it('returns a single inventory item', async () => {
    const res = await request(app)
      .get(`${BASE}/1`)
      .set(await authHeader('inventory_officer'));
    expect(res.status).toBe(200);
    expect(res.body.data.inventory_id).toBe(1);
    expect(res.body.data).toHaveProperty('avg_daily_consumption');
    expect(res.body.data).toHaveProperty('reorder_point');
  });

  it('returns 404 for non-existent inventory id', async () => {
    const res = await request(app)
      .get(`${BASE}/999999`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(404);
  });
});

// =============================================================
// PATCH /inventory/:id/recalculate
// =============================================================
describe('PATCH /inventory/:id/recalculate', () => {
  it('inventory officer can trigger recalculation', async () => {
    const res = await request(app)
      .patch(`${BASE}/1/recalculate`)
      .set(await authHeader('inventory_officer'));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('avg_daily_consumption');
    expect(res.body.data).toHaveProperty('risk_level');
    expect(['NORMAL','WARNING','CRITICAL']).toContain(res.body.data.risk_level);

    // Verify last_calculated_at was updated in DB
    const row = await dbFindOne(
      'SELECT last_calculated_at FROM inventory WHERE inventory_id = 1',
    );
    expect(row.last_calculated_at).not.toBeNull();
  });

  it('returns 403 for manager (read-only)', async () => {
    const res = await request(app)
      .patch(`${BASE}/1/recalculate`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(403);
  });
});

// =============================================================
// GET /inventory/:id/transactions
// =============================================================
describe('GET /inventory/:id/transactions', () => {
  it('returns transaction history for an inventory item', async () => {
    const res = await request(app)
      .get(`${BASE}/1/transactions`)
      .set(await authHeader('inventory_officer'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================
// POST /inventory/:id/transactions
// =============================================================
describe('POST /inventory/:id/transactions', () => {
  let stockBefore;

  beforeAll(async () => {
    const row = await dbFindOne('SELECT current_stock FROM inventory WHERE inventory_id = 5');
    stockBefore = row.current_stock;
  });

  it('inventory officer can record an IN transaction', async () => {
    const res = await request(app)
      .post(`${BASE}/5/transactions`)
      .set(await authHeader('inventory_officer'))
      .send({ txnType: 'IN', quantity: 10, notes: 'Test stock addition' });

    expect(res.status).toBe(201);
    expect(res.body.data.current_stock).toBe(stockBefore + 10);

    // Verify in DB
    const row = await dbFindOne('SELECT current_stock FROM inventory WHERE inventory_id = 5');
    expect(row.current_stock).toBe(stockBefore + 10);
  });

  it('records an OUT transaction and reduces stock', async () => {
    const rowBefore = await dbFindOne('SELECT current_stock FROM inventory WHERE inventory_id = 5');
    const stockNow = rowBefore.current_stock;

    const res = await request(app)
      .post(`${BASE}/5/transactions`)
      .set(await authHeader('inventory_officer'))
      .send({ txnType: 'OUT', quantity: 3, notes: 'Test consumption' });

    expect(res.status).toBe(201);
    // Stock should be reduced by 3
    expect(res.body.data.current_stock).toBe(stockNow - 3);
  });

  it('returns 422 for invalid txnType', async () => {
    const res = await request(app)
      .post(`${BASE}/5/transactions`)
      .set(await authHeader('inventory_officer'))
      .send({ txnType: 'INVALID', quantity: 5 });
    expect(res.status).toBe(422);
  });

  it('returns 422 for zero quantity', async () => {
    const res = await request(app)
      .post(`${BASE}/5/transactions`)
      .set(await authHeader('inventory_officer'))
      .send({ txnType: 'IN', quantity: 0 });
    expect(res.status).toBe(422);
  });

  it('returns 403 for requester role', async () => {
    const res = await request(app)
      .post(`${BASE}/5/transactions`)
      .set(await authHeader('requester'))
      .send({ txnType: 'IN', quantity: 5 });
    expect(res.status).toBe(403);
  });
});
