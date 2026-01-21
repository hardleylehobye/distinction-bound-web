const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all sessions
router.get('/', async (req, res) => {
  try {
    const { courseId } = req.query;
    let sessions = courseId 
      ? await db.find('sessions', { course_id: courseId })
      : await db.find('sessions');
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session by ID
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await db.findOne('sessions', { session_id: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Create new session
router.post('/', async (req, res) => {
  try {
    const { course_id, title, date, start_time, end_time, venue, description, price, instructor_payout_percentage, total_seats, topics } = req.body;
    
    const session = await db.insert('sessions', {
      session_id: `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      course_id,
      title,
      date: date || new Date().toISOString().split('T')[0],
      start_time: start_time || '10:00:00',
      end_time: end_time || '12:00:00',
      venue: venue || 'TBA',
      description: description || '',
      price: price || 0,
      total_seats: total_seats || 30,
      enrolled: 0,
      topics: topics || [],
      instructor_payout_percentage: instructor_payout_percentage || 70
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update session
router.put('/:sessionId', async (req, res) => {
  try {
    const updated = await db.update('sessions', { session_id: req.params.sessionId }, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete session
router.delete('/:sessionId', async (req, res) => {
  try {
    const deleted = await db.delete('sessions', { session_id: req.params.sessionId });
    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;
