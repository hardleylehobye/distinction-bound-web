const express = require('express');
const router = express.Router();
const db = require('../database');

// Get videos for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const videos = await db.find('videos', { session_id: req.params.sessionId });
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Create new video
router.post('/', async (req, res) => {
  try {
    const { video_id, session_id, title, url, duration } = req.body;
    const video = await db.insert('videos', { video_id, session_id, title, url, duration });
    res.status(201).json(video);
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

module.exports = router;
