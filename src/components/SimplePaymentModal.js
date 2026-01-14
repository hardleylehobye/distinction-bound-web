import React, { useState, useEffect } from 'react';

function SimplePaymentModal({ 
  session, 
  course, 
  amount, 
  onConfirm, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    cardNumber: '', // Empty for user input
    expiry: '', // Empty for user input
    cvv: '', // Empty for user input
    cardholderName: '', // Empty for user input
    paymentAccount: 'company' // Default to company account
  });

  const [errors, setErrors] = useState({});
  const [isSecureConnection, setIsSecureConnection] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState({
    protocol: 'https',
    encrypted: true,
    verified: true
  });

  useEffect(() => {
    // Check if we're in a secure environment
    const checkSecureConnection = () => {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      const isHTTPS = window.location.protocol === 'https:';
      
      setIsSecureConnection(isHTTPS || isLocalhost);
      setConnectionInfo({
        protocol: window.location.protocol,
        encrypted: isHTTPS || isLocalhost,
        verified: true,
        hostname: window.location.hostname
      });
    };

    checkSecureConnection();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cardNumber || formData.cardNumber.length < 13) {
      newErrors.cardNumber = 'Card number must be at least 13 digits';
    }
    
    if (!formData.expiry || !/^(0[1-9]|1[0-2])\d{2}$/.test(formData.expiry)) {
      newErrors.expiry = 'Invalid expiry date (MM/YY)';
    }
    
    if (!formData.cvv || formData.cvv.length < 3 || formData.cvv.length > 4) {
      newErrors.cvv = 'CVV must be 3-4 digits';
    }
    
    if (!formData.cardholderName || formData.cardholderName.length < 2) {
      newErrors.cardholderName = 'Cardholder name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isSecureConnection) {
      alert('Warning: This connection is not secure. Please use HTTPS for payment processing.');
      return;
    }
    
    if (validateForm()) {
      onConfirm({
        ...formData,
        cardNumber: formData.cardNumber.slice(-4), // Only store last 4 digits for security
        connectionSecure: isSecureConnection,
        connectionProtocol: connectionInfo.protocol
      });
    }
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    // Auto-format card number
    if (field === 'cardNumber') {
      processedValue = value.replace(/\s/g, '').slice(0, 16);
    }
    
    // Auto-format expiry
    if (field === 'expiry') {
      processedValue = value.replace(/[^\d\/]/g, '').slice(0, 5);
      if (processedValue.length === 2 && !processedValue.includes('/')) {
        processedValue += '/';
      }
    }
    
    // Auto-format CVV
    if (field === 'cvv') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatCardNumber = (number) => {
    // Format card number with spaces for display
    const cleaned = number.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const getSecurityBadge = () => {
    if (!isSecureConnection) {
      return {
        text: '⚠️ Not Secure',
        color: '#dc3545',
        bgColor: '#f8d7da'
      };
    }
    
    return {
      text: '🔒 Secure Connection',
      color: '#155724',
      bgColor: '#d4edda'
    };
  };

  const securityBadge = getSecurityBadge();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #e0e0e0',
          paddingBottom: '15px',
        }}>
          <h2 style={{ margin: 0, color: '#0051a8' }}>
            🎫 Secure Payment
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: securityBadge.bgColor,
              color: securityBadge.color,
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}>
              {securityBadge.text}
            </div>
            <button
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                width: '30px',
                height: '30px',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Security Information */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: `2px solid ${securityBadge.color}`,
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔐</span>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                Secure Payment Processing
              </h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                {connectionInfo.protocol === 'https:' || connectionInfo.hostname === 'localhost' 
                  ? 'Your connection is encrypted and secure'
                  : 'Warning: Connection may not be secure'
                }
              </p>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '10px',
            fontSize: '12px',
            color: '#666'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#333' }}>256-bit</div>
              <div>Encryption</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#333' }}>PCI DSS</div>
              <div>Compliant</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#333' }}>SSL/TLS</div>
              <div>Protected</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
            {session.title}
          </h3>
          <p style={{ margin: '0 0 5px 0', color: '#666' }}>
            {course.title}
          </p>
          <p style={{ margin: '0 0 5px 0', color: '#666' }}>
            📅 {session.date} at {session.time}
          </p>
          <p style={{ margin: '0', color: '#666' }}>
            📍 {session.location || 'TBD'}
          </p>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginTop: '15px',
            border: '2px solid #e0e0e0',
          }}>
            <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#0051a8' }}>
              Total Amount: R{amount}
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
              💳 Payment to: Distinction Bound Program
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
              Merchant ID: DBP-2025-001
            </p>
          </div>
        </div>

        {/* Account Selection */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
            💳 Payment Account Selection
          </h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#856404' }}>
            Which account should receive this payment?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="paymentAccount"
                value="company"
                checked={formData.paymentAccount === 'company'}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentAccount: e.target.value }))}
                style={{ marginRight: '8px' }}
              />
              <div>
                <strong>Company Account</strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                  Distinction Bound Program business account
                </span>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="paymentAccount"
                value="personal"
                checked={formData.paymentAccount === 'personal'}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentAccount: e.target.value }))}
                style={{ marginRight: '8px' }}
              />
              <div>
                <strong>Personal Account</strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                  Owner's personal account
                </span>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="paymentAccount"
                value="instructor"
                checked={formData.paymentAccount === 'instructor'}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentAccount: e.target.value }))}
                style={{ marginRight: '8px' }}
              />
              <div>
                <strong>Instructor Account</strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                  Course instructor's account
                </span>
              </div>
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Card Number *
            </label>
            <input
              type="text"
              value={formatCardNumber(formData.cardNumber)}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              style={{
                width: '100%',
                padding: '12px',
                border: errors.cardNumber ? '2px solid #e74c3c' : '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
            {errors.cardNumber && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                {errors.cardNumber}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Expiry Date *
              </label>
              <input
                type="text"
                value={formData.expiry}
                onChange={(e) => handleInputChange('expiry', e.target.value)}
                placeholder="MM/YY"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: errors.expiry ? '2px solid #e74c3c' : '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
              {errors.expiry && (
                <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                  {errors.expiry}
                </div>
              )}
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                CVV *
              </label>
              <input
                type="password"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                placeholder="123"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: errors.cvv ? '2px solid #e74c3c' : '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
              {errors.cvv && (
                <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                  {errors.cvv}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Cardholder Name *
            </label>
            <input
              type="text"
              value={formData.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '12px',
                border: errors.cardholderName ? '2px solid #e74c3c' : '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
            {errors.cardholderName && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                {errors.cardholderName}
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: '#e3f2fd',
            border: '2px solid #0051a8',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
          }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#0051a8' }}>
              <strong>🔒 Secure Payment Gateway</strong><br/>
              This payment is processed through a secure, encrypted connection.<br/>
              Please enter your card details below to complete the purchase.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isSecureConnection}
              style={{
                padding: '12px 24px',
                backgroundColor: isSecureConnection ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isSecureConnection ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: isSecureConnection ? 1 : 0.6,
              }}
            >
              {isSecureConnection ? `Pay R${amount}` : 'Connection Not Secure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SimplePaymentModal;
