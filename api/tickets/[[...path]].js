// Handler for /api/tickets/* - fixes 404 on nested paths like /api/tickets/user/:uid
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

const { app } = require('../../backend/server');

module.exports = (req, res) => {
  const url = req.url || req.path || req.originalUrl || '';
  const fullPath = url.startsWith('/api/tickets') ? url : '/api/tickets' + (url.startsWith('/') ? url : '/' + url);
  req.url = fullPath;
  return app(req, res);
};
