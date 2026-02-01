const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// POST /api/contact – submit grievance / enquiry; email goes to support and user gets auto-reply
router.post('/', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { name, email, subject, message, phone } = body;
    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Name, email and message are required.',
      });
    }

    const result = await emailService.sendContactEnquiry({
      name: String(name).trim(),
      email: String(email).trim(),
      subject: subject ? String(subject).trim() : 'Enquiry / Grievance',
      message: String(message).trim(),
      phone: phone ? String(phone).trim() : undefined,
    });

    if (!result.success) {
      const err = result.error;
      const errStr = typeof err === 'string' ? err : (err?.message || (err && JSON.stringify(err)) || 'Failed to send your message. Please try again.');
      console.error('Contact send failed:', errStr);
      // 503 when email service is not configured; 500 for send failures
      const status = errStr.includes('not configured') ? 503 : 500;
      return res.status(status).json({
        error: errStr,
      });
    }

    const autoReply = await emailService.sendContactAutoReply(
      String(email).trim(),
      String(name).trim()
    );
    if (!autoReply.success) {
      console.warn('Contact auto-reply failed:', autoReply.error);
    }

    res.status(200).json({
      success: true,
      message: 'Your query has been received. We have sent a confirmation to your email.',
    });
  } catch (error) {
    console.error('Contact route error:', error);
    res.status(500).json({
      error: error.message || 'Something went wrong. Please try again.',
    });
  }
});

module.exports = router;
