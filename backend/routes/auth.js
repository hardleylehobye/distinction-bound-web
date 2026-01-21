const express = require('express');
const router = express.Router();
const db = require('../database');
const emailService = require('../services/emailService');

// Login or Register user
router.post('/login', async (req, res) => {
  try {
    const { uid, email, name } = req.body;

    // Check if user exists
    let user = db.findOne('users', { email }) || db.findOne('users', { uid });

    const isNewUser = !user;
    
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
      
      // Send welcome email (don't wait for it)
      emailService.sendWelcomeEmail(user).catch(err => 
        console.error('Failed to send welcome email:', err)
      );
      
      // Notify admin of new user
      const admin = db.findOne('users', { special_admin: true }) || db.findOne('users', { role: 'admin' });
      if (admin && admin.email) {
        emailService.sendAdminNewUserNotification(admin.email, user).catch(err =>
          console.error('Failed to send admin notification:', err)
        );
      }
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
