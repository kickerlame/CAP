'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const request = require('supertest');
const app     = require('../src/app');
const { db }  = require('./helpers/db');

afterAll(async () => { await db.end(); });

// =============================================================
// GET /health
// =============================================================
describe('GET /health', () => {
  it('returns 200 with status ok and database connected', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
  });
});

// =============================================================
// Unknown routes
// =============================================================
describe('404 handler', () => {
  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
