'use strict';

// =============================================================
// VPPT — src/config/database.js
// mysql2/promise connection pool with transaction helpers.
//
// Exports:
//   query(sql, params)           – execute a single query
//   getConnection()              – raw pool connection (manual release)
//   transaction(fn)              – auto BEGIN/COMMIT/ROLLBACK wrapper
//   end()                        – graceful pool shutdown
// =============================================================

const mysql  = require('mysql2/promise');
const config = require('./config');
const logger = require('./logger');

// ── Pool creation ─────────────────────────────────────────────
const pool = mysql.createPool({
  host:               config.db.host,
  port:               config.db.port,
  database:           config.db.name,
  user:               config.db.user,
  password:           config.db.password,
  connectionLimit:    config.db.connectionLimit,
  timezone:           config.db.timezone,
  charset:            'utf8mb4',
  waitForConnections: true,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
});

pool.on('connection', () => {
  logger.debug('New DB connection acquired from pool.');
});

// ── query ─────────────────────────────────────────────────────
/**
 * Execute a single SQL query against the pool.
 * @param {string} sql     Parameterised SQL string
 * @param {Array}  params  Bound parameter values
 * @returns {Promise<[any[], FieldPacket[]]>}
 */
async function query(sql, params = []) {
  const [rows, fields] = await pool.execute(sql, params);
  return [rows, fields];
}

// ── getConnection ─────────────────────────────────────────────
/**
 * Acquire a raw connection from the pool.
 * Caller MUST call conn.release() when done.
 * @returns {Promise<PoolConnection>}
 */
async function getConnection() {
  return pool.getConnection();
}

// ── transaction ───────────────────────────────────────────────
/**
 * Run an async function inside a DB transaction.
 * Automatically COMMITs on success or ROLLBACKs on error.
 *
 * Usage:
 *   const result = await db.transaction(async (conn) => {
 *     const [rows] = await conn.execute('SELECT ...', [...]);
 *     await conn.execute('INSERT ...', [...]);
 *     return rows;
 *   });
 *
 * @param {Function} fn  Async function receiving the connection
 * @returns {Promise<any>} Whatever fn returns
 */
async function transaction(fn) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ── end ───────────────────────────────────────────────────────
/**
 * Gracefully drain and close the connection pool.
 * Called during SIGTERM/SIGINT shutdown in server.js.
 */
async function end() {
  await pool.end();
  logger.info('DB connection pool closed.');
}

module.exports = { query, getConnection, transaction, end };
