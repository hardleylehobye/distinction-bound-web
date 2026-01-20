const express = require('express');
const router = express.Router();
const db = require('../db');

// Get tickets for a user
router.get('/user/:uid', (req, res) => {
  try {
    const user = db.findOne('users', { uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tickets = db.find('purchases', { user_id: user.id });
    
    // Enrich with session and course data
    const enriched = tickets.map(ticket => {
      const session = db.findOne('sessions', { session_id: ticket.session_id });
      const course = ticket.course_id ? db.findOne('courses', { course_id: ticket.course_id }) : null;
      
      return {
        ...ticket,
        session_title: session?.title,
        session_date: session?.date,
        session_venue: session?.venue,
        course_title: course?.title
      };
    });
    
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Create new ticket/purchase
router.post('/', (req, res) => {
  try {
    const { uid, session_id, course_id, amount, payment_method, payment_id, ticket_number } = req.body;
    
    const user = db.findOne('users', { uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate 6-digit ticket number
    const generateTicketNumber = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };
    
    const ticket = db.insert('purchases', {
      ticket_id: ticket_number || generateTicketNumber(),
      user_id: user.id,
      user_email: user.email,
      user_name: user.name,
      session_id,
      course_id,
      amount,
      payment_method: payment_method || 'yoco',
      payment_id,
      status: 'confirmed',
      purchased_at: new Date().toISOString()
    });
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

module.exports = router;
