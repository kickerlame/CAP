'use strict';

// =============================================================
// tests/helpers/setup.js
// Jest globalSetup — runs ONCE before all test suites in a
// separate Node process (no access to Jest globals).
//
// Responsibilities:
//   1. Load .env.test
//   2. Create vppt_test database (DROP + recreate for clean slate)
//   3. Run all schema migrations against vppt_test
//   4. Run all seed files against vppt_test
//   5. Update user password hashes to a known bcrypt hash
// =============================================================

const path   = require('path');
const fs     = require('fs');
const mysql  = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Load test env vars before requiring config
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

const SCHEMA_DIR = path.join(__dirname, '../../database/schema');
const SEED_DIR   = path.join(__dirname, '../../database/seeds');

// Known password for all seeded test users
const TEST_PASSWORD      = 'Password@123';
// Store hash in global so tests can reference it
global.__TEST_PASSWORD__ = TEST_PASSWORD;

module.exports = async function globalSetup() {
  // Connect without DB selected
  const root = await mysql.createConnection({
    host:               process.env.DB_HOST || '127.0.0.1',
    port:               parseInt(process.env.DB_PORT, 10) || 3306,
    user:               process.env.DB_USER || 'root',
    password:           process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const DB = process.env.DB_NAME || 'vppt_test';
  console.log(`\n[setup] Recreating test database: ${DB}`);

  // Drop and recreate for a pristine state every test run
  await root.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await root.query(
    `CREATE DATABASE \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await root.query(`USE \`${DB}\``);

  // Run schema files
  const schemaFiles = fs.readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of schemaFiles) {
    // Skip the CREATE DATABASE statement — we already did it
    if (file === '00_create_database.sql') continue;
    const sql = fs.readFileSync(path.join(SCHEMA_DIR, file), 'utf8')
      .replace(/^USE vppt;/m, `USE \`${DB}\`;`);
    try {
      await root.query(sql);
    } catch (err) {
      if (
        err.code === 'ER_DUP_KEYNAME' ||
        err.code === 'ER_FK_DUP_NAME' ||
        err.message?.includes('Duplicate foreign key')
      ) continue;
      throw new Error(`Schema ${file} failed: ${err.message}`);
    }
  }
  console.log('[setup] Schema applied.');

  // Run seed files
  const seedFiles = fs.readdirSync(SEED_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of seedFiles) {
    const sql = fs.readFileSync(path.join(SEED_DIR, file), 'utf8')
      .replace(/^USE vppt;/m, `USE \`${DB}\`;`);
    try {
      await root.query(sql);
    } catch (err) {
      throw new Error(`Seed ${file} failed: ${err.message}`);
    }
  }
  console.log('[setup] Seeds applied.');

  // Fix all user password hashes to the known TEST_PASSWORD
  const hash = await bcrypt.hash(TEST_PASSWORD, 10); // cost 10 for speed in tests
  await root.query(`UPDATE \`${DB}\`.users SET password_hash = ?`, [hash]);
  console.log('[setup] Password hashes updated.');

  await root.end();
  console.log('[setup] Done — test database ready.\n');
};
