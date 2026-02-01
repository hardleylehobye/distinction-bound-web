// Database wrapper - Firebase or MySQL only
// Production (e.g. Render): set MYSQL_URL to a *remote* MySQL URL (PlanetScale, Railway, Aiven).
// localhost/127.0.0.1 is not available on Render – the app will start but DB calls will fail until you set a hosted MySQL URL.

const useFirebase = !!(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS);
const rawMysqlUrl = (process.env.MYSQL_URL || process.env.DATABASE_URL || '').trim();
const mysqlUrl = rawMysqlUrl && String(rawMysqlUrl).toLowerCase().startsWith('mysql') ? rawMysqlUrl : '';
const isLocalhostMysql = mysqlUrl && (mysqlUrl.includes('localhost') || mysqlUrl.includes('127.0.0.1'));
const useMysql = !useFirebase && !!mysqlUrl && !(process.env.NODE_ENV === 'production' && isLocalhostMysql);

let db;

if (useFirebase) {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  console.log(`🔥 Using Firebase (Firestore) database (${env})`);
  db = require('./db-firebase');
} else if (useMysql) {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  console.log(`🐬 Using MySQL database (${env})`);
  db = require('./db-mysql');
} else if (process.env.NODE_ENV === 'production' && isLocalhostMysql) {
  console.warn('⚠️ MYSQL_URL is set to localhost – not available on Render. Server will start but DB calls will fail.');
  console.warn('   Set MYSQL_URL to a hosted MySQL URL (e.g. PlanetScale, Railway, Aiven) in Render Environment.');
  db = require('./db-stub');
} else if (mysqlUrl) {
  console.error('❌ Database URL must start with mysql://');
  process.exit(1);
} else {
  console.error('❌ No database configured.');
  console.error('   For MySQL: set MYSQL_URL=mysql://user:password@host:3306/dbname (use a *remote* host on Render).');
  console.error('   For Firebase: set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON.');
  process.exit(1);
}

module.exports = db;
