const express = require('express');
const router = express.Router();
const db = require('../database');

// Get attendance for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const attendance = await db.find('attendance', { session_id: req.params.sessionId });
    
    // Enrich with student and ticket info
    const enriched = await Promise.all(attendance.map(async record => {
      const ticket = await db.findOne('purchases', { ticket_id: record.ticket_id });
      const user = ticket ? await db.findOne('users', { id: ticket.user_id }) : null;
      
      return {
        ...record,
        student_name: ticket?.user_name || user?.name || 'Unknown',
        student_email: ticket?.user_email || user?.email || 'Unknown',
        ticket_number: ticket?.ticket_id
      };
    }));
    
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Mark attendance using ticket number
router.post('/mark', async (req, res) => {
  try {
    const { ticket_number, session_id, marked_by } = req.body;
    
    // Find ticket
    const ticket = await db.findOne('purchases', { ticket_id: ticket_number });
    if (!ticket) {
      return res.status(404).json({ error: 'Invalid ticket number' });
    }
    
    // Check if already marked
    const existing = await db.findOne('attendance', { 
      ticket_id: ticket_number, 
      session_id 
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Attendance already marked for this ticket' });
    }
    
    // Mark attendance
    const attendance = await db.insert('attendance', {
      attendance_id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ticket_id: ticket_number,
      session_id,
      student_id: ticket.user_id,
      marked_by,
      marked_at: new Date().toISOString(),
      status: 'present'
    });
    
    // Get student info
    const user = await db.findOne('users', { id: ticket.user_id });
    
    res.json({
      ...attendance,
      student_name: ticket.user_name || user?.name || 'Unknown',
      student_email: ticket.user_email || user?.email || 'Unknown',
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get student attendance by ticket number
router.get('/ticket/:ticketNumber', async (req, res) => {
  try {
    const ticket = await db.findOne('purchases', { ticket_id: req.params.ticketNumber });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const attendance = await db.find('attendance', { ticket_id: req.params.ticketNumber });
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching ticket attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Delete attendance record (undo)
router.delete('/:attendanceId', async (req, res) => {
  try {
    const deleted = await db.delete('attendance', { attendance_id: req.params.attendanceId });
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
