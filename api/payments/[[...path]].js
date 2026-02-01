const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });
const { app } = require('../../backend/server');

module.exports = (req, res) => {
  const url = req.url || req.path || req.originalUrl || '';
  req.url = url.startsWith('/api/payments') ? url : '/api/payments' + (url.startsWith('/') ? url : '/' + url);
  return app(req, res);
};
