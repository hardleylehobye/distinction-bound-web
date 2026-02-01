// Handler for /api/enrollments/* - fixes 404 on nested paths like /api/enrollments/user/:uid
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

const { app } = require('../../backend/server');

module.exports = (req, res) => {
  const url = req.url || req.path || req.originalUrl || '';
  const fullPath = url.startsWith('/api/enrollments') ? url : '/api/enrollments' + (url.startsWith('/') ? url : '/' + url);
  req.url = fullPath;
  return app(req, res);
};
