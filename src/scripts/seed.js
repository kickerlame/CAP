'use strict';

// =============================================================
// VPPT — src/scripts/seed.js
// Runs all seed SQL files in numerical order against the DB.
// Dynamic: adapts to any DB name (e.g. railway or vppt)
// Idempotent: seed files use INSERT IGNORE / ON DUPLICATE KEY UPDATE.
// =============================================================

require('dotenv').config();

const fs     = require('fs');
const path   = require('path');
const mysql  = require('mysql2/promise');
const config = require('../config/config');

const SEED_DIR = path.join(__dirname, '../../database/seeds');

async function seed() {
  const targetDb = config.db.name || 'vppt';

  const conn = await mysql.createConnection({
    host:               config.db.host,
    port:               config.db.port,
    user:               config.db.user,
    password:           config.db.password,
    multipleStatements: true,
  });

  console.log(`✔ Connected to database server: ${config.db.host}:${config.db.port}`);
  await conn.query(`USE \`${targetDb}\`;`);
  console.log(`✔ Selected database: ${targetDb}`);

  const files = fs
    .readdirSync(SEED_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(SEED_DIR, file);
    let sql = fs.readFileSync(filePath, 'utf8');

    // Replace hardcoded 'vppt' database name with configured target database
    sql = sql.replace(/USE\s+vppt\s*;/gi, `USE \`${targetDb}\`;`);

    console.log(`  → Seeding: ${file}`);
    try {
      await conn.query(sql);
      console.log(`  ✔ ${file} done.`);
    } catch (err) {
      console.error(`  ✗ ${file} FAILED: ${err.message}`);
      await conn.end();
      process.exit(1);
    }
  }

  await conn.end();
  console.log('\n✔ Seeding complete.\n');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});