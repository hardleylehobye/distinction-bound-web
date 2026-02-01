// Database wrapper - Firebase or MySQL only

const useFirebase = !!(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS);
const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
const useMysql = !useFirebase && mysqlUrl && String(mysqlUrl).startsWith('mysql');

let db;

if (useFirebase) {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  console.log(`🔥 Using Firebase (Firestore) database (${env})`);
  db = require('./db-firebase');
} else if (useMysql) {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  console.log(`🐬 Using MySQL database (${env})`);
  db = require('./db-mysql');
} else {
  console.error('❌ No database configured. Set Firebase (GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON) or MYSQL_URL / DATABASE_URL (mysql://...).');
  process.exit(1);
}

module.exports = db;
