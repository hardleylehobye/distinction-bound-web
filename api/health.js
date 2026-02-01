// Simple health check - if this works, Vercel API routing is fine
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ status: 'ok', message: 'API reachable', time: new Date().toISOString() });
};
