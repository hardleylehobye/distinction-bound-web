const express = require('express');
const router = express.Router();
const db = require('../database');
const emailService = require('../services/emailService');

// Get tickets for a user
router.get('/user/:uid', async (req, res) => {
  try {
    const user = await db.findOne('users', { uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get tickets by user_id (which is the UID in our system)
    const tickets = await db.find('purchases', { user_id: req.params.uid });
    
    // Enrich with session and course data (session has start_time/end_time in DB, no .time column)
    const enriched = await Promise.all(tickets.map(async ticket => {
      const session = await db.findOne('sessions', { session_id: ticket.session_id });
      const course = ticket.course_id ? await db.findOne('courses', { course_id: ticket.course_id }) : null;
      const sessionTime = session?.start_time && session?.end_time
        ? `${String(session.start_time).slice(0, 5)} - ${String(session.end_time).slice(0, 5)}`
        : (session?.start_time ? String(session.start_time).slice(0, 5) : null);
      return {
        ...ticket,
        session_title: ticket.session_title || session?.title,
        session_date: ticket.session_date || session?.date,
        session_time: ticket.session_time || sessionTime,
        session_venue: ticket.session_venue || session?.venue || session?.location,
        course_title: ticket.course_title || course?.title
      };
    }));
    
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Create new ticket/purchase
router.post('/', async (req, res) => {
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
    
    const user = await db.findOne('users', { uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user already has a ticket for this session (prevent duplicates)
    const allTickets = await db.find('purchases');
    const existingTicket = allTickets.find(p => 
      p.user_id === uid && p.session_id === session_id
    );
    
    if (existingTicket) {
      return res.status(400).json({ 
        error: 'You already have a ticket for this session',
        ticket: existingTicket 
      });
    }
    
    // Generate 6-digit ticket number (purchases table has ticket_number, not ticket_id)
    const generateTicketNumber = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };
    const ticketNum = ticket_number || generateTicketNumber();

    // Only insert columns that exist on purchases table
    const ticket = await db.insert('purchases', {
      ticket_number: ticketNum,
      user_id: uid,
      course_id: course_id || null,
      session_id: session_id || null,
      amount: amount != null ? Number(amount) : 0,
      payment_method: payment_method || 'yoco',
      payment_id: payment_id || null,
      status: 'completed'
    });

    console.log(is_test ? '🧪 TEST' : '✅', 'Ticket created:', ticketNum, 'for user:', user.email);
    console.log('🎫 Ticket object:', ticket);
    
    // Send payment receipt email with ticket (only to verified email)
    const session = await db.findOne('sessions', { session_id });
    const course = course_id ? await db.findOne('courses', { course_id: course_id }) : null;
    
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
    const msg = error.sqlMessage || error.message || 'Failed to create ticket';
    res.status(500).json({ error: 'Failed to create ticket', message: msg });
  }
});

module.exports = router;
