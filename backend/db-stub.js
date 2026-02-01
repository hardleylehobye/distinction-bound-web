// Stub when MYSQL_URL points to localhost in production (e.g. on Render).
// Server starts so the port is detected; all DB calls throw so APIs return 503 with a clear message.

const msg = 'Database not configured: set MYSQL_URL to a hosted MySQL URL (PlanetScale, Railway, Aiven). localhost is not available on Render.';

async function stubReject() {
  const err = new Error(msg);
  err.code = 'DB_NOT_CONFIGURED';
  throw err;
}

const db = {
  async read() { await stubReject(); },
  async findOne() { await stubReject(); },
  async find() { await stubReject(); },
  async insert() { await stubReject(); },
  async update() { await stubReject(); },
  async delete() { await stubReject(); },
  pool: null
};

module.exports = db;
