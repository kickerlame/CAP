'use strict';

// =============================================================
// tests/helpers/db.js
// Direct DB query helper for test assertions.
// Bypasses the API to check DB state directly.
// =============================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

const db = require('../../src/config/database');

/**
 * Run a direct SELECT query for test assertions.
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<any[]>}
 */
async function dbQuery(sql, params = []) {
  const [rows] = await db.query(sql, params);
  return rows;
}

/**
 * Find a single row or null.
 */
async function dbFindOne(sql, params = []) {
  const rows = await dbQuery(sql, params);
  return rows[0] || null;
}

/**
 * Get a count.
 */
async function dbCount(table, where = '1=1', params = []) {
  const rows = await dbQuery(`SELECT COUNT(*) AS c FROM ${table} WHERE ${where}`, params);
  return rows[0].c;
}

module.exports = { dbQuery, dbFindOne, dbCount, db };
