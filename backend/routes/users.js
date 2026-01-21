const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await db.find('users');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by UID
router.get('/:uid', async (req, res) => {
  try {
    const user = await db.findOne('users', { uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:uid', async (req, res) => {
  try {
    const { role, blocked } = req.body;
    const user = await db.update('users', { uid: req.params.uid }, { role, blocked });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;
