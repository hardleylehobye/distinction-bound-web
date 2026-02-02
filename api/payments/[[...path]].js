const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });
const { app } = require('../../backend/server');

module.exports = async (req, res) => {
  try {
    // Vercel strips /api/payments, so req.url might be /yoco/checkout
    // We need to reconstruct the full path for Express
    const url = req.url || req.path || req.originalUrl || '';
    const fullPath = url.startsWith('/api/payments') 
      ? url 
      : '/api/payments' + (url.startsWith('/') ? url : '/' + url);
    
    console.log('[Payments Handler] Original URL:', url, '→ Full path:', fullPath);
    console.log('[Payments Handler] Method:', req.method);
    req.url = fullPath;
    
    return app(req, res);
  } catch (error) {
    console.error('[Payments Handler] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
