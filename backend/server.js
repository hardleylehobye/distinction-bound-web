// Load environment variables FIRST (from backend folder so Yoco keys etc. are found)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const coursesRoutes = require('./routes/courses');
const sessionsRoutes = require('./routes/sessions');
const enrollmentsRoutes = require('./routes/enrollments');
const notesRoutes = require('./routes/notes');
const videosRoutes = require('./routes/videos');
const paymentsRoutes = require('./routes/payments');
const ticketsRoutes = require('./routes/tickets');
const attendanceRoutes = require('./routes/attendance');
const financeRoutes = require('./routes/finance');
const payoutsRoutes = require('./routes/payouts');
const contactRoutes = require('./routes/contact');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/payouts', payoutsRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Distinction Bound API is running' });
});

// Global error handler – catch unhandled route errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'An unexpected error occurred. Please try again or contact support if the issue persists.' });
});

// When run directly (e.g. node server.js on your PC), start the server.
// When required by Vercel (api/[[...path]].js), only export app.
if (require.main === module) {
  const basePort = Number(PORT) || 5000;
  const maxTries = 10;

  function tryListen(port) {
    if (port > basePort + maxTries) {
      console.error(`Could not start: ports ${basePort}-${basePort + maxTries} are in use. Free one (e.g. close the other terminal) or set PORT in .env.`);
      process.exit(1);
    }
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${server.address().port}`);
      if (server.address().port !== basePort) {
        console.log(`   (Port ${basePort} was in use. If using the React app, set REACT_APP_API_URL=http://localhost:${server.address().port}/api)`);
      }
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} in use, trying ${port + 1}...`);
        tryListen(port + 1);
      } else {
        throw err;
      }
    });
  }

  tryListen(basePort);
}

module.exports = { app, PORT };
