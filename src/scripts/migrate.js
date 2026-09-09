'use strict';

// =============================================================
// VPPT — src/scripts/migrate.js
// Runs all schema SQL files in numerical order against the DB.
// Dynamic: adapts to any DB name (e.g. railway or vppt)
// Idempotent: all DDL uses CREATE TABLE IF NOT EXISTS /
//             CREATE OR REPLACE VIEW / ALTER TABLE.
// =============================================================

require('dotenv').config();

const fs     = require('fs');
const path   = require('path');
const mysql  = require('mysql2/promise');
const config = require('../config/config');

const SCHEMA_DIR = path.join(__dirname, '../../database/schema');

async function migrate() {
  const targetDb = config.db.name || 'vppt';

  // Connect without selecting a database first
  const conn = await mysql.createConnection({
    host:               config.db.host,
    port:               config.db.port,
    user:               config.db.user,
    password:           config.db.password,
    multipleStatements: true,
  });

  console.log(`✔ Connected to MySQL server at ${config.db.host}:${config.db.port}`);

  // Ensure target database exists
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await conn.query(`USE \`${targetDb}\`;`);
  console.log(`✔ Using database: ${targetDb}`);

  const files = fs
    .readdirSync(SCHEMA_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(SCHEMA_DIR, file);
    let sql = fs.readFileSync(filePath, 'utf8');

    // Replace hardcoded 'vppt' database name with configured target database
    sql = sql.replace(/USE\s+vppt\s*;/gi, `USE \`${targetDb}\`;`);
    sql = sql.replace(/CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS\s+vppt/gi, `CREATE DATABASE IF NOT EXISTS \`${targetDb}\``);

    console.log(`  → Running schema: ${file}`);
    try {
      await conn.query(sql);
      console.log(`  ✔ ${file} done.`);
    } catch (err) {
      if (
        err.code === 'ER_DUP_KEYNAME'           ||
        err.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
        err.code === 'ER_FK_DUP_NAME'            ||
        err.message?.includes('Duplicate foreign key constraint name')
      ) {
        console.warn(`  ⚠ ${file} skipped known safe error: ${err.code}`);
        continue;
      }
      console.error(`  ✗ ${file} FAILED: ${err.message}`);
      await conn.end();
      process.exit(1);
    }
  }

  await conn.end();
  console.log('\n✔ All schema migrations applied successfully.\n');
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});