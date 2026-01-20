const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all payouts (pending and paid)
router.get('/', (req, res) => {
  try {
    const payouts = db.find('payouts') || [];
    res.json(payouts);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Mark payout as paid
router.post('/mark-paid', (req, res) => {
  try {
    const { instructor_id, month, year, amount_paid, payment_method, payment_reference, paid_by } = req.body;
    
    const users = db.find('users');
    const instructor = users.find(u => u.id === parseInt(instructor_id));
    
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }
    
    const payout = db.insert('payouts', {
      payout_id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      instructor_id: parseInt(instructor_id),
      instructor_name: instructor.name,
      instructor_email: instructor.email,
      month: parseInt(month),
      year: parseInt(year),
      amount_paid: parseFloat(amount_paid),
      payment_method: payment_method || 'bank_transfer',
      payment_reference: payment_reference || '',
      paid_by: paid_by || 'admin',
      paid_at: new Date().toISOString(),
      status: 'completed'
    });
    
    res.status(201).json(payout);
  } catch (error) {
    console.error('Error marking payout as paid:', error);
    res.status(500).json({ error: 'Failed to mark payout as paid' });
  }
});

// Get payout history for an instructor
router.get('/instructor/:instructorId', (req, res) => {
  try {
    const payouts = db.find('payouts', { instructor_id: parseInt(req.params.instructorId) });
    res.json(payouts);
  } catch (error) {
    console.error('Error fetching instructor payouts:', error);
    res.status(500).json({ error: 'Failed to fetch instructor payouts' });
  }
});

// Get payouts for a specific month/year
router.get('/period/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const payouts = db.find('payouts', { 
      year: parseInt(year), 
      month: parseInt(month) 
    });
    res.json(payouts);
  } catch (error) {
    console.error('Error fetching period payouts:', error);
    res.status(500).json({ error: 'Failed to fetch period payouts' });
  }
});

module.exports = router;
