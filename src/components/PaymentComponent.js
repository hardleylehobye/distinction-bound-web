import React, { useState, useEffect } from 'react';
import PaymentService from '../services/PaymentService';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function PaymentComponent({ 
  currentUser, 
  onPaymentComplete, 
  onPaymentCancel,
  amount,
  description,
  courseId,
  sessionId,
  ticketId 
}) {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({});
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Visa, Mastercard, etc.',
      fee: 2.9
    },
    {
      id: 'ozow',
      name: 'Ozow',
      icon: '📱',
      description: 'Instant mobile payment',
      fee: 1.5
    },
    {
      id: 'snapscan',
      name: 'SnapScan',
      icon: '📸',
      description: 'Scan QR code to pay',
      fee: 2.0
    },
    {
      id: 'bank_transfer',
      name: 'EFT/Bank Transfer',
      icon: '🏦',
      description: 'Direct bank deposit',
      fee: 0.5
    }
  ];

  useEffect(() => {
    // Initialize payment data
    setPaymentData({
      amount: amount,
      description: description,
      userId: currentUser?.uid,
      userEmail: currentUser?.email,
      userName: currentUser?.name || currentUser?.displayName,
      courseId: courseId,
      sessionId: sessionId,
      ticketId: ticketId
    });
  }, [amount, description, currentUser, courseId, sessionId, ticketId]);

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validatePaymentData = () => {
    const newErrors = {};
    
    // Card validation
    if (selectedMethod === 'card') {
      if (!paymentData.cardNumber) {
        newErrors.cardNumber = 'Card number is required';
      } else if (paymentData.cardNumber.length < 13 || paymentData.cardNumber.length > 19) {
        newErrors.cardNumber = 'Invalid card number';
      }
      
      if (!paymentData.expiry) {
        newErrors.expiry = 'Expiry date is required';
      } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentData.expiry)) {
        newErrors.expiry = 'Invalid expiry format (MM/YY)';
      }
      
      if (!paymentData.cvv) {
        newErrors.cvv = 'CVV is required';
      } else if (paymentData.cvv.length < 3 || paymentData.cvv.length > 4) {
        newErrors.cvv = 'Invalid CVV';
      }
      
      if (!paymentData.cardholderName) {
        newErrors.cardholderName = 'Cardholder name is required';
      }
    }
    
    // Ozow validation
    if (selectedMethod === 'ozow') {
      if (!paymentData.phoneNumber) {
        newErrors.phoneNumber = 'Phone number is required';
      } else if (!/^(\+27|0)[6-9]\d{8,9}$/.test(paymentData.phoneNumber)) {
        newErrors.phoneNumber = 'Invalid South African phone number';
      }
      
      if (!paymentData.ozowPin) {
        newErrors.ozowPin = 'Ozow PIN is required';
      } else if (paymentData.ozowPin.length < 4 || paymentData.ozowPin.length > 6) {
        newErrors.ozowPin = 'Invalid PIN length';
      }
    }
    
    // SnapScan validation
    if (selectedMethod === 'snapscan') {
      if (!paymentData.snapCode) {
        newErrors.snapCode = 'SnapScan code is required';
      }
    }
    
    // Bank transfer validation
    if (selectedMethod === 'bank_transfer') {
      if (!paymentData.accountHolder) {
        newErrors.accountHolder = 'Account holder name is required';
      }
      
      if (!paymentData.bankName) {
        newErrors.bankName = 'Bank name is required';
      }
      
      if (!paymentData.accountNumber) {
        newErrors.accountNumber = 'Account number is required';
      } else if (!/^\d{10,11}$/.test(paymentData.accountNumber)) {
        newErrors.accountNumber = 'Invalid account number';
      }
      
      if (!paymentData.branchCode) {
        newErrors.branchCode = 'Branch code is required';
      }
      
      if (!paymentData.referenceNumber) {
        newErrors.referenceNumber = 'Reference number is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateProcessingFee = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    return method ? (amount * method.fee / 100) : 0;
  };

  const calculateTotal = () => {
    const fee = calculateProcessingFee();
    return amount + fee;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePaymentData()) {
      return;
    }
    
    setProcessing(true);
    
    try {
      const result = await PaymentService.initializePayment(paymentData, selectedMethod);
      
      if (result.success) {
        setPaymentResult(result);
        setShowConfirmation(true);
        
        // Create purchase record if this is for a ticket
        if (ticketId) {
          await createPurchaseRecord(result);
        }
      } else {
        setErrors({ general: result.message || 'Payment failed' });
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrors({ general: error.message });
    } finally {
      setProcessing(false);
    }
  };

  const createPurchaseRecord = async (paymentResult) => {
    try {
      const purchaseData = {
        paymentId: paymentResult.transactionId,
        amount: amount,
        processingFee: calculateProcessingFee(),
        totalAmount: calculateTotal(),
        paymentMethod: selectedMethod,
        status: 'completed',
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        userName: currentUser?.name || currentUser?.displayName,
        courseId: courseId,
        sessionId: sessionId,
        ticketId: ticketId,
        description: description,
        createdAt: new Date().toISOString(),
        paymentData: paymentResult.data
      };
      
      await addDoc(collection(db, "purchases"), purchaseData);
      console.log("Purchase record created:", purchaseData);
    } catch (error) {
      console.error("Error creating purchase record:", error);
    }
  };

  const handleConfirm = () => {
    if (onPaymentComplete) {
      onPaymentComplete(paymentResult);
    }
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    if (onPaymentCancel) {
      onPaymentCancel();
    }
  };

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'card':
        return (
          <div style={styles.formSection}>
            <h3>Card Details</h3>
            <div style={styles.formGroup}>
              <label>Card Number *</label>
              <input
                type="text"
                style={styles.input}
                value={paymentData.cardNumber || ''}
                onChange={(e) => handleInputChange('cardNumber', e.target.value.replace(/\s/g, ''))}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
              />
              {errors.cardNumber && <span style={styles.error}>{errors.cardNumber}</span>}
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Expiry Date *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={paymentData.expiry || ''}
                  onChange={(e) => handleInputChange('expiry', e.target.value)}
                  placeholder="MM/YY"
                  maxLength="5"
                />
                {errors.expiry && <span style={styles.error}>{errors.expiry}</span>}
              </div>
              
              <div style={styles.formGroup}>
                <label>CVV *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={paymentData.cvv || ''}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  placeholder="123"
                  maxLength="4"
                />
                {errors.cvv && <span style={styles.error}>{errors.cvv}</span>}
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label>Cardholder Name *</label>
              <input
                type="text"
                style={styles.input}
                value={paymentData.cardholderName || ''}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                placeholder="John Doe"
              />
              {errors.cardholderName && <span style={styles.error}>{errors.cardholderName}</span>}
            </div>
          </div>
        );
        
      case 'ozow':
        return (
          <div style={styles.formSection}>
            <h3>Ozow Details</h3>
            <div style={styles.formGroup}>
              <label>Phone Number *</label>
              <input
                type="tel"
                style={styles.input}
                value={paymentData.phoneNumber || ''}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="+27 123 456 7890"
              />
              {errors.phoneNumber && <span style={styles.error}>{errors.phoneNumber}</span>}
            </div>
            
            <div style={styles.formGroup}>
              <label>Ozow PIN *</label>
              <input
                type="password"
                style={styles.input}
                value={paymentData.ozowPin || ''}
                onChange={(e) => handleInputChange('ozowPin', e.target.value)}
                placeholder="Enter your 4-6 digit PIN"
                maxLength="6"
              />
              {errors.ozowPin && <span style={styles.error}>{errors.ozowPin}</span>}
            </div>
          </div>
        );
        
      case 'snapscan':
        return (
          <div style={styles.formSection}>
            <h3>SnapScan Payment</h3>
            <div style={styles.formGroup}>
              <label>SnapScan Code *</label>
              <input
                type="text"
                style={styles.input}
                value={paymentData.snapCode || ''}
                onChange={(e) => handleInputChange('snapCode', e.target.value)}
                placeholder="Enter SnapScan code"
              />
              {errors.snapCode && <span style={styles.error}>{errors.snapCode}</span>}
            </div>
            
            <div style={styles.infoBox}>
              <p>📸 How to pay with SnapScan:</p>
              <ol style={styles.instructions}>
                <li>Open your SnapScan app</li>
                <li>Scan the QR code displayed below</li>
                <li>Enter the amount: R{calculateTotal()}</li>
                <li>Confirm payment</li>
              </ol>
            </div>
          </div>
        );
        
      case 'bank_transfer':
        return (
          <div style={styles.formSection}>
            <h3>Bank Transfer Details</h3>
            <div style={styles.infoBox}>
              <p>🏦 Please make an EFT to:</p>
              <div style={styles.bankDetails}>
                <p><strong>Account Name:</strong> Distinction Bound</p>
                <p><strong>Bank:</strong> Standard Bank</p>
                <p><strong>Account Number:</strong> 1234567890</p>
                <p><strong>Branch Code:</strong> 123456</p>
              </div>
              <p><strong>Reference:</strong> PAY-{Date.now()}-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
            </div>
            
            <div style={styles.formGroup}>
              <label>Account Holder Name *</label>
              <input
                type="text"
                style={styles.input}
                value={paymentData.accountHolder || ''}
                onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                placeholder="Name on bank account"
              />
              {errors.accountHolder && <span style={styles.error}>{errors.accountHolder}</span>}
            </div>
            
            <div style={styles.formGroup}>
              <label>Bank Name *</label>
              <input
                type="text"
                style={styles.input}
                value={paymentData.bankName || ''}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                placeholder="Bank name"
              />
              {errors.bankName && <span style={styles.error}>{errors.bankName}</span>}
            </div>
            
            <div style={styles.formGroup}>
              <label>Account Number *</label>
              <input
                type="text"
                style={styles.input}
                value={paymentData.accountNumber || ''}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                placeholder="1234567890"
              />
              {errors.accountNumber && <span style={styles.error}>{errors.accountNumber}</span>}
            </div>
            
            <div style={styles.formGroup}>
              <label>Branch Code *</label>
              <input
                type="text"
                style={styles.input}
                value={paymentData.branchCode || ''}
                onChange={(e) => handleInputChange('branchCode', e.target.value)}
                placeholder="123456"
              />
              {errors.branchCode && <span style={styles.error}>{errors.branchCode}</span>}
            </div>
            
            <div style={styles.formGroup}>
              <label>Reference Number *</label>
              <input
                type="text"
                style={styles.input}
                value={paymentData.referenceNumber || ''}
                onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                placeholder="Payment reference"
              />
              {errors.referenceNumber && <span style={styles.error}>{errors.referenceNumber}</span>}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (showConfirmation && paymentResult) {
    return (
      <div style={styles.confirmationOverlay}>
        <div style={styles.confirmationModal}>
          <div style={styles.confirmationHeader}>
            <h2>✅ Payment Successful!</h2>
            <button style={styles.closeButton} onClick={handleCancel}>×</button>
          </div>
          
          <div style={styles.confirmationContent}>
            <div style={styles.successIcon}>🎉</div>
            <h3>Payment Completed</h3>
            <p><strong>Transaction ID:</strong> {paymentResult.transactionId}</p>
            <p><strong>Amount Paid:</strong> R{calculateTotal()}</p>
            <p><strong>Payment Method:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.name}</p>
            <p><strong>Status:</strong> {paymentResult.data?.status || 'Completed'}</p>
          </div>
          
          <div style={styles.confirmationActions}>
            <button style={styles.confirmButton} onClick={handleConfirm}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.paymentContainer}>
      <div style={styles.paymentHeader}>
        <h2>Secure Payment</h2>
        <button style={styles.cancelButton} onClick={handleCancel}>
          Cancel
        </button>
      </div>
      
      <div style={styles.paymentContent}>
        <div style={styles.orderSummary}>
          <h3>Order Summary</h3>
          <div style={styles.summaryItem}>
            <span>{description}</span>
            <span>R{amount}</span>
          </div>
          <div style={styles.summaryItem}>
            <span>Processing Fee ({paymentMethods.find(m => m.id === selectedMethod)?.fee}%)</span>
            <span>R{calculateProcessingFee()}</span>
          </div>
          <div style={styles.summaryTotal}>
            <span>Total Amount</span>
            <span>R{calculateTotal()}</span>
          </div>
        </div>
        
        <div style={styles.paymentMethods}>
          <h3>Select Payment Method</h3>
          <div style={styles.methodsGrid}>
            {paymentMethods.map(method => (
              <div
                key={method.id}
                style={{
                  ...styles.methodCard,
                  border: selectedMethod === method.id ? '2px solid #0051a8' : '2px solid #e0e0e0',
                  backgroundColor: selectedMethod === method.id ? '#f0f8ff' : 'white'
                }}
                onClick={() => handleMethodSelect(method.id)}
              >
                <div style={styles.methodIcon}>{method.icon}</div>
                <div style={styles.methodInfo}>
                  <div style={styles.methodName}>{method.name}</div>
                  <div style={styles.methodDescription}>{method.description}</div>
                  <div style={styles.methodFee}>Fee: {method.fee}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.paymentForm}>
          {renderPaymentForm()}
          
          {errors.general && (
            <div style={styles.generalError}>
              {errors.general}
            </div>
          )}
          
          <button
            type="submit"
            style={styles.payButton}
            disabled={processing || Object.keys(errors).length > 0}
          >
            {processing ? 'Processing...' : `Pay R${calculateTotal()}`}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  paymentContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  paymentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '20px',
  },
  paymentContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '30px',
  },
  orderSummary: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '16px',
  },
  summaryTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '2px solid #e0e0e0',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  paymentMethods: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  },
  methodsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  },
  methodCard: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
  },
  methodIcon: {
    fontSize: '24px',
    marginBottom: '10px',
  },
  methodInfo: {
    textAlign: 'center',
  },
  methodName: {
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#0051a8',
  },
  methodDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
  },
  methodFee: {
    fontSize: '12px',
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  paymentForm: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  },
  formSection: {
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  payButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#0051a8',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  error: {
    color: '#e74c3c',
    fontSize: '14px',
    marginTop: '5px',
    display: 'block',
  },
  generalError: {
    backgroundColor: '#fee',
    border: '2px solid #e74c3c',
    color: '#e74c3c',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  confirmationOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confirmationModal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '500px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  confirmationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  closeConfirmationButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  confirmationContent: {
    marginBottom: '20px',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  confirmationActions: {
    marginTop: '20px',
  },
  confirmButton: {
    padding: '12px 30px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    border: '2px solid #0051a8',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
  },
  instructions: {
    paddingLeft: '20px',
    margin: 0,
  },
  bankDetails: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '6px',
    marginTop: '10px',
  },
};

export default PaymentComponent;
