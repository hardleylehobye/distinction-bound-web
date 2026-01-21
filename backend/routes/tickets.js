const express = require('express');
const router = express.Router();
const db = require('../db');
const emailService = require('../services/emailService');

// Get tickets for a user
router.get('/user/:uid', (req, res) => {
  try {
    const user = db.findOne('users', { uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const ticketsByDbId = db.find('purchases', { user_id: user.id });
    const ticketsByUid = db.find('purchases', { user_id: req.params.uid });
    const tickets = [...ticketsByDbId, ...ticketsByUid];
    
    // Enrich with session and course data
    const enriched = tickets.map(ticket => {
      const session = db.findOne('sessions', { session_id: ticket.session_id });
      const course = ticket.course_id ? db.findOne('courses', { id: ticket.course_id }) : null;
      
      return {
        ...ticket,
        session_title: ticket.session_title || session?.title,
        session_date: ticket.session_date || session?.date,
        session_time: ticket.session_time || session?.time,
        session_venue: ticket.session_venue || session?.venue || session?.location,
        course_title: ticket.course_title || course?.title
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
    console.log('🎫 Creating ticket with body:', req.body);
    const { 
      uid, 
      session_id, 
      course_id, 
      session_title,
      session_date,
      session_time,
      session_venue,
      course_title,
      amount, 
      payment_method, 
      payment_id, 
      ticket_number, 
      is_test 
    } = req.body;
    
    const user = db.findOne('users', { uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user already has a ticket for this session (prevent duplicates)
    const existingTicket = db.find('purchases').find(p => 
      (p.user_id === uid || p.user_id === user.id) && p.session_id === session_id
    );
    
    if (existingTicket) {
      return res.status(400).json({ 
        error: 'You already have a ticket for this session',
        ticket: existingTicket 
      });
    }
    
    // Generate 6-digit ticket number
    const generateTicketNumber = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };
    
    const ticket = db.insert('purchases', {
      ticket_id: ticket_number || generateTicketNumber(),
      user_id: uid, // Use Firebase UID instead of database ID
      user_email: user.email,
      user_name: user.name,
      session_id,
      course_id,
      session_title,
      session_date,
      session_time,
      session_venue,
      course_title,
      amount,
      payment_method: payment_method || 'yoco',
      payment_id,
      status: 'confirmed',
      is_test: is_test || false, // Flag test payments
      purchased_at: new Date().toISOString()
    });
    
    console.log(is_test ? '🧪 TEST' : '✅', 'Ticket created:', ticket.ticket_id, 'for user:', user.email);
    console.log('🎫 Ticket object:', ticket);
    
    // Send payment receipt email with ticket (only to verified email)
    const session = db.findOne('sessions', { session_id });
    const course = course_id ? db.findOne('courses', { id: course_id }) : null;
    
    if (session && course) {
      // Only send email if user email is the verified Resend email
      if (user.email === 'hardleylehobye@gmail.com') {
        emailService.sendPaymentReceiptEmail(user, ticket, session, course).catch(err =>
          console.error('Failed to send payment receipt:', err)
        );
      } else {
        console.log('📧 [SKIPPED] Payment receipt email - Resend free tier only sends to hardleylehobye@gmail.com');
        console.log('💡 To enable emails for all users, verify a domain at resend.com/domains');
      }
    }
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

module.exports = router;
