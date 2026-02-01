// Run from backend folder: node run-import-users.js
// Imports users into MySQL using your .env MYSQL_URL (no mysql CLI needed).
require('dotenv').config();
const db = require('./database');

const users = [
  { id: 1, uid: 'LBcFeF3QJPh1rp3iuJC00kfoBPV2', email: 'hardleylehobye@gmail.com', name: 'Hardley Lehobye', role: 'admin', blocked: 0, special_admin: 1, created_at: '2026-01-20 00:44:33', updated_at: '2026-01-21 07:02:27' },
  { id: 2, uid: 'UovYL1BDt2e8dxbuKdXmBkvN3Zl2', email: 'thabangth2003@gmail.com', name: 'Thabang Lehobye', role: 'instructor', blocked: 0, special_admin: 0, created_at: '2026-01-20 00:44:33', updated_at: '2026-01-22 04:21:50' },
  { id: 3, uid: 'QWD1SHuXNwcVGTzVbBA8gj9A22H2', email: '2542228@students.wits.ac.za', name: 'Thabang Lehobye', role: 'student', blocked: 0, special_admin: 0, created_at: '2026-01-20 22:48:54', updated_at: '2026-01-21 06:49:51' },
  { id: 11, uid: '9PdkHZ695lhi2PwL4B2wAsEovwM2', email: '2538825@students.wits.ac.za', name: 'Sibusiso Mahlangu', role: 'student', blocked: 0, special_admin: 0, created_at: '2026-01-21 08:39:18', updated_at: '2026-01-21 08:39:18' },
  { id: 12, uid: '7ZpTQIBTcfSKQPrKUaH9X717OQh1', email: 'lehlohonolomahlangu718@gmail.com', name: 'Lehlohonolo', role: 'admin', blocked: 0, special_admin: 1, created_at: '2026-01-21 19:43:16', updated_at: '2026-01-21 19:43:16' }
];

async function run() {
  const mysql = require('mysql2');
  const { URL } = require('url');
  const u = new URL(process.env.MYSQL_URL);
  const database = (u.pathname || '/').slice(1).replace(/^\//, '') || 'distinction_bound';
  const pool = mysql.createPool({
    host: u.hostname || 'localhost',
    port: parseInt(u.port, 10) || 3306,
    user: decodeURIComponent(u.username || 'root'),
    password: decodeURIComponent(u.password || ''),
    database
  });
  const q = (sql, params) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, res) => err ? reject(err) : resolve(res));
  });

  const sql = `INSERT INTO users (id, uid, email, name, role, blocked, special_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE uid=VALUES(uid), email=VALUES(email), name=VALUES(name), role=VALUES(role), blocked=VALUES(blocked), special_admin=VALUES(special_admin), updated_at=VALUES(updated_at)`;

  for (const row of users) {
    await q(sql, [row.id, row.uid, row.email, row.name, row.role, row.blocked, row.special_admin, row.created_at, row.updated_at]);
  }
  console.log('✓ Imported', users.length, 'users into distinction_bound.users');
  pool.end();
}

run().catch(err => { console.error(err); process.exit(1); });
