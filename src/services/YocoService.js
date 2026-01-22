// Yoco Payment Service
// Handles Yoco payment gateway integration for South African payments

class YocoService {
  constructor() {
    // Use production URL as fallback if env var not set and not on localhost
    const getApiBaseUrl = () => {
      if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
      }
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
      }
      return 'https://distinction-bound-web.onrender.com/api';
    };
    this.baseURL = getApiBaseUrl() + '/payments';
    this.publicKey = null;
  }
  
  async getPublicKey() {
    if (this.publicKey) return this.publicKey;
    
    try {
      const response = await fetch(`${this.baseURL}/yoco/public-key`);
      const data = await response.json();
      this.publicKey = data.publicKey;
      return this.publicKey;
    } catch (error) {
      console.error('Error fetching public key:', error);
      return 'pk_test_0695bfb0dVebl6Jbf9a4';
    }
  }

  /**
   * Create a new checkout session
   * @param {Object} paymentData - Payment information
   * @param {number} paymentData.amount - Amount in cents (e.g., 10000 = R100.00)
   * @param {string} paymentData.currency - Currency code (ZAR)
   * @param {string} paymentData.successUrl - URL for successful payment
   * @param {string} paymentData.cancelUrl - URL for cancelled payment
   * @param {string} paymentData.failureUrl - URL for failed payment
   * @param {Object} paymentData.metadata - Additional payment metadata
   * @returns {Promise<Object>} Checkout session data
   */
  async createCheckout(paymentData) {
    try {
      const payload = {
        amount: paymentData.amount / 100, // Convert from cents to rands for backend
        currency: paymentData.currency || 'ZAR',
        successUrl: paymentData.successUrl || `${window.location.origin}/payment/success`,
        cancelUrl: paymentData.cancelUrl || `${window.location.origin}/payment/cancelled`,
        failureUrl: paymentData.failureUrl || `${window.location.origin}/payment/failed`,
        metadata: paymentData.metadata || {}
      };

      // Add line items if provided
      if (paymentData.lineItems) {
        payload.lineItems = paymentData.lineItems;
      }

      // Add external ID for tracking
      if (paymentData.externalId) {
        payload.externalId = paymentData.externalId;
      }

      const response = await fetch(`${this.baseURL}/yoco/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Yoco API Error: ${errorData.message || response.statusText}`);
      }

      const checkoutData = await response.json();
      console.log('Yoco checkout created:', checkoutData);
      return checkoutData;

    } catch (error) {
      console.error('Error creating Yoco checkout:', error);
      throw error;
    }
  }

  /**
   * Get checkout status
   * @param {string} checkoutId - The checkout ID
   * @returns {Promise<Object>} Checkout status data
   */
  async getCheckoutStatus(checkoutId) {
    try {
      const response = await fetch(`${this.baseURL}/checkouts/${checkoutId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Yoco API Error: ${errorData.message || response.statusText}`);
      }

      const checkoutData = await response.json();
      return checkoutData;

    } catch (error) {
      console.error('Error getting Yoco checkout status:', error);
      throw error;
    }
  }

  /**
   * Refund a payment
   * @param {string} checkoutId - The checkout ID to refund
   * @param {number} amount - Amount to refund in cents (optional, defaults to full amount)
   * @returns {Promise<Object>} Refund data
   */
  async refundPayment(checkoutId, amount = null) {
    try {
      const payload = {};
      if (amount) {
        payload.amount = amount;
      }

      const response = await fetch(`${this.baseURL}/checkouts/${checkoutId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Yoco API Error: ${errorData.message || response.statusText}`);
      }

      const refundData = await response.json();
      console.log('Yoco refund processed:', refundData);
      return refundData;

    } catch (error) {
      console.error('Error processing Yoco refund:', error);
      throw error;
    }
  }

  /**
   * Create payment line items
   * @param {Array} items - Array of items to purchase
   * @returns {Array} Formatted line items for Yoco
   */
  createLineItems(items) {
    return items.map(item => ({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity || 1,
      amount: item.amount * 100, // Convert to cents
      currency: 'ZAR'
    }));
  }

  /**
   * Format amount for Yoco (convert R to cents)
   * @param {number} amount - Amount in Rands
   * @returns {number} Amount in cents
   */
  formatAmount(amount) {
    return Math.round(amount * 100);
  }

  /**
   * Parse amount from Yoco (convert cents to Rands)
   * @param {number} amount - Amount in cents
   * @returns {number} Amount in Rands
   */
  parseAmount(amount) {
    return amount / 100;
  }

  /**
   * Generate payment metadata
   * @param {Object} userData - User information
   * @param {Object} courseData - Course information
   * @returns {Object} Metadata for payment tracking
   */
  generateMetadata(userData, courseData) {
    return {
      userId: userData.uid,
      userEmail: userData.email,
      userName: userData.name,
      courseId: courseData.id,
      courseName: courseData.name,
      courseType: courseData.type || 'course',
      timestamp: new Date().toISOString(),
      platform: 'Distinction Bound Program'
    };
  }

  /**
   * Validate payment data
   * @param {Object} paymentData - Payment data to validate
   * @returns {boolean} True if valid
   */
  validatePaymentData(paymentData) {
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (!paymentData.currency || paymentData.currency !== 'ZAR') {
      throw new Error('Invalid currency. Only ZAR is supported');
    }

    if (paymentData.amount < 100) { // Minimum R1.00
      throw new Error('Minimum payment amount is R1.00');
    }

    return true;
  }

  /**
   * Get test card details for development
   * @returns {Object} Test card information
   */
  getTestCardDetails() {
    return {
      number: '4111 1111 1111 1111',
      cvc: '123',
      expiry: '12/25',
      name: 'Test User'
    };
  }

  /**
   * Check if in test mode
   * @returns {boolean} True if in test mode
   */
  isTestMode() {
    return !this.isProduction || this.secretKey.startsWith('sk_test_');
  }

  /**
   * Get payment processing mode
   * @returns {string} 'test' or 'live'
   */
  getProcessingMode() {
    return this.isTestMode() ? 'test' : 'live';
  }
}

// Create singleton instance
const yocoService = new YocoService();

export default yocoService;
