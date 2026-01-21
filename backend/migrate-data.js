// Data migration script - migrate from JSON to PostgreSQL
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const dataDir = path.join(__dirname, 'data');

async function migrateData() {
  console.log('🔄 Starting data migration...\n');

  try {
    // Migrate users
    if (fs.existsSync(path.join(dataDir, 'users.json'))) {
      const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
      for (const user of users) {
        await pool.query(
          'INSERT INTO users (uid, email, name, role, blocked, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (uid) DO NOTHING',
          [user.uid, user.email, user.name, user.role || 'student', user.blocked || false, user.created_at || new Date()]
        );
      }
      console.log(`✓ Migrated ${users.length} users`);
    }

    // Migrate courses
    if (fs.existsSync(path.join(dataDir, 'courses.json'))) {
      const courses = JSON.parse(fs.readFileSync(path.join(dataDir, 'courses.json'), 'utf8'));
      for (const course of courses) {
        await pool.query(
          'INSERT INTO courses (course_id, title, description, price, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (course_id) DO NOTHING',
          [course.course_id, course.title, course.description, course.price || 0, course.created_at || new Date()]
        );
      }
      console.log(`✓ Migrated ${courses.length} courses`);
    }

    // Migrate sessions
    if (fs.existsSync(path.join(dataDir, 'sessions.json'))) {
      const sessions = JSON.parse(fs.readFileSync(path.join(dataDir, 'sessions.json'), 'utf8'));
      for (const session of sessions) {
        await pool.query(
          'INSERT INTO sessions (session_id, course_id, title, date, start_time, end_time, venue, total_seats, enrolled, price, topics, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (session_id) DO NOTHING',
          [
            session.session_id,
            session.course_id,
            session.title,
            session.date,
            session.start_time,
            session.end_time,
            session.venue,
            session.total_seats || 30,
            session.enrolled || 0,
            session.price || 0,
            session.topics || [],
            session.created_at || new Date()
          ]
        );
      }
      console.log(`✓ Migrated ${sessions.length} sessions`);
    }

    // Migrate purchases
    if (fs.existsSync(path.join(dataDir, 'purchases.json'))) {
      const purchases = JSON.parse(fs.readFileSync(path.join(dataDir, 'purchases.json'), 'utf8'));
      for (const purchase of purchases) {
        await pool.query(
          'INSERT INTO purchases (ticket_number, user_id, course_id, session_id, amount, payment_method, payment_id, status, purchased_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (ticket_number) DO NOTHING',
          [
            purchase.ticket_number,
            purchase.user_id,
            purchase.course_id,
            purchase.session_id,
            purchase.amount,
            purchase.payment_method,
            purchase.payment_id,
            purchase.status || 'completed',
            purchase.purchased_at || new Date()
          ]
        );
      }
      console.log(`✓ Migrated ${purchases.length} purchases`);
    }

    // Migrate enrollments
    if (fs.existsSync(path.join(dataDir, 'enrollments.json'))) {
      const enrollments = JSON.parse(fs.readFileSync(path.join(dataDir, 'enrollments.json'), 'utf8'));
      for (const enrollment of enrollments) {
        await pool.query(
          'INSERT INTO enrollments (enrollment_id, user_id, course_id, enrolled_at, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (enrollment_id) DO NOTHING',
          [
            enrollment.enrollment_id,
            enrollment.user_id,
            enrollment.course_id,
            enrollment.enrolled_at || new Date(),
            enrollment.status || 'active'
          ]
        );
      }
      console.log(`✓ Migrated ${enrollments.length} enrollments`);
    }

    console.log('\n🎉 Migration complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateData();
