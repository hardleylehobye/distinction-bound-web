const express = require('express');
const router = express.Router();
const db = require('../database');

// Get notes for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const notes = await db.find('notes', { session_id: req.params.sessionId });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create new note
router.post('/', async (req, res) => {
  try {
    const { note_id, session_id, title, url } = req.body;
    const note = await db.insert('notes', { note_id, session_id, title, url });
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

module.exports = router;
