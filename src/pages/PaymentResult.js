import React, { useState, useEffect, useRef } from 'react';
import yocoService from '../services/YocoService';
import api from '../services/api';

const PaymentResult = () => {
  console.log('🎫 PaymentResult page loaded!');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const hasProcessed = useRef(false); // Prevent duplicate processing

  // Parse URL parameters manually
  const getQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      provider: params.get('provider'),
      checkoutId: params.get('checkout_id') || params.get('checkoutId') || params.get('id'),
      paymentId: params.get('payment_id') || params.get('paymentId'),
      result: params.get('result') || params.get('status')
    };
  };

  useEffect(() => {
    // Prevent duplicate processing (React.StrictMode runs useEffect twice in dev)
    if (hasProcessed.current) {
      console.log('🎫 Payment already processed, skipping...');
      return;
    }
    
    console.log('🎫 PaymentResult useEffect triggered');
    console.log('🎫 Current URL:', window.location.href);
    
    const handlePaymentResult = async () => {
      const { provider, checkoutId, paymentId, result } = getQueryParams();
      console.log('🎫 URL params:', { provider, checkoutId, paymentId, result });

      // Get stored payment data
      const storedCheckoutId = localStorage.getItem('yoco_checkout_id');
      const storedPaymentData = localStorage.getItem('yoco_payment_data');
      
      console.log('🎫 Stored data:', { 
        storedCheckoutId, 
        hasPaymentData: !!storedPaymentData 
      });

      if (!storedCheckoutId || !storedPaymentData) {
        setStatus('error');
        setMessage('Payment session not found. Please try again.');
        return;
      }

      // Mark as processed before making any API calls
      hasProcessed.current = true;

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
  }, []);

  const handleYocoPaymentResult = async (checkoutId, paymentId, result, storedPaymentData) => {
    try {
      const paymentData = JSON.parse(storedPaymentData);
      
      // Use stored checkout ID if URL param is missing
      const finalCheckoutId = checkoutId || localStorage.getItem('yoco_checkout_id');
      
      if (!finalCheckoutId) {
        throw new Error('No checkout ID found');
      }
      
      console.log('🎫 Getting checkout status for:', finalCheckoutId);
      
      // Get checkout status from Yoco
      const checkoutStatus = await yocoService.getCheckoutStatus(finalCheckoutId);
      
      console.log('🎫 Checkout status:', checkoutStatus);
      
      // Yoco uses 'completed' status for successful payments (not 'paid')
      if ((checkoutStatus.status === 'paid' || checkoutStatus.status === 'completed') && 
          (checkoutStatus.paymentId || checkoutStatus.id)) {
        // Payment successful - create purchase record
        await createYocoPurchaseRecord(checkoutStatus, paymentData);
        
        setStatus('success');
        setMessage('Payment successful! Your ticket has been purchased.');
        setPaymentDetails({
          paymentId: checkoutStatus.paymentId || checkoutStatus.id,
          amount: yocoService.parseAmount(checkoutStatus.amount),
          currency: checkoutStatus.currency,
          checkoutId: checkoutId || checkoutStatus.id,
          timestamp: new Date().toISOString()
        });
        
        // Redirect to student portal after 3 seconds to show the new ticket
        setTimeout(() => {
          window.location.href = '/student-portal-dashboard';
        }, 3000);
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
      // Get current user from localStorage or Firebase auth
      const userFromStorage = localStorage.getItem('distinctionBoundUser');
      console.log('🎫 Raw user from storage:', userFromStorage);
      
      if (!userFromStorage) {
        throw new Error('User not found in localStorage. Please log in again.');
      }
      
      const user = JSON.parse(userFromStorage);
      console.log('🎫 Parsed user:', user);
      
      if (!user.uid) {
        throw new Error('User UID not found. Please log in again.');
      }
      
      const session = paymentData.sessionData;
      const course = paymentData.courseData;
      
      console.log('🎫 Session data:', session);
      console.log('🎫 Course data:', course);
      
      // Detect test mode
      const isTestPayment = checkoutStatus.id?.includes('test') || 
                           checkoutStatus.mode === 'test' ||
                           checkoutStatus.processingMode === 'test';
      
      console.log('🎫 Is test payment:', isTestPayment);
      
      // Generate 6-digit ticket number for easy attendance marking
      const generateTicketNumber = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };
      const ticketNumber = generateTicketNumber();
      
      // Create ticket data for backend API
      const ticketData = {
        uid: user.uid,
        session_id: session.session_id || session.id,
        course_id: course.course_id || course.id,
        session_title: session.title,
        session_date: session.date,
        session_time: session.time,
        session_venue: session.venue || session.location,
        course_title: course.title,
        amount: paymentData.amount,
        payment_method: 'yoco',
        payment_id: checkoutStatus.paymentId || checkoutStatus.id,
        ticket_number: ticketNumber,
        is_test: isTestPayment
      };

      // Save ticket using backend API
      console.log('🎫 Saving ticket via backend API:', ticketData);
      const createdTicket = await api.createTicket(ticketData);
      console.log('✅ Yoco purchase saved successfully via backend API!', createdTicket);

    } catch (error) {
      console.error("❌ Error saving Yoco purchase:", error);
      console.error("❌ Error stack:", error.stack);
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
    window.location.href = '/student-portal-dashboard';
  };

  return (
    <div className="payment-result-container">
      <div className="payment-result-card">
        <div className="status-icon">
          {getStatusIcon()}
        </div>

        <h1 className="status-title" style={{ color: getStatusColor() }}>
          {status === 'success' ? 'Payment Successful!' :
           status === 'error' ? 'Payment Failed' :
           status === 'cancelled' ? 'Payment Cancelled' :
           status === 'pending' ? 'Processing Payment' :
           'Loading...'}
        </h1>

        <p className="status-message">
          {message}
        </p>

        {paymentDetails && status === 'success' && (
          <div className="payment-details">
            <h3>Payment Details:</h3>
            <div className="details-content">
              <p><strong>Payment ID:</strong> {paymentDetails.paymentId}</p>
              <p><strong>Amount:</strong> R{paymentDetails.amount}</p>
              <p><strong>Currency:</strong> {paymentDetails.currency}</p>
              <p><strong>Time:</strong> {new Date(paymentDetails.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}

        {status !== 'loading' && (
          <button
            className={`action-button ${status === 'success' ? 'success' : 'default'}`}
            onClick={handleContinue}
          >
            {status === 'success' ? 'View My Tickets' : 'Back to Dashboard'}
          </button>
        )}

        {status === 'loading' && (
          <div className="loading-container">
            <div className="spinner"></div>
            <span>Processing payment...</span>
          </div>
        )}
      </div>

      <style>{`
        /* Container - Full viewport with gradient background */
        .payment-result-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        /* Main card - Responsive sizing */
        .payment-result-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 500px;
          width: 100%;
          text-align: center;
        }

        /* Status icon */
        .status-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        /* Status title */
        .status-title {
          margin-bottom: 1rem;
          font-size: 1.5rem;
          font-weight: bold;
        }

        /* Status message */
        .status-message {
          color: #666;
          font-size: 1rem;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        /* Payment details box */
        .payment-details {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          text-align: left;
        }

        .payment-details h3 {
          margin-bottom: 1rem;
          color: #333;
          font-size: 1.1rem;
        }

        .details-content {
          font-size: 0.9rem;
          color: #666;
        }

        .details-content p {
          margin: 0.5rem 0;
          word-break: break-word;
        }

        /* Action button */
        .action-button {
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          font-weight: 600;
        }

        .action-button.success {
          background: #28a745;
        }

        .action-button.success:hover {
          background: #218838;
        }

        .action-button.default {
          background: #0051a8;
        }

        .action-button.default:hover {
          background: #003d7a;
        }

        /* Loading spinner */
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #0051a8;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* MOBILE PHONES (320px - 767px) */
        @media (max-width: 767px) {
          .payment-result-container {
            padding: 0.5rem;
          }

          .payment-result-card {
            padding: 1.5rem;
            border-radius: 12px;
            max-width: 100%;
          }

          .status-icon {
            font-size: 2.5rem;
            margin-bottom: 0.75rem;
          }

          .status-title {
            font-size: 1.25rem;
            margin-bottom: 0.75rem;
          }

          .status-message {
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
          }

          .payment-details {
            padding: 1rem;
            margin-bottom: 1.5rem;
          }

          .payment-details h3 {
            font-size: 1rem;
            margin-bottom: 0.75rem;
          }

          .details-content {
            font-size: 0.85rem;
          }

          .action-button {
            padding: 0.875rem 1.5rem;
            font-size: 0.9rem;
          }
        }

        /* TABLETS (768px - 1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .payment-result-container {
            padding: 1.5rem;
          }

          .payment-result-card {
            padding: 2.5rem;
            max-width: 550px;
          }

          .status-icon {
            font-size: 3.5rem;
          }

          .status-title {
            font-size: 1.75rem;
          }

          .status-message {
            font-size: 1.05rem;
          }
        }

        /* LAPTOPS & DESKTOPS (1024px+) */
        @media (min-width: 1024px) {
          .payment-result-card {
            padding: 3rem;
          }

          .status-icon {
            font-size: 4rem;
          }

          .status-title {
            font-size: 2rem;
          }

          .status-message {
            font-size: 1.1rem;
          }
        }

        /* LANDSCAPE PHONES */
        @media (max-width: 767px) and (orientation: landscape) {
          .payment-result-container {
            padding: 1rem 2rem;
          }

          .payment-result-card {
            max-height: 90vh;
            overflow-y: auto;
          }

          .status-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }

          .status-title {
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
          }

          .status-message {
            font-size: 0.85rem;
            margin-bottom: 1rem;
          }

          .payment-details {
            padding: 0.75rem;
            margin-bottom: 1rem;
          }

          .action-button {
            padding: 0.75rem 1.5rem;
          }
        }

        /* EXTRA SMALL PHONES (< 360px) */
        @media (max-width: 359px) {
          .payment-result-card {
            padding: 1rem;
          }

          .status-icon {
            font-size: 2rem;
          }

          .status-title {
            font-size: 1.1rem;
          }

          .status-message {
            font-size: 0.85rem;
          }

          .details-content {
            font-size: 0.8rem;
          }

          .action-button {
            padding: 0.75rem 1rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentResult;
