const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all sessions
router.get('/', (req, res) => {
  try {
    const { courseId } = req.query;
    let sessions = courseId 
      ? db.find('sessions', { course_id: courseId })
      : db.find('sessions');
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session by ID
router.get('/:sessionId', (req, res) => {
  try {
    const session = db.findOne('sessions', { session_id: req.params.sessionId });
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
router.post('/', (req, res) => {
  try {
    const { course_id, title, date, venue, description, price, instructor_payout_percentage } = req.body;
    
    const session = db.insert('sessions', {
      session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      course_id,
      title,
      date,
      venue: venue || 'TBA',
      description: description || '',
      price: price || 0,
      instructor_payout_percentage: instructor_payout_percentage || 70,
      created_at: new Date().toISOString()
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update session
router.put('/:sessionId', (req, res) => {
  try {
    const updated = db.update('sessions', { session_id: req.params.sessionId }, req.body);
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
router.delete('/:sessionId', (req, res) => {
  try {
    const deleted = db.delete('sessions', { session_id: req.params.sessionId });
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
