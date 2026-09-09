'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const request        = require('supertest');
const app            = require('../src/app');
const { authHeader } = require('./helpers/auth');
const { db, dbFindOne } = require('./helpers/db');

afterAll(async () => { await db.end(); });

const BASE = '/api/v1/budgets';

let createdBudgetId;

// =============================================================
// GET /budgets
// =============================================================
describe('GET /budgets', () => {
  it('any authenticated user can list budgets', async () => {
    const res = await request(app)
      .get(BASE)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('filters by fiscalYear', async () => {
    const res = await request(app)
      .get(`${BASE}?fiscalYear=2025`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    res.body.data.forEach((b) => expect(b.fiscal_year).toBe(2025));
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });
});

// =============================================================
// POST /budgets  (manage_budgets = admin/finance roles)
// =============================================================
describe('POST /budgets', () => {
  it('admin can create a budget allocation', async () => {
    const res = await request(app)
      .post(BASE)
      .set(await authHeader('admin'))
      .send({
        departmentId:   1,
        fiscalYear:     2026,
        fiscalQuarter:  3,
        budgetName:     'IT Q3 2026 Test Budget',
        totalAmount:    500000.00,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.budget_name).toBe('IT Q3 2026 Test Budget');
    expect(parseFloat(res.body.data.total_amount)).toBe(500000.00);
    expect(parseFloat(res.body.data.spent_amount)).toBe(0);
    expect(parseFloat(res.body.data.remaining_amount)).toBe(500000.00);
    expect(res.body.data.status).toBe('active');
    createdBudgetId = res.body.data.budget_id;
  });

  it('returns 422 when totalAmount is missing', async () => {
    const res = await request(app)
      .post(BASE)
      .set(await authHeader('admin'))
      .send({ departmentId: 1, fiscalYear: 2026, budgetName: 'No Amount' });
    expect(res.status).toBe(422);
  });

  it('returns 403 for manager role (no manage_budgets)', async () => {
    const res = await request(app)
      .post(BASE)
      .set(await authHeader('manager'))
      .send({ departmentId: 1, fiscalYear: 2026, budgetName: 'Test', totalAmount: 1000 });
    expect(res.status).toBe(403);
  });
});

// =============================================================
// GET /budgets/:id
// =============================================================
describe('GET /budgets/:id', () => {
  it('returns budget detail with recent transactions', async () => {
    const res = await request(app)
      .get(`${BASE}/${createdBudgetId}`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(res.body.data.budget_id).toBe(createdBudgetId);
    expect(res.body.data).toHaveProperty('utilization_pct');
    expect(Array.isArray(res.body.data.recentTransactions)).toBe(true);
  });

  it('returns 404 for non-existent budget', async () => {
    const res = await request(app)
      .get(`${BASE}/999999`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(404);
  });
});

// =============================================================
// POST /budgets/:id/transactions  (debit/credit/adjustment)
// =============================================================
describe('POST /budgets/:id/transactions', () => {
  it('admin can record a debit transaction', async () => {
    const res = await request(app)
      .post(`${BASE}/${createdBudgetId}/transactions`)
      .set(await authHeader('admin'))
      .send({
        amount:          50000.00,
        transactionType: 'debit',
        description:     'Server hardware purchase Q3',
      });
    expect(res.status).toBe(201);

    // Budget running totals should be updated
    const row = await dbFindOne(
      'SELECT spent_amount, remaining_amount FROM budgets WHERE budget_id = ?',
      [createdBudgetId],
    );
    expect(parseFloat(row.spent_amount)).toBe(50000.00);
    expect(parseFloat(row.remaining_amount)).toBe(450000.00);
  });

  it('records a credit transaction and increases remaining', async () => {
    const res = await request(app)
      .post(`${BASE}/${createdBudgetId}/transactions`)
      .set(await authHeader('admin'))
      .send({
        amount:          10000.00,
        transactionType: 'credit',
        description:     'Vendor refund',
      });
    expect(res.status).toBe(201);

    const row = await dbFindOne(
      'SELECT spent_amount, remaining_amount FROM budgets WHERE budget_id = ?',
      [createdBudgetId],
    );
    // spent: 50000 - 10000 = 40000, remaining: 450000 + 10000 = 460000
    expect(parseFloat(row.spent_amount)).toBe(40000.00);
    expect(parseFloat(row.remaining_amount)).toBe(460000.00);
  });

  it('returns 422 for amount of 0', async () => {
    const res = await request(app)
      .post(`${BASE}/${createdBudgetId}/transactions`)
      .set(await authHeader('admin'))
      .send({ amount: 0, transactionType: 'debit' });
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid transactionType', async () => {
    const res = await request(app)
      .post(`${BASE}/${createdBudgetId}/transactions`)
      .set(await authHeader('admin'))
      .send({ amount: 100, transactionType: 'purchase' });
    expect(res.status).toBe(422);
  });
});

// =============================================================
// GET /budgets/:id/transactions
// =============================================================
describe('GET /budgets/:id/transactions', () => {
  it('returns paginated transaction ledger', async () => {
    const res = await request(app)
      .get(`${BASE}/${createdBudgetId}/transactions`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(2);

    // Each transaction has the required fields
    res.body.data.forEach((t) => {
      expect(t).toHaveProperty('amount');
      expect(t).toHaveProperty('transaction_type');
      expect(t).toHaveProperty('recorded_by');
    });
  });
});

// =============================================================
// PATCH /budgets/:id  (update status)
// =============================================================
describe('PATCH /budgets/:id', () => {
  it('admin can close a budget', async () => {
    const res = await request(app)
      .patch(`${BASE}/${createdBudgetId}`)
      .set(await authHeader('admin'))
      .send({ status: 'closed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('closed');
  });
});
