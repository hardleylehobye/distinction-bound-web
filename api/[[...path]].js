// Vercel serverless: all /api/* requests go to your Express backend, which connects to MYSQL_URL (e.g. Railway).
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { app } = require('../backend/server');

module.exports = (req, res) => {
  // Vercel catch-all may pass path as /api/courses - ensure Express gets it
  const url = req.url || req.path || '';
  if (url && !url.startsWith('/api')) {
    req.url = '/api' + (url.startsWith('/') ? url : '/' + url);
  }
  return app(req, res);
};
