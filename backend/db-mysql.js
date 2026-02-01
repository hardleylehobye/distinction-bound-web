// MySQL database adapter - same interface as db-firebase.js
// Set MYSQL_URL (e.g. mysql://user:pass@host:3306/dbname) or DATABASE_URL with mysql://
// Uses mysql2 (supports MySQL 8 caching_sha2_password auth).

const mysql = require('mysql2');
const { URL } = require('url');

const connectionString = process.env.MYSQL_URL || process.env.DATABASE_URL;
if (!connectionString || !connectionString.startsWith('mysql')) {
  throw new Error('MYSQL_URL or DATABASE_URL must be set and start with mysql://');
}
const u = new URL(connectionString);
const database = (u.pathname || '/').slice(1).replace(/^\//, '') || 'distinction_bound';
const pool = mysql.createPool({
  host: u.hostname || 'localhost',
  port: parseInt(u.port, 10) || 3306,
  user: decodeURIComponent(u.username || 'root'),
  password: decodeURIComponent(u.password || ''),
  database,
});

// Promise wrapper so we keep the same [rows, fields] API as mysql2
function query(sql, params) {
  return new Promise((resolve, reject) => {
    const callback = (err, results, fields) => {
      if (err) return reject(err);
      resolve([results, fields]);
    };
    if (params !== undefined && params !== null) {
      pool.query(sql, params, callback);
    } else {
      pool.query(sql, callback);
    }
  });
}

const createTableStatements = require('./db-mysql-schema');

const initializeDB = async () => {
  try {
    for (const sql of createTableStatements) {
      await query(sql);
    }
    console.log('✓ MySQL tables initialized');
  } catch (error) {
    console.error('Error initializing MySQL:', error);
  }
};

// Escape table/column names for raw queries (table names are safe: we control them)
function escapeId(name) {
  return '`' + String(name).replace(/`/g, '``') + '`';
}

const db = {
  async read(table) {
    try {
      const [rows] = await query(`SELECT * FROM ${escapeId(table)}`);
      return rows;
    } catch (error) {
      console.error(`Error reading ${table}:`, error);
      return [];
    }
  },

  async findOne(table, condition) {
    try {
      const keys = Object.keys(condition);
      const values = Object.values(condition);
      const whereClause = keys.map(k => `${escapeId(k)} = ?`).join(' AND ');
      const [rows] = await query(
        `SELECT * FROM ${escapeId(table)} WHERE ${whereClause} LIMIT 1`,
        values
      );
      return rows[0] || null;
    } catch (error) {
      console.error(`Error finding in ${table}:`, error);
      return null;
    }
  },

  async find(table, condition = {}) {
    try {
      if (Object.keys(condition).length === 0) return await this.read(table);
      const keys = Object.keys(condition);
      const values = Object.values(condition);
      const whereClause = keys.map(k => `${escapeId(k)} = ?`).join(' AND ');
      const [rows] = await query(
        `SELECT * FROM ${escapeId(table)} WHERE ${whereClause}`,
        values
      );
      return rows;
    } catch (error) {
      console.error(`Error finding in ${table}:`, error);
      return [];
    }
  },

  async insert(table, record) {
    try {
    const keys = Object.keys(record);
    const values = Object.values(record);
    const placeholders = keys.map(() => '?').join(', ');
    await query(
      `INSERT INTO ${escapeId(table)} (${keys.map(escapeId).join(', ')}) VALUES (${placeholders})`,
      values
    );
    const [rows] = await query('SELECT LAST_INSERT_ID() as id');
    const id = rows[0].id;
    const [inserted] = await query(`SELECT * FROM ${escapeId(table)} WHERE id = ?`, [id]);
    return inserted[0];
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  },

  async update(table, condition, updates) {
    try {
      const conditionKeys = Object.keys(condition);
      const conditionValues = Object.values(condition);
      const updateKeys = Object.keys(updates);
      const updateValues = Object.values(updates);
      const setParts = updateKeys.map(k => `${escapeId(k)} = ?`);
      const tablesWithUpdatedAt = ['users', 'courses', 'sessions'];
      if (tablesWithUpdatedAt.includes(table)) setParts.push('updated_at = CURRENT_TIMESTAMP');
      const whereClause = conditionKeys.map(k => `${escapeId(k)} = ?`).join(' AND ');
      const [result] = await query(
        `UPDATE ${escapeId(table)} SET ${setParts.join(', ')} WHERE ${whereClause}`,
        [...updateValues, ...conditionValues]
      );
      if (result.affectedRows === 0) return null;
      return await this.findOne(table, condition);
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      return null;
    }
  },

  async delete(table, condition) {
    try {
      const keys = Object.keys(condition);
      const values = Object.values(condition);
      const whereClause = keys.map(k => `${escapeId(k)} = ?`).join(' AND ');
      const [result] = await query(
        `DELETE FROM ${escapeId(table)} WHERE ${whereClause}`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      return false;
    }
  },

  pool
};

initializeDB().catch(console.error);

module.exports = db;
