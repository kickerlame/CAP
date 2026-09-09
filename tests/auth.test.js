'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const request     = require('supertest');
const app         = require('../src/app');
const { getToken } = require('./helpers/auth');
const { db, dbFindOne } = require('./helpers/db');

afterAll(async () => { await db.end(); });

const BASE = '/api/v1/auth';

// =============================================================
// POST /auth/login
// =============================================================
describe('POST /auth/login', () => {
  it('returns 200 with tokens for valid credentials', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: 'admin.sys', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.username).toBe('admin.sys');
    expect(res.body.data.user.roleName).toBe('admin');
  });

  it('accepts email as identifier', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: 'admin@vppt.my', password: 'Password@123' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('admin@vppt.my');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: 'admin.sys', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: 'ghost_user', password: 'Password@123' });
    expect(res.status).toBe(401);
  });

  it('returns 422 when identifier is missing', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ password: 'Password@123' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 422 when password is missing', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: 'admin.sys' });
    expect(res.status).toBe(422);
  });
});

// =============================================================
// GET /auth/me
// =============================================================
describe('GET /auth/me', () => {
  it('returns current user profile with valid token', async () => {
    const token = await getToken('admin');
    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('admin.sys');
    expect(res.body.data.role.roleName).toBe('admin');
    expect(res.body.data.department).toBeDefined();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });
});

// =============================================================
// POST /auth/refresh
// =============================================================
describe('POST /auth/refresh', () => {
  it('returns a new access token with a valid refresh token', async () => {
    // Get a fresh refresh token
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: 'amirah.hassan', password: 'Password@123' });
    const { refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('returns 401 with an invalid refresh token', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken: 'bad.token.value' });
    expect(res.status).toBe(401);
  });

  it('returns 422 when refreshToken field is missing', async () => {
    const res = await request(app).post(`${BASE}/refresh`).send({});
    expect(res.status).toBe(422);
  });
});

// =============================================================
// POST /auth/logout
// =============================================================
describe('POST /auth/logout', () => {
  it('revokes the refresh token and confirms logout', async () => {
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: 'farid.othman', password: 'Password@123' });
    const { accessToken, refreshToken } = loginRes.body.data;

    const logoutRes = await request(app)
      .post(`${BASE}/logout`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Verify the token is now revoked in DB
    const record = await dbFindOne(
      `SELECT revoked FROM refresh_tokens WHERE revoked = 1 AND user_id = (
         SELECT user_id FROM users WHERE username = 'farid.othman'
       ) ORDER BY created_at DESC LIMIT 1`,
    );
    expect(record).not.toBeNull();
    expect(record.revoked).toBe(1);

    // Attempt to use revoked token — should fail
    const refreshRes = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app)
      .post(`${BASE}/logout`)
      .send({ refreshToken: 'some-token' });
    expect(res.status).toBe(401);
  });
});
