import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import yocoService from '../services/YocoService';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const Title = styled.h2`
  color: #0051a8;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const PaymentOption = styled.div`
  border: 2px solid ${props => props.selected ? '#0051a8' : '#e0e0e0'};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #0051a8;
    background: #f8f9fa;
  }
`;

const PaymentHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const PaymentIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.2rem;
`;

const PaymentTitle = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1.1rem;
`;

const PaymentDescription = styled.p`
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
`;

const PaymentBadge = styled.span`
  background: #28a745;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
`;

const ProceedButton = styled.button`
  background: #0051a8;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
  transition: background 0.3s ease;
  
  &:hover {
    background: #003d7a;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0051a8;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #c3e6cb;
`;

const YocoPaymentModal = ({ 
  isOpen, 
  onClose, 
  paymentData, 
  currentUser,
  onPaymentSuccess,
  onPaymentError 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!paymentData) {
      setError('No payment data available');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate payment data
      yocoService.validatePaymentData(paymentData);

      // Create metadata for tracking
      const metadata = yocoService.generateMetadata(currentUser, paymentData.courseData || {});

      // Create checkout session
      const checkoutData = await yocoService.createCheckout({
        amount: yocoService.formatAmount(paymentData.amount),
        currency: 'ZAR',
        successUrl: `${window.location.origin}/payment-result?provider=yoco&result=success`,
        cancelUrl: `${window.location.origin}/payment-result?provider=yoco&result=cancelled`,
        failureUrl: `${window.location.origin}/payment-result?provider=yoco&result=failed`,
        metadata: metadata,
        externalId: `${currentUser.uid}_${Date.now()}`
      });

      console.log('🎫 Yoco checkout data:', checkoutData);

      // Redirect to Yoco payment page
      if (checkoutData.redirectUrl) {
        setSuccess('Redirecting to Yoco payment page...');
        
        // Store checkout ID for verification
        localStorage.setItem('yoco_checkout_id', checkoutData.id);
        localStorage.setItem('yoco_payment_data', JSON.stringify(paymentData));
        
        // Redirect after a short delay
        setTimeout(() => {
          console.log('🎫 Redirecting to:', checkoutData.redirectUrl);
          window.location.href = checkoutData.redirectUrl;
        }, 1500);
      } else {
        throw new Error('No redirect URL received from Yoco');
      }

    } catch (err) {
      console.error('Yoco payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setLoading(false);
      
      if (onPaymentError) {
        onPaymentError(err);
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleClose} disabled={loading}>
          ×
        </CloseButton>
        
        <Title>Complete Payment</Title>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <PaymentOption>
          <PaymentHeader>
            <PaymentIcon style={{ background: '#0051a8', color: 'white' }}>
              💳
            </PaymentIcon>
            <div>
              <PaymentTitle>
                Yoco <PaymentBadge>Recommended</PaymentBadge>
              </PaymentTitle>
              <PaymentDescription>
                Secure South African payment gateway. Accepts credit/debit cards, 
                SnapScan, Zapper, and instant EFT.
              </PaymentDescription>
            </div>
          </PaymentHeader>
        </PaymentOption>

        <ProceedButton 
          onClick={handlePayment}
          disabled={loading}
        >
          {loading && <LoadingSpinner />}
          {loading ? 'Processing...' : `Pay R${paymentData?.amount || '0.00'} with Yoco`}
        </ProceedButton>

        <p style={{ 
          textAlign: 'center', 
          marginTop: '1rem', 
          fontSize: '0.8rem', 
          color: '#666' 
        }}>
          🔒 Secure payment powered by Yoco
        </p>
      </ModalContent>
    </ModalOverlay>
  );
};

export default YocoPaymentModal;
