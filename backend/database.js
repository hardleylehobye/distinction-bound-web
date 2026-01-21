// Smart database wrapper - uses PostgreSQL in production, JSON files in development

const usePostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

let db;

if (usePostgres) {
  console.log('🗄️  Using PostgreSQL database (production)');
  db = require('./db-postgres');
} else {
  console.log('📁 Using JSON file database (development)');
  db = require('./db');
}

module.exports = db;
