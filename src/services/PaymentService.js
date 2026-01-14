import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";

// Payment service for handling course payments and ticket purchases
export class PaymentService {
  
  // Initialize payment with different providers
  static async initializePayment(paymentData, paymentMethod = 'card') {
    try {
      console.log(`Initializing payment with method: ${paymentMethod}`);
      
      // Create payment record
      const paymentRecord = {
        ...paymentData,
        paymentMethod: paymentMethod,
        status: 'pending',
        createdAt: new Date().toISOString(),
        currency: 'ZAR',
        provider: this.getPaymentProvider(paymentMethod)
      };

      // Save payment to Firestore
      const paymentRef = collection(db, "payments");
      const paymentDoc = await addDoc(paymentRef, paymentRecord);
      
      console.log("Payment record created:", paymentDoc.id);
      
      // Process payment based on method
      return await this.processPayment(paymentDoc.id, paymentMethod, paymentData);
      
    } catch (error) {
      console.error("Payment initialization error:", error);
      throw new Error(`Payment initialization failed: ${error.message}`);
    }
  }

  // Get payment provider details
  static getPaymentProvider(method) {
    const providers = {
      'card': {
        name: 'Credit/Debit Card',
        processingFee: 0.029, // 2.9% processing fee
        available: true
      },
      'ozow': {
        name: 'Ozow',
        processingFee: 0.015, // 1.5% processing fee
        available: true
      },
      'snapscan': {
        name: 'SnapScan',
        processingFee: 0.02, // 2% processing fee
        available: true
      },
      'bank_transfer': {
        name: 'EFT/Bank Transfer',
        processingFee: 0.005, // 0.5% processing fee
        available: true
      },
      'cash': {
        name: 'Cash Payment',
        processingFee: 0.0, // No processing fee
        available: false // Online only
      }
    };
    
    return providers[method] || providers['card'];
  }

