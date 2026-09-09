'use strict';

// =============================================================
// tests/helpers/auth.js
// Auth helpers for integration tests.
//
// Usage:
//   const { getToken, getTokenFor } = require('./helpers/auth');
//   const adminToken = await getToken('admin');
//   const { token, userId } = await getTokenFor('procurement_officer');
// =============================================================

const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

const request  = require('supertest');
const app      = require('../../src/app');
const db       = require('../../src/config/database');

// Role name → seeded username mapping
const ROLE_USERS = {
  admin:                'admin.sys',
  procurement_officer:  'amirah.hassan',
  inventory_officer:    'hafiz.rosli',
  manager:              'datuk.rashid',
  requester:            'rajan.pillai',
};

const TOKEN_CACHE = {};

/**
 * Gets a JWT for the given role using the seeded test credentials.
 * Caches tokens for the duration of the test run.
 * @param {string} role  One of: admin, procurement_officer, inventory_officer, manager, requester
 * @returns {Promise<string>} Bearer token
 */
async function getToken(role = 'admin') {
  if (TOKEN_CACHE[role]) return TOKEN_CACHE[role];

  const username = ROLE_USERS[role];
  if (!username) throw new Error(`Unknown role for test: ${role}`);

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: username, password: 'Password@123' });

  if (res.status !== 200) {
    throw new Error(`Login failed for role ${role} (${username}): ${JSON.stringify(res.body)}`);
  }

  TOKEN_CACHE[role] = res.body.data.accessToken;
  return TOKEN_CACHE[role];
}

/**
 * Gets a token AND the userId for a given role.
 * @param {string} role
 * @returns {Promise<{token: string, userId: number}>}
 */
async function getTokenFor(role = 'admin') {
  const token = await getToken(role);
  const res = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`);
  return { token, userId: res.body.data.userId };
}

/**
 * Returns the auth header object for a given role.
 * @param {string} role
 * @returns {Promise<{'Authorization': string}>}
 */
async function authHeader(role = 'admin') {
  const token = await getToken(role);
  return { Authorization: `Bearer ${token}` };
}

module.exports = { getToken, getTokenFor, authHeader, ROLE_USERS };
