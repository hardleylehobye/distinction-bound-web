// Vercel serverless: all /api/* requests go to your Express backend, which connects to MYSQL_URL (e.g. Railway).
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { app } = require('../backend/server');

module.exports = async (req, res) => {
  try {
    // Full path for Express: use request URL or build from catch-all path segments
    let url = req.url || req.path || req.originalUrl || '';
    if (req.query && req.query.path) {
      const seg = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
      if (seg && !url.startsWith('/api')) url = '/api/' + seg.replace(/^\/+/, '');
    }
    if (url && !url.startsWith('/api')) {
      req.url = '/api' + (url.startsWith('/') ? url : '/' + url);
    } else if (url) {
      req.url = url;
    }
    return app(req, res);
  } catch (error) {
    console.error('[API Handler] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
