import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import yocoService from '../services/YocoService';

const PaymentResult = () => {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentResult = async () => {
      const queryParams = new URLSearchParams(location.search);
      const provider = queryParams.get('provider');
      const checkoutId = queryParams.get('checkout_id');
      const paymentId = queryParams.get('payment_id');
      const result = queryParams.get('result');

      // Get stored payment data
      const storedCheckoutId = localStorage.getItem('yoco_checkout_id');
      const storedPaymentData = localStorage.getItem('yoco_payment_data');

      if (!storedCheckoutId || !storedPaymentData) {
        setStatus('error');
        setMessage('Payment session not found. Please try again.');
        return;
      }

      try {
        if (provider === 'yoco') {
          await handleYocoPaymentResult(checkoutId, paymentId, result, storedPaymentData);
        } else {
          setStatus('error');
          setMessage('Unknown payment provider');
        }
      } catch (error) {
        console.error('Payment result handling error:', error);
        setStatus('error');
        setMessage('Payment verification failed. Please contact support.');
      } finally {
        // Clear stored payment data
        localStorage.removeItem('yoco_checkout_id');
        localStorage.removeItem('yoco_payment_data');
      }
    };

    handlePaymentResult();
  }, [location.search]);

  const handleYocoPaymentResult = async (checkoutId, paymentId, result, storedPaymentData) => {
    try {
      const paymentData = JSON.parse(storedPaymentData);
      
      // Get checkout status from Yoco
      const checkoutStatus = await yocoService.getCheckoutStatus(checkoutId);
      
      if (checkoutStatus.status === 'paid' && checkoutStatus.paymentId) {
        // Payment successful - create purchase record
        await createYocoPurchaseRecord(checkoutStatus, paymentData);
        
        setStatus('success');
        setMessage('Payment successful! Your ticket has been purchased.');
        setPaymentDetails({
          paymentId: checkoutStatus.paymentId,
          amount: yocoService.parseAmount(checkoutStatus.amount),
          currency: checkoutStatus.currency,
          checkoutId: checkoutId,
          timestamp: new Date().toISOString()
        });
      } else if (checkoutStatus.status === 'cancelled') {
        setStatus('cancelled');
        setMessage('Payment was cancelled. No charges were made.');
      } else if (checkoutStatus.status === 'failed') {
        setStatus('error');
        setMessage('Payment failed. Please try again or contact support.');
      } else {
        setStatus('pending');
        setMessage('Payment is being processed. Please wait...');
      }
    } catch (error) {
      console.error('Yoco payment result error:', error);
      setStatus('error');
      setMessage('Payment verification failed. Please contact support.');
    }
  };

  const createYocoPurchaseRecord = async (checkoutStatus, paymentData) => {
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('distinctionBoundUser');
      if (!userStr) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userStr);
      const session = paymentData.sessionData;
      const course = paymentData.courseData;
      
      // Generate unique confirmation code
      const confirmationCode = `YOCO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const ticketNumber = `YOCO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create purchase record
      const purchaseData = {
        sessionId: session.id,
        courseId: course.id,
        userId: user.uid,
        userEmail: user.email,
        userName: user.name,
        sessionTitle: session.title,
        sessionDate: session.date,
        sessionTime: session.time,
        location: session.location,
        price: paymentData.amount,
        purchaseDate: new Date().toISOString(),
        status: "confirmed",
        ticketNumber: ticketNumber,
        confirmationCode: confirmationCode,
        transferable: true,
        refundPolicy: "Non-refundable - Transferable to another session only",
        paymentId: checkoutStatus.paymentId,
        paymentMethod: 'yoco',
        paymentStatus: 'completed',
        checkoutId: checkoutStatus.id,
        paymentProvider: 'Yoco',
        processingMode: checkoutStatus.processingMode,
        currency: checkoutStatus.currency,
        amountPaid: checkoutStatus.amount
      };

      // Save purchase to Firestore
      await addDoc(collection(db, "purchases"), purchaseData);
      console.log("Yoco purchase saved successfully!");

      // Update session enrolled count
      try {
        const sessionRef = doc(db, "sessions", session.id);
        await updateDoc(sessionRef, {
          enrolledCount: (session.enrolledCount || 0) + 1
        });
        console.log("Session enrollment updated!");
      } catch (updateError) {
        console.warn("Session update failed, but purchase succeeded:", updateError);
      }

    } catch (error) {
      console.error('Error creating Yoco purchase record:', error);
      throw error;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'cancelled':
        return '🚫';
      case 'pending':
        return '⏳';
      default:
        return '🔄';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'cancelled':
        return '#ffc107';
      case 'pending':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const handleContinue = () => {
    navigate('/student-portal-dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem'
        }}>
          {getStatusIcon()}
        </div>

        <h1 style={{
          color: getStatusColor(),
          marginBottom: '1rem',
          fontSize: '2rem'
        }}>
          {status === 'success' ? 'Payment Successful!' :
           status === 'error' ? 'Payment Failed' :
           status === 'cancelled' ? 'Payment Cancelled' :
           status === 'pending' ? 'Processing Payment' :
           'Loading...'}
        </h1>

        <p style={{
          color: '#666',
          fontSize: '1.1rem',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          {message}
        </p>

        {paymentDetails && status === 'success' && (
          <div style={{
            background: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>Payment Details:</h3>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              <p><strong>Payment ID:</strong> {paymentDetails.paymentId}</p>
              <p><strong>Amount:</strong> R{paymentDetails.amount}</p>
              <p><strong>Currency:</strong> {paymentDetails.currency}</p>
              <p><strong>Time:</strong> {new Date(paymentDetails.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}

        {status !== 'loading' && (
          <button
            onClick={handleContinue}
            style={{
              background: status === 'success' ? '#28a745' : '#0051a8',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.target.style.background = status === 'success' ? '#218838' : '#003d7a';
            }}
            onMouseOut={(e) => {
              e.target.style.background = status === 'success' ? '#28a745' : '#0051a8';
            }}
          >
            {status === 'success' ? 'View My Tickets' : 'Back to Dashboard'}
          </button>
        )}

        {status === 'loading' && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #0051a8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Processing payment...</span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PaymentResult;
