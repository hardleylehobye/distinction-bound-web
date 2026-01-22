const { Pool } = require('pg');

// PostgreSQL connection
// Render and most cloud databases require SSL, so enable it when DATABASE_URL is set
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize database tables
const initializeDB = async () => {
  try {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'student',
        blocked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        course_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        course_id VARCHAR(255) REFERENCES courses(course_id),
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        venue VARCHAR(255),
        total_seats INTEGER DEFAULT 30,
        enrolled INTEGER DEFAULT 0,
        price DECIMAL(10, 2) DEFAULT 0.00,
        topics TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        enrollment_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255) REFERENCES users(uid),
        course_id VARCHAR(255) REFERENCES courses(course_id),
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        ticket_number VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255) REFERENCES users(uid),
        course_id VARCHAR(255),
        session_id VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50),
        payment_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'completed',
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        ticket_number VARCHAR(255) NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        marked_by VARCHAR(255),
        marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        content TEXT,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        video_url TEXT,
        duration INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payouts (
        id SERIAL PRIMARY KEY,
        instructor_id VARCHAR(255) REFERENCES users(uid),
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        amount_owed DECIMAL(10, 2) NOT NULL,
        amount_paid DECIMAL(10, 2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        payment_reference VARCHAR(255),
        paid_by VARCHAR(255),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ PostgreSQL tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Database operations
const db = {
  // Read all records from table
  async read(table) {
    try {
      const result = await pool.query(`SELECT * FROM ${table}`);
      return result.rows;
    } catch (error) {
      console.error(`Error reading ${table}:`, error);
      return [];
    }
  },

  // Find one record
  async findOne(table, condition) {
    try {
      const keys = Object.keys(condition);
      const values = Object.values(condition);
      const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
      
      const result = await pool.query(
        `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`,
        values
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error finding in ${table}:`, error);
      return null;
    }
  },

  // Find multiple records
  async find(table, condition = {}) {
    try {
      if (Object.keys(condition).length === 0) {
        return await this.read(table);
      }

      const keys = Object.keys(condition);
      const values = Object.values(condition);
      const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
      
      const result = await pool.query(
        `SELECT * FROM ${table} WHERE ${whereClause}`,
        values
      );
      return result.rows;
    } catch (error) {
      console.error(`Error finding in ${table}:`, error);
      return [];
    }
  },

  // Insert record
  async insert(table, record) {
    try {
      const keys = Object.keys(record);
      const values = Object.values(record);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const result = await pool.query(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  },

  // Update record
  async update(table, condition, updates) {
    try {
      const conditionKeys = Object.keys(condition);
      const conditionValues = Object.values(condition);
      const updateKeys = Object.keys(updates);
      const updateValues = Object.values(updates);
      
      const setClause = updateKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      const whereClause = conditionKeys.map((key, i) => `${key} = $${updateKeys.length + i + 1}`).join(' AND ');
      
      const result = await pool.query(
        `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${whereClause} RETURNING *`,
        [...updateValues, ...conditionValues]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      return null;
    }
  },

  // Delete record
  async delete(table, condition) {
    try {
      const keys = Object.keys(condition);
      const values = Object.values(condition);
      const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
      
      const result = await pool.query(
        `DELETE FROM ${table} WHERE ${whereClause}`,
        values
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      return false;
    }
  },

  // Get pool for raw queries
  pool
};

// Initialize on load
initializeDB().catch(console.error);

module.exports = db;