  // Process payment based on method
  static async processPayment(paymentId, method, paymentData) {
    const provider = this.getPaymentProvider(method);
    
    switch (method) {
      case 'card':
        return await this.processCardPayment(paymentId, paymentData);
      case 'ozow':
        return await this.processOzowPayment(paymentId, paymentData);
      case 'snapscan':
        return await this.processSnapScanPayment(paymentId, paymentData);
      case 'bank_transfer':
        return await this.processBankTransferPayment(paymentId, paymentData);
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }

  // Process card payment
  static async processCardPayment(paymentId, paymentData) {
    try {
      console.log("Processing card payment...");
      
      // Simulate card payment processing
      const paymentResult = {
        success: true,
        transactionId: `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: paymentData.amount,
        currency: 'ZAR',
        status: 'completed',
        processedAt: new Date().toISOString(),
        last4: this.generateMockLast4()
      };

      // Update payment record
      await this.updatePaymentRecord(paymentId, {
        ...paymentResult,
        cardDetails: {
          last4: paymentResult.last4,
          brand: this.getCardBrand(paymentResult.last4),
          expiry: this.generateMockExpiry()
        }
      });

      return {
        success: true,
        transactionId: paymentResult.transactionId,
        message: 'Card payment processed successfully',
        data: paymentResult
      };
      
    } catch (error) {
      console.error("Card payment error:", error);
      return {
        success: false,
        error: error.message,
        message: 'Card payment failed'
      };
    }
  }

  // Process Ozow payment
  static async processOzowPayment(paymentId, paymentData) {
    try {
      console.log("Processing Ozow payment...");
      
      // Simulate Ozow payment processing
      const paymentResult = {
        success: true,
        transactionId: `OZOW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: paymentData.amount,
        currency: 'ZAR',
        status: 'completed',
        processedAt: new Date().toISOString(),
        ozowReference: this.generateMockOzowRef()
      };

      // Update payment record
      await this.updatePaymentRecord(paymentId, {
        ...paymentResult,
        ozowDetails: {
          reference: paymentResult.ozowReference,
          phoneNumber: paymentData.phoneNumber || '+27712345678'
        }
      });

      return {
        success: true,
        transactionId: paymentResult.transactionId,
        message: 'Ozow payment processed successfully',
        data: paymentResult
      };
      
    } catch (error) {
      console.error("Ozow payment error:", error);
      return {
        success: false,
        error: error.message,
        message: 'Ozow payment failed'
      };
    }
  }

  // Process SnapScan payment
  static async processSnapScanPayment(paymentId, paymentData) {
    try {
      console.log("Processing SnapScan payment...");
      
      // Simulate SnapScan payment processing
      const paymentResult = {
        success: true,
        transactionId: `SNAP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: paymentData.amount,
        currency: 'ZAR',
        status: 'completed',
        processedAt: new Date().toISOString(),
        snapCode: this.generateMockSnapCode()
      };

      // Update payment record
      await this.updatePaymentRecord(paymentId, {
        ...paymentResult,
        snapDetails: {
          code: paymentResult.snapCode,
          merchantId: 'DISTINCTION_BOUND'
        }
      });

      return {
        success: true,
        transactionId: paymentResult.transactionId,
        message: 'SnapScan payment processed successfully',
        data: paymentResult
      };
      
    } catch (error) {
      console.error("SnapScan payment error:", error);
      return {
        success: false,
        error: error.message,
        message: 'SnapScan payment failed'
      };
    }
  }

  // Process bank transfer payment
  static async processBankTransferPayment(paymentId, paymentData) {
    try {
      console.log("Processing bank transfer...");
      
      // For bank transfers, mark as pending verification
      const paymentResult = {
        success: true,
        transactionId: `EFT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: paymentData.amount,
        currency: 'ZAR',
        status: 'pending_verification', // Pending admin verification
        processedAt: new Date().toISOString(),
        bankDetails: {
          accountHolder: paymentData.accountHolder || 'Distinction Bound',
          bankName: paymentData.bankName || 'Standard Bank',
          accountNumber: paymentData.accountNumber || '1234567890',
          branchCode: paymentData.branchCode || '123456'
        }
      };

      // Update payment record
      await this.updatePaymentRecord(paymentId, paymentResult);

      return {
        success: true,
        transactionId: paymentResult.transactionId,
        message: 'Bank transfer recorded. Awaiting admin verification.',
        data: paymentResult,
        requiresVerification: true
      };
      
    } catch (error) {
      console.error("Bank transfer error:", error);
      return {
        success: false,
        error: error.message,
        message: 'Bank transfer failed'
      };
    }
  }

  // Update payment record
  static async updatePaymentRecord(paymentId, updateData) {
    try {
      const paymentRef = doc(db, "payments", paymentId);
      await updateDoc(paymentRef, updateData);
      console.log("Payment record updated:", paymentId);
    } catch (error) {
      console.error("Error updating payment record:", error);
      throw error;
    }
  }

  // Get payment by ID
  static async getPaymentById(paymentId) {
    try {
      const paymentRef = doc(db, "payments", paymentId);
      const paymentDoc = await getDoc(paymentRef);
      
      if (paymentDoc.exists()) {
        return {
          id: paymentDoc.id,
          ...paymentDoc.data()
        };
      } else {
        throw new Error('Payment not found');
      }
    } catch (error) {
      console.error("Error getting payment:", error);
      throw error;
    }
  }

  // Get user payments
  static async getUserPayments(userId) {
    try {
      const paymentsQuery = query(
        collection(db, "payments"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      return paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting user payments:", error);
      return [];
    }
  }

  // Verify bank transfer (admin function)
  static async verifyBankTransfer(paymentId, adminId) {
    try {
      const payment = await this.getPaymentById(paymentId);
      
      if (payment.status !== 'pending_verification') {
        throw new Error('Payment is not pending verification');
      }

      // Update payment status to completed
      await this.updatePaymentRecord(paymentId, {
        status: 'completed',
        verifiedAt: new Date().toISOString(),
        verifiedBy: adminId
      });

      return {
        success: true,
        message: 'Bank transfer verified and completed'
      };
      
    } catch (error) {
      console.error("Error verifying bank transfer:", error);
      return {
        success: false,
        error: error.message,
        message: 'Verification failed'
      };
    }
  }

  // Refund payment
  static async processRefund(paymentId, reason, adminId) {
    try {
      const payment = await this.getPaymentById(paymentId);
      
      if (payment.status !== 'completed') {
        throw new Error('Only completed payments can be refunded');
      }

      // Calculate refund amount (including processing fees)
      const refundAmount = payment.amount - (payment.amount * payment.processingFee);
      
      // Create refund record
      const refundData = {
        originalPaymentId: paymentId,
        amount: refundAmount,
        reason: reason,
        processedAt: new Date().toISOString(),
        processedBy: adminId,
        status: 'processed'
      };

      const refundRef = collection(db, "refunds");
      await addDoc(refundRef, refundData);

      // Update original payment status
      await this.updatePaymentRecord(paymentId, {
        status: 'refunded',
        refundedAt: new Date().toISOString(),
        refundId: refundData.id
      });

      return {
        success: true,
        refundId: refundData.id,
        refundAmount: refundAmount,
        message: 'Refund processed successfully'
      };
      
    } catch (error) {
      console.error("Error processing refund:", error);
      return {
        success: false,
        error: error.message,
        message: 'Refund failed'
      };
    }
  }

  // Get payment statistics
  static async getPaymentStats(userId = null) {
    try {
      let queryRef;
      
      if (userId) {
        // Get user-specific stats
        queryRef = query(
          collection(db, "payments"),
          where("userId", "==", userId)
        );
      } else {
        // Get all payments (admin stats)
        queryRef = collection(db, "payments");
      }
      
      const paymentsSnapshot = await getDocs(queryRef);
      const payments = paymentsSnapshot.docs.map(doc => doc.data());
      
      const stats = {
        total: payments.length,
        completed: payments.filter(p => p.status === 'completed').length,
        pending: payments.filter(p => p.status === 'pending').length,
        failed: payments.filter(p => p.status === 'failed').length,
        refunded: payments.filter(p => p.status === 'refunded').length,
        totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        completedAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0),
        methodBreakdown: {
          card: payments.filter(p => p.paymentMethod === 'card').length,
          ozow: payments.filter(p => p.paymentMethod === 'ozow').length,
          snapscan: payments.filter(p => p.paymentMethod === 'snapscan').length,
          bank_transfer: payments.filter(p => p.paymentMethod === 'bank_transfer').length
        }
      };
      
      return stats;
      
    } catch (error) {
      console.error("Error getting payment stats:", error);
      return {
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        refunded: 0,
        totalAmount: 0,
        completedAmount: 0,
        methodBreakdown: {
          card: 0,
          ozow: 0,
          snapscan: 0,
          bank_transfer: 0
        }
      };
    }
  }

  // Helper methods for mock data generation
  static generateMockLast4() {
    const last4s = ['1234', '5678', '9012', '3456'];
    return last4s[Math.floor(Math.random() * last4s.length)];
  }

  static getCardBrand(last4) {
    const firstDigit = last4.charAt(0);
    if (firstDigit === '4') return 'Visa';
    if (firstDigit === '5') return 'MasterCard';
    if (firstDigit === '3') return 'American Express';
    return 'Unknown';
  }

  static generateMockExpiry() {
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const year = String(new Date().getFullYear() + Math.floor(Math.random() * 5)).slice(-2);
    return `${month}/${year}`;
  }

  static generateMockOzowRef() {
    return `OZ${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  static generateMockSnapCode() {
    return Math.random().toString(36).substr(2, 12).toUpperCase();
  }
}

export default PaymentService;
