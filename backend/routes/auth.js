const express = require('express');
const router = express.Router();
const db = require('../db');

// Login or Register user
router.post('/login', async (req, res) => {
  try {
    const { uid, email, name } = req.body;

    // Check if user exists
    let user = db.findOne('users', { email }) || db.findOne('users', { uid });

    if (!user) {
      // Create new user
      user = db.insert('users', {
        uid,
        email,
        name,
        role: 'student',
        blocked: false
      });
      console.log('✓ New user created:', email);
    } else {
      console.log('✓ User logged in:', email);
    }

    res.json({
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role,
      blocked: user.blocked
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

module.exports = router;
