const express = require('express');
const router = express.Router();
const axios = require('axios');

// Yoco API configuration
const YOCO_SECRET_KEY = process.env.YOCO_TEST_SECRET_KEY;
const YOCO_PUBLIC_KEY = process.env.YOCO_TEST_PUBLIC_KEY;
const YOCO_API_URL = 'https://payments.yoco.com/api';

// Validate required environment variables
if (!YOCO_SECRET_KEY || !YOCO_PUBLIC_KEY) {
  console.error('⚠️ WARNING: Yoco API keys not configured!');
  console.error('Please set YOCO_TEST_SECRET_KEY and YOCO_TEST_PUBLIC_KEY in your .env file');
}

// Create Yoco checkout
router.post('/yoco/checkout', async (req, res) => {
  try {
    const { amount, currency, metadata, successUrl, cancelUrl, failureUrl, externalId } = req.body;
    
    const payload = {
      amount: amount * 100, // Convert to cents
      currency: currency || 'ZAR',
      successUrl: successUrl || `${req.headers.origin}/payment-result?provider=yoco&result=success`,
      cancelUrl: cancelUrl || `${req.headers.origin}/payment-result?provider=yoco&result=cancelled`,
      failureUrl: failureUrl || `${req.headers.origin}/payment-result?provider=yoco&result=failed`,
      metadata: metadata || {}
    };

    // Add external ID if provided
    if (externalId) {
      payload.externalId = externalId;
    }

    console.log('🎫 Creating Yoco checkout with payload:', payload);

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

    console.log('✅ Yoco checkout created:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Yoco checkout error:', error.response?.data || error.message);
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

// Get checkout status
router.get('/checkouts/:checkoutId', async (req, res) => {
  try {
    const { checkoutId } = req.params;
    
    const response = await axios.get(
      `${YOCO_API_URL}/checkouts/${checkoutId}`,
      {
        headers: {
          'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Yoco checkout status error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get checkout status',
      details: error.response?.data || error.message 
    });
  }
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
