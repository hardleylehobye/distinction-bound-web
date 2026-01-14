import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';

class PayFastService {
  constructor() {
    // PayFast credentials (use test credentials for development)
    this.merchantId = '10000100'; // Test merchant ID
    this.merchantKey = '46f0cd69-2414-4e10-955f-fb66b954024c'; // Test merchant key
    this.sandboxUrl = 'https://sandbox.payfast.co.za/eng/process';
    this.liveUrl = 'https://www.payfast.co.za/eng/process';
  }

  // Get PayFast URL (sandbox for development, live for production)
  getPayFastUrl() {
    const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    return isDevelopment ? this.sandboxUrl : this.liveUrl;
  }

  // Create PayFast payment data
  createPaymentData(session, course, amount, user, paymentAccount = 'instructor') {
    const baseUrl = window.location.origin;
    
    return {
      // Merchant details
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: `${baseUrl}/payment/return`,
      cancel_url: `${baseUrl}/payment/cancel`,
      notify_url: `${baseUrl}/api/payfast/notify`,
      
      // Buyer details
      name_first: user.name || user.displayName || '',
      name_last: user.lastName || '',
      email_address: user.email,
      cell_number: user.phone || '',
      
      // Transaction details
      amount: amount.toFixed(2),
      item_name: `${session.title} - ${course.title}`,
      item_description: `Session: ${session.title} on ${session.date} at ${session.time}`,
      
      // Custom data for tracking
      custom_int1: session.id, // Session ID
      custom_int2: course.id, // Course ID
      custom_int3: user.uid, // User ID
      custom_int4: Date.now(), // Timestamp
      custom_str1: session.title, // Session title
      custom_str2: course.title, // Course title
      custom_str3: paymentAccount, // Payment account selection
      custom_str4: session.date, // Session date
      custom_str5: session.time, // Session time
      
      // Payment method
      payment_method: 'eft'
    };
  }

  // Generate PayFast signature for security
  generateSignature(data) {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(data[key])}`)
      .join('&');
    
    // In production, you would use the actual signature generation
    // For now, we'll return a placeholder
    return btoa(signatureString);
  }

  // Create PayFast payment URL
  createPaymentUrl(session, course, amount, user, paymentAccount = 'instructor') {
    const paymentData = this.createPaymentData(session, course, amount, user, paymentAccount);
    const signature = this.generateSignature(paymentData);
    
    // Add signature to data
    paymentData.signature = signature;
    
    // Build query string
    const params = new URLSearchParams();
    Object.keys(paymentData).forEach(key => {
      if (paymentData[key]) {
        params.append(key, paymentData[key]);
      }
    });
    
    return `${this.getPayFastUrl()}?${params.toString()}`;
  }

  // Process PayFast notification (ITN - Instant Transaction Notification)
  async processNotification(notificationData) {
    try {
      // Verify the notification is from PayFast
      if (!this.verifyNotification(notificationData)) {
        throw new Error('Invalid PayFast notification');
      }

      // Extract payment information
      const {
        m_payment_id: paymentId,
        pf_payment_id: payfastPaymentId,
        payment_status: status,
        amount_gross: amount,
        custom_int1: sessionId,
        custom_int2: courseId,
        custom_int3: userId,
        custom_str3: paymentAccount
      } = notificationData;

      // Create purchase record
      const purchaseData = {
        sessionId: sessionId,
        courseId: courseId,
        userId: userId,
        paymentId: payfastPaymentId,
        merchantPaymentId: paymentId,
        paymentMethod: 'payfast',
        paymentStatus: status,
        paymentAccount: paymentAccount,
        amount: parseFloat(amount),
        purchaseDate: new Date().toISOString(),
        status: status === 'COMPLETE' ? 'confirmed' : 'pending',
        paymentGateway: 'payfast',
        paymentDetails: {
          gateway: 'PayFast',
          method: 'Instant EFT',
          merchantId: this.merchantId,
          paymentId: payfastPaymentId,
          status: status,
          amount: amount,
          currency: 'ZAR'
        }
      };

      // Save to Firestore
      const purchaseRef = await addDoc(collection(db, 'purchases'), purchaseData);

      // Update session enrollment if payment is complete
      if (status === 'COMPLETE') {
        await this.updateSessionEnrollment(sessionId);
      }

      return {
        success: true,
        purchaseId: purchaseRef.id,
        status: status
      };

    } catch (error) {
      console.error('Error processing PayFast notification:', error);
      throw error;
    }
  }

  // Verify PayFast notification signature
  verifyNotification(data) {
    // In production, you would verify the signature
    // For now, we'll assume it's valid
    return true;
  }

  // Update session enrollment count
  async updateSessionEnrollment(sessionId) {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        const currentEnrolled = sessionDoc.data().enrolled || 0;
        await updateDoc(sessionRef, {
          enrolled: currentEnrolled + 1
        });
      }
    } catch (error) {
      console.error('Error updating session enrollment:', error);
    }
  }

  // Handle payment return (user returns from PayFast)
  async handlePaymentReturn(paymentData) {
    try {
      const {
        payment_id: paymentId,
        custom_int1: sessionId,
        custom_int3: userId
      } = paymentData;

      // Find the purchase record
      const purchasesQuery = query(
        collection(db, 'purchases'),
        where('merchantPaymentId', '==', paymentId),
        where('sessionId', '==', sessionId),
        where('userId', '==', userId)
      );

      const purchaseSnapshot = await getDocs(purchasesQuery);
      
      if (purchaseSnapshot.empty) {
        throw new Error('Purchase not found');
      }

      const purchase = purchaseSnapshot.docs[0];
      return {
        success: true,
        purchaseId: purchase.id,
        purchaseData: purchase.data()
      };

    } catch (error) {
      console.error('Error handling payment return:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId) {
    try {
      const purchasesQuery = query(
        collection(db, 'purchases'),
        where('merchantPaymentId', '==', paymentId)
      );

      const purchaseSnapshot = await getDocs(purchasesQuery);
      
      if (purchaseSnapshot.empty) {
        return null;
      }

      const purchase = purchaseSnapshot.docs[0];
      return purchase.data();

    } catch (error) {
      console.error('Error getting payment status:', error);
      return null;
    }
  }
}

export default PayFastService;
