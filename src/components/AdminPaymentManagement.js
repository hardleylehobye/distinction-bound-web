import React, { useState, useEffect } from 'react';
import PaymentService from '../services/PaymentService';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

function AdminPaymentManagement({ currentUser }) {
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('payments');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all payments
      const paymentsData = await PaymentService.getUserPayments(); // Get all payments for admin
      setPayments(paymentsData);
      
      // Load refunds
      const refundsQuery = query(collection(db, "refunds"));
      const refundsSnapshot = await getDocs(refundsQuery);
      const refundsData = refundsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRefunds(refundsData);
      
      // Load statistics
      const statsData = await PaymentService.getPaymentStats();
      setStats(statsData);
      
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBankTransfer = async (paymentId) => {
    try {
      const result = await PaymentService.verifyBankTransfer(paymentId, currentUser.uid);
      if (result.success) {
        alert('Bank transfer verified successfully!');
        loadData(); // Refresh data
      } else {
        alert(`Verification failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error verifying bank transfer:', error);
      alert('Verification failed. Please try again.');
    }
  };

  const handleProcessRefund = async (paymentId) => {
    if (!refundReason.trim()) {
      alert('Please provide a refund reason');
      return;
    }
    
    try {
      const result = await PaymentService.processRefund(paymentId, refundReason, currentUser.uid);
      if (result.success) {
        alert(`Refund processed successfully! Refund amount: R${result.refundAmount}`);
        setShowRefundModal(false);
        setRefundReason('');
        setSelectedPayment(null);
        loadData(); // Refresh data
      } else {
        alert(`Refund failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Refund failed. Please try again.');
    }
  };

  const openRefundModal = (payment) => {
    setSelectedPayment(payment);
    setShowRefundModal(true);
    setRefundReason('');
  };

  const closeRefundModal = () => {
    setShowRefundModal(false);
    setSelectedPayment(null);
    setRefundReason('');
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'pending':
      case 'pending_verification':
        return '#ffc107';
      case 'failed':
        return '#dc3545';
      case 'refunded':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '✅ Completed';
      case 'pending':
        return '⏳ Pending';
      case 'pending_verification':
        return '⏳ Pending Verification';
      case 'failed':
        return '❌ Failed';
      case 'refunded':
        return '💰 Refunded';
      default:
        return status;
    }
  };

  const renderPaymentTable = () => {
    return (
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.tableCell}>Transaction ID</th>
              <th style={styles.tableCell}>User</th>
              <th style={styles.tableCell}>Amount</th>
              <th style={styles.tableCell}>Method</th>
              <th style={styles.tableCell}>Status</th>
              <th style={styles.tableCell}>Date</th>
              <th style={styles.tableCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  <div style={styles.transactionId}>{payment.transactionId}</div>
                </td>
                <td style={styles.tableCell}>
                  <div>
                    <div style={styles.userName}>{payment.userName}</div>
                    <div style={styles.userEmail}>{payment.userEmail}</div>
                  </div>
                </td>
                <td style={styles.tableCell}>R{payment.amount}</td>
                <td style={styles.tableCell}>
                  <div style={styles.paymentMethod}>
                    <div>{payment.paymentMethod}</div>
                    <div style={styles.fee}>Fee: R{payment.processingFee || 0}</div>
                  </div>
                </td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: getPaymentStatusColor(payment.status)
                  }}>
                    {getPaymentStatusText(payment.status)}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  {new Date(payment.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.actionButtons}>
                    {payment.status === 'pending_verification' && (
                      <button
                        style={styles.verifyButton}
                        onClick={() => handleVerifyBankTransfer(payment.id)}
                      >
                        Verify
                      </button>
                    )}
                    
                    {payment.status === 'completed' && !payment.refundId && (
                      <button
                        style={styles.refundButton}
                        onClick={() => openRefundModal(payment)}
                      >
                        Refund
                      </button>
                    )}
                    
                    <button
                      style={styles.viewButton}
                      onClick={() => setSelectedPayment(payment)}
                    >
                      View Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRefundTable = () => {
    return (
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.tableCell}>Refund ID</th>
              <th style={styles.tableCell}>Original Payment</th>
              <th style={styles.tableCell}>User</th>
              <th style={styles.tableCell}>Refund Amount</th>
              <th style={styles.tableCell}>Reason</th>
              <th style={styles.tableCell}>Date</th>
              <th style={styles.tableCell}>Processed By</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map(refund => (
              <tr key={refund.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{refund.id}</td>
                <td style={styles.tableCell}>{refund.originalPaymentId}</td>
                <td style={styles.tableCell}>
                  <div>
                    <div style={styles.userName}>{refund.userName}</div>
                    <div style={styles.userEmail}>{refund.userEmail}</div>
                  </div>
                </td>
                <td style={styles.tableCell}>R{refund.amount}</td>
                <td style={styles.tableCell}>{refund.reason}</td>
                <td style={styles.tableCell}>
                  {new Date(refund.processedAt).toLocaleDateString()}
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.processedBy}>{refund.processedBy}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStats = () => {
    return (
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>Total Payments</h3>
          <div style={styles.statNumber}>{stats.total}</div>
        </div>
        <div style={styles.statCard}>
          <h3>Completed</h3>
          <div style={styles.statNumber}>{stats.completed}</div>
        </div>
        <div style={styles.statCard}>
          <h3>Pending</h3>
          <div style={styles.statNumber}>{stats.pending}</div>
        </div>
        <div style={styles.statCard}>
          <h3>Failed</h3>
          <div style={styles.statNumber}>{stats.failed}</div>
        </div>
        <div style={styles.statCard}>
          <h3>Refunded</h3>
          <div style={styles.statNumber}>{stats.refunded}</div>
        </div>
        <div style={styles.statCard}>
          <h3>Total Revenue</h3>
          <div style={styles.statNumber}>R{stats.completedAmount}</div>
        </div>
        <div style={styles.statCard}>
          <h3>Total Refunded</h3>
          <div style={styles.statNumber}>R{stats.completedAmount - (stats.completedAmount - stats.refundedAmount)}</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading payment data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Payment Management</h1>
        <div style={styles.statsSummary}>
          {renderStats()}
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'payments' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('payments')}
        >
          Payments ({payments.length})
        </button>
        <button
          style={activeTab === 'refunds' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('refunds')}
        >
          Refunds ({refunds.length})
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'payments' && renderPaymentTable()}
        {activeTab === 'refunds' && renderRefundTable()}
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Payment Details</h2>
              <button style={styles.closeButton} onClick={() => setSelectedPayment(null)}>
                ×
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <label>Transaction ID:</label>
                  <div>{selectedPayment.transactionId}</div>
                </div>
                <div style={styles.detailItem}>
                  <label>Amount:</label>
                  <div>R{selectedPayment.amount}</div>
                </div>
                <div style={styles.detailItem}>
                  <label>Processing Fee:</label>
                  <div>R{selectedPayment.processingFee || 0}</div>
                </div>
                <div style={styles.detailItem}>
                  <label>Total:</label>
                  <div>R{(selectedPayment.amount || 0) + (selectedPayment.processingFee || 0)}</div>
                </div>
                <div style={styles.detailItem}>
                  <label>Payment Method:</label>
                  <div>{selectedPayment.paymentMethod}</div>
                </div>
                <div style={styles.detailItem}>
                  <label>Status:</label>
                  <div style={{
                    ...styles.statusBadge,
                    backgroundColor: getPaymentStatusColor(selectedPayment.status)
                  }}>
                    {getPaymentStatusText(selectedPayment.status)}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <label>Date:</label>
                  <div>{new Date(selectedPayment.createdAt).toLocaleString()}</div>
                </div>
                <div style={styles.detailItem}>
                  <label>User:</label>
                  <div>
                    <div>{selectedPayment.userName}</div>
                    <div>{selectedPayment.userEmail}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Process Refund</h2>
              <button style={styles.closeButton} onClick={closeRefundModal}>
                ×
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.refundDetails}>
                <h3>Payment to Refund</h3>
                <div style={styles.refundInfo}>
                  <p><strong>Transaction ID:</strong> {selectedPayment.transactionId}</p>
                  <p><strong>Amount:</strong> R{selectedPayment.amount}</p>
                  <p><strong>Date:</strong> {new Date(selectedPayment.createdAt).toLocaleDateString()}</p>
                  <p><strong>User:</strong> {selectedPayment.userName}</p>
                </div>
              </div>
              
              <div style={styles.refundForm}>
                <h3>Refund Details</h3>
                <div style={styles.formGroup}>
                  <label>Refund Reason *</label>
                  <textarea
                    style={styles.textarea}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Please provide a reason for this refund..."
                    rows="4"
                  />
                </div>
                
                <div style={styles.refundCalculation}>
                  <p><strong>Original Amount:</strong> R{selectedPayment.amount}</p>
                  <p><strong>Processing Fee:</strong> -R{selectedPayment.processingFee || 0}</p>
                  <p><strong>Refund Amount:</strong> R{(selectedPayment.amount || 0) - (selectedPayment.processingFee || 0)}</p>
                </div>
                
                <div style={styles.refundActions}>
                  <button
                    style={styles.cancelButton}
                    onClick={closeRefundModal}
                  >
                    Cancel
                  </button>
                  <button
                    style={styles.confirmRefundButton}
                    onClick={() => handleProcessRefund(selectedPayment.id)}
                  >
                    Process Refund
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
    gap: '30px',
  },
  statsSummary: {
    flex: 1,
  },
  tabs: {
    display: 'flex',
    borderBottom: '2px solid #e0e0e0',
    marginBottom: '20px',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#666',
    flex: 1,
  },
  activeTab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid #0051a8',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#0051a8',
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
  },
  tableRow: {
    borderBottom: '2px solid #e0e0e0',
  },
  tableCell: {
    padding: '12px',
    textAlign: 'left',
    border: '1px solid #e0e0e0',
  },
  transactionId: {
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  userName: {
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: '12px',
    color: '#666',
  },
  paymentMethod: {
    textAlign: 'center',
  },
  fee: {
    fontSize: '11px',
    color: '#e74c3c',
    marginTop: '5px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  verifyButton: {
    padding: '6px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  refundButton: {
    padding: '6px 12px',
    backgroundColor: '#ffc107',
    color: '#212529',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  viewButton: {
    padding: '6px 12px',
    backgroundColor: '#0051a8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0051a8',
    marginBottom: '5px',
  },
  modalOverlay: {
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
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '0',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 20px 0',
    borderBottom: '2px solid #e0e0e0',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  modalContent: {
    padding: '20px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  detailItem: {
    marginBottom: '15px',
  },
  detailItemLabel: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#333',
  },
  refundDetails: {
    marginBottom: '20px',
  },
  refundInfo: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  refundForm: {
    backgroundColor: '#fff3cd',
    padding: '20px',
    borderRadius: '8px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
  },
  refundCalculation: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  refundCalculation p: {
    margin: '5px 0',
  },
  refundActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  confirmRefundButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  processedBy: {
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
};

export default AdminPaymentManagement;
