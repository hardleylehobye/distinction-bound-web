// Vercel serverless: all /api/* requests go to your Express backend, which connects to MYSQL_URL (e.g. Railway).
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { app } = require('../backend/server');

module.exports = async (req, res) => {
  try {
    const url = req.url || req.path || req.originalUrl || '';
    
    // Ensure the URL starts with /api
    if (url && !url.startsWith('/api')) {
      req.url = '/api' + (url.startsWith('/') ? url : '/' + url);
    }
    
    console.log('[API Handler] Method:', req.method, 'URL:', req.url || url);
    return app(req, res);
  } catch (error) {
    console.error('[API Handler] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
