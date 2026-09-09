'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const request        = require('supertest');
const app            = require('../src/app');
const { authHeader } = require('./helpers/auth');
const { db, dbFindOne } = require('./helpers/db');

afterAll(async () => { await db.end(); });

const BASE = '/api/v1/users';

// =============================================================
// GET /users  (admin only)
// =============================================================
describe('GET /users', () => {
  it('admin gets paginated user list', async () => {
    const res = await request(app)
      .get(BASE)
      .set(await authHeader('admin'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('filters by roleId', async () => {
    const res = await request(app)
      .get(`${BASE}?roleId=1`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(200);
    // Only admin users returned
    res.body.data.forEach((u) => expect(u.role.roleId).toBe(1));
  });

  it('filters by isActive', async () => {
    const res = await request(app)
      .get(`${BASE}?isActive=true`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(200);
    res.body.data.forEach((u) => expect(u.isActive).toBe(true));
  });

  it('manager gets 403 (no manage_users permission)', async () => {
    const res = await request(app)
      .get(BASE)
      .set(await authHeader('manager'));
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });
});

// =============================================================
// GET /users/:id
// =============================================================
describe('GET /users/:id', () => {
  it('any authenticated user can view a user profile', async () => {
    const res = await request(app)
      .get(`${BASE}/1`)
      .set(await authHeader('requester'));
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(1);
    expect(res.body.data.username).toBe('admin.sys');
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app)
      .get(`${BASE}/99999`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(404);
  });
});

// =============================================================
// POST /users  (admin only)
// =============================================================
describe('POST /users', () => {
  const newUser = {
    roleId:       5,
    departmentId: 1,
    username:     'test.newuser',
    email:        'test.newuser@vppt.my',
    password:     'TestPass@999',
    fullName:     'Test New User',
  };

  it('admin can create a new user', async () => {
    const res = await request(app)
      .post(BASE)
      .set(await authHeader('admin'))
      .send(newUser);
    expect(res.status).toBe(201);
    expect(res.body.data.username).toBe(newUser.username);
    expect(res.body.data.role.roleId).toBe(5);

    // Verify in DB
    const row = await dbFindOne(
      'SELECT username FROM users WHERE username = ?', [newUser.username],
    );
    expect(row).not.toBeNull();
    expect(row.username).toBe(newUser.username);
  });

  it('returns 409 on duplicate username', async () => {
    const res = await request(app)
      .post(BASE)
      .set(await authHeader('admin'))
      .send(newUser); // same username as above
    expect(res.status).toBe(409);
  });

  it('returns 422 with short password', async () => {
    const res = await request(app)
      .post(BASE)
      .set(await authHeader('admin'))
      .send({ ...newUser, username: 'another.user', email: 'another@vppt.my', password: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post(BASE)
      .set(await authHeader('manager'))
      .send(newUser);
    expect(res.status).toBe(403);
  });
});

// =============================================================
// PATCH /users/:id
// =============================================================
describe('PATCH /users/:id', () => {
  it('admin can update a user field', async () => {
    // Update user 10 full name
    const res = await request(app)
      .patch(`${BASE}/10`)
      .set(await authHeader('admin'))
      .send({ full_name: 'Rajan Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Rajan Updated');
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .patch(`${BASE}/10`)
      .set(await authHeader('requester'))
      .send({ full_name: 'Hacker' });
    expect(res.status).toBe(403);
  });
});

// =============================================================
// DELETE /users/:id (soft-delete)
// =============================================================
describe('DELETE /users/:id', () => {
  it('admin can soft-delete a user', async () => {
    // First create a user to delete
    const createRes = await request(app)
      .post(BASE)
      .set(await authHeader('admin'))
      .send({
        roleId: 5, username: 'to.delete', email: 'to.delete@vppt.my',
        password: 'Password@123', fullName: 'To Delete',
      });
    const userId = createRes.body.data.userId;

    const res = await request(app)
      .delete(`${BASE}/${userId}`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(200);

    // Verify soft-delete in DB
    const row = await dbFindOne(
      'SELECT deleted_at, is_active FROM users WHERE user_id = ?', [userId],
    );
    expect(row.deleted_at).not.toBeNull();
    expect(row.is_active).toBe(0);
  });

  it('cannot self-delete', async () => {
    const res = await request(app)
      .delete(`${BASE}/1`)   // admin deleting themselves
      .set(await authHeader('admin'));
    expect(res.status).toBe(400);
  });
});

// =============================================================
// GET /users/departments/list
// =============================================================
describe('GET /users/departments/list', () => {
  it('any authenticated user can list departments', async () => {
    const res = await request(app)
      .get(`${BASE}/departments/list`)
      .set(await authHeader('requester'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('dept_name');
  });
});
