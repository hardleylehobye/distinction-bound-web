const express = require('express');
const router = express.Router();
const axios = require('axios');

// Yoco API configuration
const YOCO_SECRET_KEY = process.env.YOCO_TEST_SECRET_KEY || 'sk_test_4ce5a3e9M180byY06c545a3bb73a';
const YOCO_PUBLIC_KEY = process.env.YOCO_TEST_PUBLIC_KEY || 'pk_test_0695bfb0dVebl6Jbf9a4';
const YOCO_API_URL = 'https://payments.yoco.com/api';

// Create Yoco checkout
router.post('/yoco/checkout', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;
    
    const payload = {
      amount: amount * 100, // Convert to cents
      currency: currency || 'ZAR',
      successUrl: `${req.headers.origin}/payment/success`,
      cancelUrl: `${req.headers.origin}/payment/cancel`,
      failureUrl: `${req.headers.origin}/payment/failure`,
      metadata: metadata || {}
    };

    const response = await axios.post(
      `${YOCO_API_URL}/checkouts`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Yoco checkout error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create checkout',
      details: error.response?.data || error.message 
    });
  }
});

// Get public key
router.get('/yoco/public-key', (req, res) => {
  res.json({ publicKey: YOCO_PUBLIC_KEY });
});

// Webhook handler for Yoco payment notifications
router.post('/yoco/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    console.log('Yoco webhook received:', event);
    
    // Handle different event types
    switch (event.type) {
      case 'payment.succeeded':
        // Handle successful payment
        console.log('Payment succeeded:', event.payload);
        break;
      case 'payment.failed':
        // Handle failed payment
        console.log('Payment failed:', event.payload);
        break;
      default:
        console.log('Unknown event type:', event.type);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
