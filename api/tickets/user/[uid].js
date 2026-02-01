// Handler for GET /api/tickets/user/:uid
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'backend', '.env') });

const { app } = require('../../../backend/server');

module.exports = (req, res) => {
  const uid = req.query?.uid || '';
  req.url = `/api/tickets/user/${uid}`;
  return app(req, res);
};
