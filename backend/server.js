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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
