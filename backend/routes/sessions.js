const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all sessions (add combined time field for frontend)
router.get('/', async (req, res) => {
  try {
    const { courseId } = req.query;
    let sessions = courseId 
      ? await db.find('sessions', { course_id: courseId })
      : await db.find('sessions');
    
    // Add combined time field and parse topics JSON
    sessions = sessions.map(s => ({
      ...s,
      time: s.start_time && s.end_time 
        ? `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`
        : (s.start_time ? s.start_time.slice(0, 5) : ''),
      topics: typeof s.topics === 'string' ? JSON.parse(s.topics || '[]') : (s.topics || [])
    }));
    
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session by ID (add combined time field for frontend)
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await db.findOne('sessions', { session_id: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    // Add combined time field and parse topics
    const enriched = {
      ...session,
      time: session.start_time && session.end_time
        ? `${session.start_time.slice(0, 5)} - ${session.end_time.slice(0, 5)}`
        : (session.start_time ? session.start_time.slice(0, 5) : ''),
      topics: typeof session.topics === 'string' ? JSON.parse(session.topics || '[]') : (session.topics || [])
    };
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Create new session
router.post('/', async (req, res) => {
  try {
    const { course_id, title, date, start_time, end_time, time, venue, location, description, price, instructor_payout_percentage, total_seats, capacity, topics } = req.body;
    
    // Parse time field (e.g. "15:00 - 17:00") if provided
    let finalStartTime = start_time || '10:00:00';
    let finalEndTime = end_time || '12:00:00';
    if (time && time.includes('-')) {
      const [start, end] = time.split('-').map(t => t.trim());
      if (start) finalStartTime = start.length === 5 ? start + ':00' : start;
      if (end) finalEndTime = end.length === 5 ? end + ':00' : end;
    }
    
    const session = await db.insert('sessions', {
      session_id: `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      course_id,
      title,
      date: date || new Date().toISOString().split('T')[0],
      start_time: finalStartTime,
      end_time: finalEndTime,
      venue: venue || location || 'TBA',
      description: description || '',
      price: price || 0,
      total_seats: total_seats || capacity || 30,
      enrolled: 0,
      topics: JSON.stringify(topics || []),
      instructor_payout_percentage: instructor_payout_percentage || 70
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    const msg = error.sqlMessage || error.message || 'Failed to create session';
    res.status(500).json({ error: msg });
  }
});

// Update session
router.put('/:sessionId', async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Parse time field if provided (e.g. "15:00 - 17:00")
    if (updates.time && updates.time.includes('-')) {
      const [start, end] = updates.time.split('-').map(t => t.trim());
      if (start) updates.start_time = start.length === 5 ? start + ':00' : start;
      if (end) updates.end_time = end.length === 5 ? end + ':00' : end;
    }
    
    // Handle venue/location aliases
    if (updates.location && !updates.venue) {
      updates.venue = updates.location;
    }
    
    // Handle capacity/total_seats aliases
    if (updates.capacity && !updates.total_seats) {
      updates.total_seats = updates.capacity;
    }
    
    // Stringify topics if array
    if (Array.isArray(updates.topics)) {
      updates.topics = JSON.stringify(updates.topics);
    }
    
    // Only allow valid database columns (filter out computed fields and auto-managed fields)
    const validColumns = ['session_id', 'course_id', 'title', 'date', 'start_time', 'end_time', 'venue', 'description', 'price', 'total_seats', 'enrolled', 'topics', 'instructor_payout_percentage'];
    const filteredUpdates = {};
    validColumns.forEach(col => {
      if (updates[col] !== undefined) {
        filteredUpdates[col] = updates[col];
      }
    });
    
    const updated = await db.update('sessions', { session_id: req.params.sessionId }, filteredUpdates);
    if (!updated) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating session:', error);
    const msg = error.sqlMessage || error.message || 'Failed to update session';
    res.status(500).json({ error: msg });
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
