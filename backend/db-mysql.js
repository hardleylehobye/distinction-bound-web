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

// Initialize database tables (one statement per query – MySQL doesn't support multi-statement in one call)
const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    blocked TINYINT(1) DEFAULT 0,
    special_admin TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    instructor_id VARCHAR(255),
    visibility VARCHAR(50) DEFAULT 'public',
    enrollmentCount INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    course_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(255),
    total_seats INT DEFAULT 30,
    enrolled INT DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0.00,
    topics JSON,
    description TEXT,
    instructor_payout_percentage DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    course_id VARCHAR(255),
    session_id VARCHAR(255),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
  )`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    course_id VARCHAR(255),
    session_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    marked_by VARCHAR(255),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    video_url TEXT,
    duration INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id VARCHAR(255),
    month INT NOT NULL,
    year INT NOT NULL,
    amount_owed DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    paid_by VARCHAR(255),
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

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
