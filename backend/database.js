// Smart database wrapper - uses PostgreSQL if DATABASE_URL is set, otherwise JSON files

const usePostgres = !!process.env.DATABASE_URL;

let db;

if (usePostgres) {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  console.log(`🗄️  Using PostgreSQL database (${env})`);
  db = require('./db-postgres');
} else {
  console.log('📁 Using JSON file database (local)');
  db = require('./db');
}

module.exports = db;
