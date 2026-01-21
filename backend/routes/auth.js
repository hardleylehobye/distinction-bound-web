const express = require('express');
const router = express.Router();
const db = require('../database');
const emailService = require('../services/emailService');

// Login or Register user
router.post('/login', async (req, res) => {
  try {
    const { uid, email, name } = req.body;

    // Check if user exists (check email first, then uid)
    let user = await db.findOne('users', { email });
    if (!user) {
      user = await db.findOne('users', { uid });
    }
    
    // If found by email but different UID, update the UID
    if (user && user.uid !== uid) {
      user = await db.update('users', { email }, { uid, name });
    }

    const isNewUser = !user;
    
    if (!user) {
      // Create new user
      user = await db.insert('users', {
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
      const admin = await db.findOne('users', { special_admin: true }) || await db.findOne('users', { role: 'admin' });
      if (admin && admin.email) {
        emailService.sendAdminNewUserNotification(admin.email, user).catch(err =>
          console.error('Failed to send admin notification:', err)
        );
      }
    } else {
      console.log('✓ User logged in:', email, '- Role:', user.role);
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
