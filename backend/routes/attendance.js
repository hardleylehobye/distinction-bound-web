const express = require('express');
const router = express.Router();
const db = require('../database');

// Get attendance for a session (attendance table uses ticket_number, not ticket_id)
router.get('/session/:sessionId', async (req, res) => {
  try {
    const records = await db.find('attendance', { session_id: req.params.sessionId });
    
    const enriched = await Promise.all(records.map(async record => {
      const ticket = await db.findOne('purchases', { ticket_number: record.ticket_number });
      const user = ticket ? await db.findOne('users', { uid: ticket.user_id }) : null;
      
      return {
        ...record,
        student_name: user?.name || 'Unknown',
        student_email: user?.email || 'Unknown',
        ticket_number: record.ticket_number
      };
    }));
    
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Mark attendance using ticket number (purchases.column = ticket_number; attendance.columns = ticket_number, session_id, marked_by, marked_at)
router.post('/mark', async (req, res) => {
  try {
    const { ticket_number, session_id, marked_by } = req.body;
    
    const ticket = await db.findOne('purchases', { ticket_number });
    if (!ticket) {
      return res.status(404).json({ error: 'Invalid ticket number' });
    }
    
    const existing = await db.findOne('attendance', { ticket_number, session_id });
    if (existing) {
      return res.status(400).json({ error: 'Attendance already marked for this ticket' });
    }
    
    const record = await db.insert('attendance', {
      ticket_number,
      session_id,
      marked_by: marked_by || null
    });
    
    const user = await db.findOne('users', { uid: ticket.user_id });
    
    res.json({
      ...record,
      student_name: user?.name || 'Unknown',
      student_email: user?.email || 'Unknown',
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    const msg = error.sqlMessage || error.message || 'Failed to mark attendance';
    res.status(500).json({ error: 'Failed to mark attendance', message: msg });
  }
});

// Get student attendance by ticket number
router.get('/ticket/:ticketNumber', async (req, res) => {
  try {
    const ticket = await db.findOne('purchases', { ticket_number: req.params.ticketNumber });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const records = await db.find('attendance', { ticket_number: req.params.ticketNumber });
    res.json(records);
  } catch (error) {
    console.error('Error fetching ticket attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Delete attendance record (undo) – table uses id, not attendance_id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db.delete('attendance', { id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
});

module.exports = router;
