import React, { useState, useEffect } from 'react';
import api from '../services/api';

function FinancePortal({ currentUser, onLogout, setCurrentPage }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [financeData, setFinanceData] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    loadFinanceData();
  }, [activeTab, selectedMonth, selectedYear]);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const data = await api.getFinanceOverview();
        setFinanceData(data);
      } else if (activeTab === 'monthly') {
        const summary = await api.getMonthlySummary(
          selectedYear || null,
          selectedMonth || null
        );
        setMonthlySummary(summary);
      } else if (activeTab === 'transactions') {
        const trans = await api.getTransactions();
        setTransactions(trans);
      }
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `R${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOverview = () => {
    if (!financeData) return <div>Loading...</div>;

    return (
      <div>
        {/* Summary Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{formatCurrency(financeData.total_revenue)}</h3>
            <p style={styles.statLabel}>Total Revenue</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{financeData.total_purchases}</h3>
            <p style={styles.statLabel}>Total Purchases</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{financeData.total_enrollments}</h3>
            <p style={styles.statLabel}>Total Enrollments</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{financeData.instructor_payouts.length}</h3>
            <p style={styles.statLabel}>Active Instructors</p>
          </div>
        </div>

        {/* Revenue Split */}
        <div style={styles.section}>
          <h3>💰 Revenue Distribution</h3>
          <div style={styles.revenueSplit}>
            <div style={styles.splitCard}>
              <h4>👨‍🏫 Instructors</h4>
              <p style={styles.splitAmount}>
                {formatCurrency(financeData.total_instructor_earnings)}
              </p>
              <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                (Based on per-session % set by owner)
              </p>
            </div>
            <div style={{...styles.splitCard, borderColor: '#ffd700'}}>
              <h4>💼 Platform/Admin</h4>
              <p style={styles.splitAmount}>
                {formatCurrency(financeData.platform_admin_earnings)}
              </p>
              <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                (Remainder after instructor payouts)
              </p>
            </div>
          </div>
          <div style={{marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
            <p style={{margin: 0, fontSize: '14px', color: '#666'}}>
              <strong>Note:</strong> Owner decides instructor payout % when creating each session. 
              Platform/Admin automatically receives the remaining amount.
            </p>
          </div>
        </div>

        {/* Instructors Detail */}
        <div style={styles.section}>
          <h3>👨‍🏫 Instructors Breakdown</h3>
          {financeData.instructor_payouts.map((instructor) => (
            <div key={instructor.instructor_id} style={styles.instructorCard}>
              <div style={styles.instructorHeader}>
                <div>
                  <h4 style={{margin: 0}}>{instructor.instructor_name}</h4>
                  <p style={{margin: '5px 0', color: '#666', fontSize: '14px'}}>
                    {instructor.instructor_email}
                  </p>
                </div>
                <div style={styles.instructorTotal}>
                  <div style={{marginBottom: '10px'}}>
                    <p style={{margin: 0, fontSize: '14px', color: '#666'}}>Total Earned</p>
                    <h3 style={{margin: '5px 0', color: '#28a745'}}>
                      {formatCurrency(instructor.instructor_share)}
                    </h3>
                  </div>
                  <div style={{display: 'flex', gap: '15px', fontSize: '13px'}}>
                    <div>
                      <p style={{margin: 0, color: '#666'}}>Paid Out</p>
                      <p style={{margin: '3px 0', fontWeight: 'bold', color: '#0051a8'}}>
                        {formatCurrency(instructor.paid_out || 0)}
                      </p>
                    </div>
                    <div>
                      <p style={{margin: 0, color: '#666'}}>Pending</p>
                      <p style={{margin: '3px 0', fontWeight: 'bold', color: '#dc3545'}}>
                        {formatCurrency(instructor.pending_payout || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Courses */}
              {instructor.courses.map((course) => (
                <div key={course.course_id} style={styles.courseSection}>
                  <h5 style={styles.courseTitle}>📚 {course.course_title}</h5>
                  <div style={styles.courseSummary}>
                    <span>Total Revenue: {formatCurrency(course.total_revenue)}</span>
                    <span>Instructor Earned: <strong>{formatCurrency(course.total_earned)}</strong></span>
                  </div>

                  {/* Sessions in this course */}
                  <div style={styles.sessionsContainer}>
                    {course.sessions.map((session) => (
                      <div key={session.session_id} style={styles.sessionCard}>
                        <div style={styles.sessionHeader}>
                          <div>
                            <strong>{session.session_title}</strong>
                            <p style={{margin: '3px 0', fontSize: '12px', color: '#666'}}>
                              📅 {formatDate(session.session_date)} | 📍 {session.session_venue}
                            </p>
                            <p style={{margin: '3px 0', fontSize: '12px', color: '#0051a8', fontWeight: 'bold'}}>
                              Instructor gets: {session.instructor_percentage}%
                            </p>
                          </div>
                          <div style={{textAlign: 'right'}}>
                            <p style={{margin: 0, fontSize: '14px', color: '#0051a8'}}>
                              Revenue: {formatCurrency(session.revenue)}
                            </p>
                            <p style={{margin: '3px 0', fontSize: '14px', color: '#28a745', fontWeight: 'bold'}}>
                              Earned: {formatCurrency(session.instructor_earned)}
                            </p>
                            <p style={{margin: 0, fontSize: '12px', color: '#666'}}>
                              {session.student_count} student(s)
                            </p>
                          </div>
                        </div>

                        {/* Student purchases for this session */}
                        <div style={styles.purchasesList}>
                          {session.purchases.map((purchase, idx) => (
                            <div key={idx} style={styles.purchaseItem}>
                              <span>
                                {purchase.student_name}
                                {purchase.is_test && <span style={{marginLeft: '5px', fontSize: '10px', backgroundColor: '#ffc107', color: '#000', padding: '2px 6px', borderRadius: '4px'}}>TEST</span>}
                              </span>
                              <span style={{fontSize: '11px', color: '#888'}}>
                                #{purchase.ticket_id} | {formatDate(purchase.date)}
                              </span>
                              <span>{formatCurrency(purchase.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthlySummary = () => {
    if (!monthlySummary) return <div>Loading...</div>;

    return (
      <div>
        {/* Month/Year Selector */}
        <div style={styles.filterSection}>
          <label style={styles.filterLabel}>
            Year:
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </label>
          <label style={styles.filterLabel}>
            Month:
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </label>
        </div>

        {/* Period Summary */}
        <div style={styles.section}>
          <h3>📊 Summary for {monthlySummary.period}</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3 style={styles.statValue}>{formatCurrency(monthlySummary.total_revenue)}</h3>
              <p style={styles.statLabel}>Total Revenue</p>
            </div>
            <div style={styles.statCard}>
              <h3 style={styles.statValue}>{formatCurrency(monthlySummary.special_admin_earned)}</h3>
              <p style={styles.statLabel}>⭐ Special Admin (20%)</p>
            </div>
            <div style={styles.statCard}>
              <h3 style={styles.statValue}>{formatCurrency(monthlySummary.regular_admin_earned)}</h3>
              <p style={styles.statLabel}>Platform (10%)</p>
            </div>
          </div>
        </div>

        {/* Instructor Monthly Details */}
        <div style={styles.section}>
          <h3>👨‍🏫 Instructor Earnings This Period</h3>
          {monthlySummary.instructors.map((instructor, idx) => (
            <div key={idx} style={styles.instructorCard}>
              <div style={styles.instructorHeader}>
                <div>
                  <h4 style={{margin: 0}}>{instructor.instructor_name}</h4>
                  <p style={{margin: '5px 0', color: '#666'}}>{instructor.instructor_email}</p>
                </div>
                <div style={styles.instructorTotal}>
                  <p style={{margin: 0, fontSize: '14px', color: '#666'}}>Monthly Total</p>
                  <h3 style={{margin: '5px 0', color: '#28a745'}}>
                    {formatCurrency(instructor.total_earned)}
                  </h3>
                </div>
              </div>

              {/* Courses */}
              {instructor.courses.map((course, cidx) => (
                <div key={cidx} style={styles.courseSection}>
                  <h5 style={styles.courseTitle}>📚 {course.course_title}</h5>

                  {/* Sessions */}
                  {course.sessions.map((session, sidx) => (
                    <div key={sidx} style={styles.sessionCard}>
                      <div style={styles.sessionHeader}>
                        <div>
                          <strong>{session.session_title}</strong>
                          <p style={{margin: '3px 0', fontSize: '12px', color: '#666'}}>
                            📅 {formatDate(session.session_date)}
                          </p>
                        </div>
                        <div style={{textAlign: 'right'}}>
                          <p style={{margin: 0, fontSize: '14px', color: '#28a745', fontWeight: 'bold'}}>
                            Earned: {formatCurrency(session.earned)}
                          </p>
                          <p style={{margin: '3px 0', fontSize: '12px', color: '#666'}}>
                            {session.students.length} student(s)
                          </p>
                        </div>
                      </div>

                      {/* Students */}
                      <div style={styles.purchasesList}>
                        {session.students.map((student, stidx) => (
                          <div key={stidx} style={styles.purchaseItem}>
                            <span>
                              {student.name}
                              {student.is_test && <span style={{marginLeft: '5px', fontSize: '10px', backgroundColor: '#ffc107', color: '#000', padding: '2px 6px', borderRadius: '4px'}}>TEST</span>}
                            </span>
                            <span>Paid: {formatCurrency(student.amount)}</span>
                            <span style={{color: '#28a745', fontWeight: 'bold'}}>
                              Earned: {formatCurrency(student.earned)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTransactions = () => {
    return (
      <div style={styles.section}>
        <h3>📝 All Transactions</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Course</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Payment Method</th>
              <th style={styles.th}>Ticket</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, idx) => (
              <tr key={idx} style={transaction.is_test ? {backgroundColor: '#fffbf0'} : {}}>
                <td style={styles.td}>{formatDate(transaction.purchased_at)}</td>
                <td style={styles.td}>
                  {transaction.user_name}
                  {transaction.is_test && <span style={{marginLeft: '5px', fontSize: '10px', backgroundColor: '#ffc107', color: '#000', padding: '2px 6px', borderRadius: '4px'}}>TEST</span>}
                </td>
                <td style={styles.td}>{transaction.user_email}</td>
                <td style={styles.td}>{transaction.course_title || 'N/A'}</td>
                <td style={styles.td}>
                  {transaction.is_test ? 'R0.00' : formatCurrency(transaction.amount)}
                  {transaction.is_test && <span style={{fontSize: '11px', color: '#ff9800', marginLeft: '5px', fontWeight: 'bold'}}>🧪 TEST</span>}
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: transaction.is_test ? '#ffc107' : '#0051a8'
                  }}>
                    {transaction.payment_method}
                  </span>
                </td>
                <td style={styles.td}>
                  <code style={styles.ticketCode}>{transaction.ticket_id}</code>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: transaction.status === 'confirmed' ? '#28a745' : '#ffc107'
                  }}>
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>💰 Finance Portal</h1>
          <p style={styles.subtitle}>Revenue, payouts, and monthly summaries</p>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => setCurrentPage('admin-portal')}
            style={styles.secondaryButton}
          >
            ← Back to Admin
          </button>
          <button onClick={onLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? styles.activeTab : styles.tab}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          style={activeTab === 'monthly' ? styles.activeTab : styles.tab}
        >
          📅 Monthly Summary
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          style={activeTab === 'transactions' ? styles.activeTab : styles.tab}
        >
          📝 All Transactions
        </button>
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'monthly' && renderMonthlySummary()}
            {activeTab === 'transactions' && renderTransactions()}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: 0,
    color: '#0051a8',
  },
  subtitle: {
    margin: '5px 0 0 0',
    color: '#666',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s',
  },
  activeTab: {
    padding: '12px 24px',
    backgroundColor: '#0051a8',
    color: 'white',
    border: '2px solid #0051a8',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  content: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '2px solid #e9ecef',
  },
  statValue: {
    margin: '0 0 10px 0',
    color: '#0051a8',
    fontSize: '32px',
  },
  statLabel: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
  },
  section: {
    marginTop: '30px',
  },
  revenueSplit: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '15px',
  },
  splitCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '3px solid #0051a8',
  },
  percentage: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#0051a8',
    margin: '10px 0',
  },
  splitAmount: {
    fontSize: '20px',
    color: '#28a745',
    fontWeight: 'bold',
    margin: '5px 0',
  },
  instructorCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '2px solid #e9ecef',
  },
  instructorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #ddd',
  },
  instructorTotal: {
    textAlign: 'right',
  },
  courseSection: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #ddd',
  },
  courseTitle: {
    margin: '0 0 10px 0',
    color: '#0051a8',
    fontSize: '16px',
  },
  courseSummary: {
    display: 'flex',
    gap: '20px',
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
  },
  sessionsContainer: {
    marginTop: '10px',
  },
  sessionCard: {
    backgroundColor: '#fafafa',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '10px',
    border: '1px solid #e9ecef',
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  purchasesList: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #e9ecef',
  },
  purchaseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    fontSize: '13px',
    backgroundColor: 'white',
    marginBottom: '5px',
    borderRadius: '4px',
  },
  filterSection: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  filterLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  filterSelect: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
  },
  th: {
    backgroundColor: '#0051a8',
    color: 'white',
    padding: '12px',
    textAlign: 'left',
    fontSize: '14px',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ddd',
    fontSize: '14px',
  },
  ticketCode: {
    backgroundColor: '#f8f9fa',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    border: '1px solid #ddd',
  },
  badge: {
    backgroundColor: '#0051a8',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    textTransform: 'uppercase',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
};

export default FinancePortal;
