const express = require('express');
const router = express.Router();
const axios = require('axios');

// Yoco API: use live keys in production (real payments), test keys otherwise
const useLive = process.env.NODE_ENV === 'production' || process.env.YOCO_USE_LIVE === 'true';
const YOCO_SECRET_KEY = (useLive
  ? (process.env.YOCO_LIVE_SECRET_KEY || '').trim()
  : (process.env.YOCO_TEST_SECRET_KEY || '').trim()
) || (process.env.YOCO_TEST_SECRET_KEY || '').trim();
const YOCO_PUBLIC_KEY = (useLive
  ? (process.env.YOCO_LIVE_PUBLIC_KEY || '').trim()
  : (process.env.YOCO_TEST_PUBLIC_KEY || '').trim()
) || (process.env.YOCO_TEST_PUBLIC_KEY || '').trim();
const YOCO_API_URL = 'https://payments.yoco.com/api';

if (useLive) {
  console.log('💰 Yoco: using LIVE keys (real payments)');
} else {
  console.log('🧪 Yoco: using TEST keys');
}
if (!YOCO_SECRET_KEY || !YOCO_PUBLIC_KEY) {
  console.error('⚠️ WARNING: Yoco API keys not configured!');
  console.error('Set YOCO_TEST_* in .env for development, YOCO_LIVE_* for production.');
}

// Create Yoco checkout
router.post('/yoco/checkout', async (req, res) => {
  try {
    if (!YOCO_SECRET_KEY || !YOCO_PUBLIC_KEY) {
      return res.status(503).json({
        error: 'Payment gateway not configured',
        message: 'Yoco API keys are not set. Add YOCO_TEST_SECRET_KEY and YOCO_TEST_PUBLIC_KEY to the server .env file (get keys from https://portal.yoco.com/settings/api-keys).'
      });
    }

    const body = req.body || {};
    const { amount, currency, metadata, successUrl, cancelUrl, failureUrl, externalId } = body;

    // Backend expects amount in Rands; convert to integer cents for Yoco
    const amountRands = Number(amount);
    if (isNaN(amountRands) || amountRands <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number (in Rands).'
      });
    }
    const amountCents = Math.round(amountRands * 100);

    const payload = {
      amount: amountCents,
      currency: currency || 'ZAR',
      successUrl: successUrl || `${req.headers.origin || 'http://localhost:3000'}/payment-result?provider=yoco&result=success`,
      cancelUrl: cancelUrl || `${req.headers.origin || 'http://localhost:3000'}/payment-result?provider=yoco&result=cancelled`,
      failureUrl: failureUrl || `${req.headers.origin || 'http://localhost:3000'}/payment-result?provider=yoco&result=failed`,
      metadata: metadata || {}
    };

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
        },
        validateStatus: () => true // so we can inspect error response body
      }
    );

    if (response.status >= 400) {
      const errBody = response.data || {};
      const msg = errBody?.message || errBody?.error || errBody?.detail || errBody?.code || response.statusText;
      console.error('❌ Yoco API error:', response.status, JSON.stringify(errBody));
      return res.status(response.status).json({
        error: 'Failed to create checkout',
        message: msg || 'Yoco API returned an error',
        details: errBody
      });
    }

    const data = response.data;
    if (!data || typeof data !== 'object') {
      console.error('❌ Yoco returned invalid data:', typeof data, data);
      return res.status(502).json({
        error: 'Invalid response from payment gateway',
        message: 'Yoco returned an invalid response. Please try again.'
      });
    }
    console.log('✅ Yoco checkout created:', data.id || data);
    res.json(data);
  } catch (error) {
    const details = error.response?.data;
    const status = error.response?.status || 500;
    let message = error.message || 'Failed to create checkout';
    if (details) {
      if (typeof details === 'string') message = details;
      else {
        const fromDetails = details.message || details.error || details.detail || details.code || details.type ||
          (Array.isArray(details.errors) ? details.errors.map(e => e.message || e).join(', ') : null);
        if (fromDetails) message = fromDetails;
        else if (typeof details === 'object') message = JSON.stringify(details).slice(0, 300);
      }
    }
    // Include raw error hint for debugging (network errors have no .response)
    const hint = error.code || (error.response ? `Yoco returned ${error.response.status}` : 'Network or server error');
    if (message === 'Failed to create checkout' && (error.message || error.code)) {
      message = error.message || error.code || message;
    }
    console.error('❌ Yoco checkout error:', status, message, 'hint:', hint);
    console.error('   error.message:', error.message, 'error.code:', error.code, 'response?:', !!error.response, 'details:', typeof details, details ? JSON.stringify(details).slice(0, 400) : '');
    res.status(status).json({ 
      error: 'Failed to create checkout',
      message: message,
      details: details || error.message || error.code || null
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
