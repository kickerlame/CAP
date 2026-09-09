'use strict';

// =============================================================
// tests/helpers/teardown.js
// Jest globalTeardown — runs ONCE after all test suites.
// Currently a no-op (pool closes itself via forceExit),
// but kept as a hook for future cleanup (e.g. dropping test DB).
// =============================================================

module.exports = async function globalTeardown() {
  // Pool is cleaned up by forceExit + db.end() in afterAll blocks.
  // Uncomment below to drop the test DB after each full run:
  // const mysql = require('mysql2/promise');
  // const conn = await mysql.createConnection({ ... });
  // await conn.query('DROP DATABASE IF EXISTS vppt_test');
  // await conn.end();
};
