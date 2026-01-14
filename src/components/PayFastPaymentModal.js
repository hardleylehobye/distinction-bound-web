import React, { useState, useEffect } from 'react';

function PayFastPaymentModal({ 
  session, 
  course, 
  amount, 
  currentUser,
  onConfirm, 
  onCancel 
}) {
  const [isSecureConnection, setIsSecureConnection] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState({
    protocol: 'https',
    encrypted: true,
    verified: true
  });

  const [paymentData, setPaymentData] = useState({
    merchantId: '10000100', // PayFast test merchant ID
    merchantKey: '46f0cd69-2414-4e10-955f-fb66b954024c', // PayFast test key
    return_url: `${window.location.origin}/payment/return`,
    cancel_url: `${window.location.origin}/payment/cancel`,
    notify_url: `${window.location.origin}/api/payfast/notify`,
    name_first: currentUser?.displayName?.split(' ')[0] || currentUser?.name?.split(' ')[0] || '',
    name_last: currentUser?.displayName?.split(' ').slice(1).join(' ') || currentUser?.name?.split(' ').slice(1).join(' ') || '',
    email_address: currentUser?.email || '',
    cell_number: currentUser?.phone || '',
    custom_int1: session.id, // Session ID
    custom_int2: course.id, // Course ID
    custom_int3: currentUser?.uid || '', // User ID
    custom_str1: session.title, // Session title
    custom_str2: course.title, // Course title
    amount: amount,
    payment_method: 'eft'
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
    // No form fields to validate since user is already logged in
    // Just check if we have the required user data
    return currentUser && (currentUser.displayName || currentUser.name) && currentUser.email;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isSecureConnection) {
      alert('Warning: This connection is not secure. Please use HTTPS for payment processing.');
      return;
    }
    
    if (validateForm()) {
      // Automatically set instructor as payment account
      const paymentDataWithAccount = {
        ...paymentData,
        paymentAccount: 'instructor'
      };
      
      // Create PayFast payment URL
      const payfastUrl = createPayFastUrl(paymentDataWithAccount);
      
      // Redirect to PayFast
      window.location.href = payfastUrl;
    }
  };

  const createPayFastUrl = (data) => {
    const baseUrl = 'https://sandbox.payfast.co.za/eng/process';
    
    // Build query string
    const params = new URLSearchParams();
    Object.keys(data).forEach(key => {
      if (data[key]) {
        params.append(key, data[key]);
      }
    });
    
    return `${baseUrl}?${params.toString()}`;
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
            💳 PayFast Payment
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

        {/* PayFast Information */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: `2px solid ${securityBadge.color}`,
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px' }}>💳</span>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                PayFast Secure EFT Payment
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
              <div style={{ fontWeight: 'bold', color: '#333' }}>Instant</div>
              <div>EFT Transfer</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#333' }}>South Africa</div>
              <div>Banking</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#333' }}>Secure</div>
              <div>Payment</div>
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
              💳 Payment via PayFast EFT
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
              Instant bank transfer to course instructor
            </p>
          </div>
        </div>

      <div style={{
          backgroundColor: '#e3f2fd',
          border: '2px solid #0051a8',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
        }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#0051a8' }}>
            <strong>💳 PayFast Secure EFT</strong><br/>
            This payment is processed through PayFast's secure instant EFT system.<br/>
            Your bank account is protected with industry-standard security.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
                backgroundColor: isSecureConnection ? '#ff6600' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isSecureConnection ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: isSecureConnection ? 1 : 0.6,
              }}
            >
              {isSecureConnection ? `Pay R${amount} with PayFast` : 'Connection Not Secure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PayFastPaymentModal;
