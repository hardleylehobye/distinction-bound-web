#!/usr/bin/env node
/**
 * Copy data from LOCAL MySQL to RAILWAY MySQL (no mysqldump needed).
 *
 * 1. In backend/.env you already have MYSQL_URL = local (e.g. mysql://root:...@localhost:3306/distinction_bound).
 * 2. Set RAILWAY URL for this run only:
 *    Windows PowerShell:
 *    $env:MYSQL_RAILWAY_URL="mysql://root:YOUR_RAILWAY_PASSWORD@ballast.proxy.rlwy.net:25441/railway"
 *    node copy-local-to-railway.js
 *
 *    Or add MYSQL_RAILWAY_URL to backend/.env temporarily (do not commit).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysql = require('mysql2/promise');

const LOCAL_URL = process.env.MYSQL_URL || (process.env.DB_HOST && `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_NAME}`);
const RAILWAY_URL = process.env.MYSQL_RAILWAY_URL;

const TABLES = ['users', 'courses', 'sessions', 'enrollments', 'purchases', 'attendance', 'notes', 'videos', 'payouts'];

if (!LOCAL_URL || !LOCAL_URL.startsWith('mysql')) {
  console.error('Missing local MySQL. Set MYSQL_URL in backend/.env (e.g. mysql://root:pass@localhost:3306/distinction_bound).');
  process.exit(1);
}
if (!RAILWAY_URL || !RAILWAY_URL.startsWith('mysql')) {
  console.error('Missing Railway URL. In PowerShell run:');
  console.error('  $env:MYSQL_RAILWAY_URL="mysql://root:YOUR_PASSWORD@ballast.proxy.rlwy.net:25441/railway"');
  console.error('  cd backend');
  console.error('  node copy-local-to-railway.js');
  process.exit(1);
}

const createTableStatements = require('./db-mysql-schema');

async function run() {
  let localConn, railwayConn;
  try {
    localConn = await mysql.createConnection(LOCAL_URL);
    railwayConn = await mysql.createConnection(RAILWAY_URL);
    console.log('Connected to LOCAL and RAILWAY.\n');

    // Create tables on Railway first (same as backend)
    console.log('Creating tables on Railway (if missing)...');
    for (const sql of createTableStatements) {
      await railwayConn.query(sql);
    }
    console.log('Tables ready.\n');

    for (const table of TABLES) {
      const [rows] = await localConn.query(`SELECT * FROM \`${table}\``);
      if (!rows.length) {
        console.log(`  ${table}: 0 rows (skip)`);
        continue;
      }
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const colList = columns.map(c => '`' + c + '`').join(', ');
      const updatePart = columns.filter(c => c !== 'id').map(c => '`' + c + '` = VALUES(`' + c + '`)').join(', ');
      const sql = updatePart
        ? `INSERT INTO \`${table}\` (${colList}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updatePart}`
        : `INSERT INTO \`${table}\` (${colList}) VALUES (${placeholders})`;
      let inserted = 0;
      for (const row of rows) {
        const values = columns.map(c => {
          const v = row[c];
          if (v === undefined || v === null) return null;
          if (typeof v === 'object' && typeof v.toISOString === 'function') return v.toISOString().slice(0, 19).replace('T', ' ');
          if (typeof v === 'object') return JSON.stringify(v);
          return v;
        });
        try {
          await railwayConn.query(sql, values);
          inserted++;
        } catch (err) {
          console.error(`  ${table} row error:`, err.message);
        }
      }
      console.log(`  ${table}: ${inserted}/${rows.length} rows`);
    }
    console.log('\nDone. Railway DB is updated.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    if (localConn) await localConn.end();
    if (railwayConn) await railwayConn.end();
  }
}

run();
