import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";

function InstructorPortal({ currentUser, onLogout, setCurrentPage }) {
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [ticketNumber, setTicketNumber] = useState('');
  const [showAttendance, setShowAttendance] = useState(false);
  const attendanceListRef = useRef(null);

  // Load instructor's courses
  useEffect(() => {
    if (currentUser) {
      loadMyCourses();
    }
  }, [currentUser]);

  const loadMyCourses = async () => {
    setLoading(true);
    try {
      // One API call – courses already include sessions
      const allCourses = await api.getCourses();
      const myAssignedCourses = allCourses.filter(course => course.instructor_id === currentUser?.uid);

      if (myAssignedCourses.length === 0) {
        setMyCourses([]);
        setLoading(false);
        return;
      }

      setMyCourses(myAssignedCourses.map(course => ({
        id: course.course_id,
        ...course,
        sessions: course.sessions || [],
        enrollmentCount: course.enrollmentCount || 0
      })));
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      setCurrentPage("home");
    }
  };

  const handleMarkAttendance = async (session) => {
    setSelectedSession(session);
    setShowAttendance(true);
    loadAttendance(session.session_id);
  };

  const loadAttendance = async (sessionId) => {
    try {
      const attendanceData = await api.getSessionAttendance(sessionId);
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Error loading attendance:", error);
      setAttendance([]);
    }
  };

  const submitAttendance = async (e) => {
    e.preventDefault();
    if (!ticketNumber.trim()) {
      alert("Please enter a ticket number");
      return;
    }

    try {
      const result = await api.markAttendance(
        ticketNumber.trim(),
        selectedSession.session_id,
        currentUser.uid
      );
      setTicketNumber('');
      // Refresh attendance list so the new person appears
      await loadAttendance(selectedSession.session_id);
      attendanceListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      alert(`✅ Attendance marked for ${result.student_name}. They appear in the list below.`);
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("❌ Error: " + (error.message || "Invalid ticket number or already marked"));
    }
  };

  // Navigate to course management
  const handleManageCourses = () => {
    setCurrentPage("manage-courses");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Instructor Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(currentUser?.role === 'admin' || currentUser?.role === 'instructor') && (
            <button 
              style={{
                padding: "10px 20px",
                backgroundColor: "#ffd700",
                color: "#0051a8",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
              onClick={() => setCurrentPage('choose-role')}
            >
              🔄 Switch Role
            </button>
          )}
          <button style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.userInfo}>
        <p><strong>Welcome, {currentUser?.name}</strong></p>
        <p>Email: {currentUser?.email}</p>
        <p>Role: Instructor</p>
      </div>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>My Courses</h2>
          <button style={styles.manageButton} onClick={handleManageCourses}>
            Manage Courses
          </button>
        </div>
        
        {loading ? (
          <p>Loading courses...</p>
        ) : myCourses.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{fontSize: '16px', color: '#666', marginBottom: '20px'}}>
              No courses have been allocated to you yet.
            </p>
            <p style={{fontSize: '14px', color: '#999', marginBottom: '20px'}}>
              Please contact an administrator to get courses assigned.
            </p>
            <button style={styles.createButton} onClick={handleManageCourses}>
              Manage Courses
            </button>
          </div>
        ) : (
          <ul style={styles.courseList}>
            {myCourses.map((course) => (
              <li key={course.id} style={styles.courseItem}>
                <div>
                  <strong>{course.title}</strong>
                  <p style={styles.courseDesc}>{course.description}</p>
                  <span style={styles.courseMeta}>
                    {course.sessions?.length || 0} sessions • 
                    {course.enrollmentCount || 0} enrolled • 
                    {course.visibility === 'public' ? ' Public' : ' Private'}
                  </span>
                  
                  {/* Sessions List */}
                  {course.sessions && course.sessions.length > 0 && (
                    <div style={styles.sessionsList}>
                      <h4 style={{marginTop: '15px', marginBottom: '10px', color: '#0051a8'}}>Sessions:</h4>
                      {course.sessions.map((session) => (
                        <div key={session.session_id} style={styles.sessionItem}>
                          <div>
                            <strong>{session.title}</strong>
                            <span style={{marginLeft: '10px', fontSize: '12px', color: '#666'}}>
                              📅 {session.date} {session.time ? `at ${session.time}` : ''}
                            </span>
                          </div>
                          <button
                            style={styles.attendanceButton}
                            onClick={() => handleMarkAttendance(session)}
                          >
                            📋 Mark Attendance
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Stats</h2>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>{myCourses.length}</h3>
            <p style={styles.statLabel}>Total Courses</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>{myCourses.reduce((acc, c) => acc + (c.sessions?.length || 0), 0)}</h3>
            <p style={styles.statLabel}>Total Sessions</p>
          </div>
        </div>
      </section>

      {/* Attendance Modal */}
      {showAttendance && selectedSession && (
        <div style={styles.modal} onClick={() => setShowAttendance(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setShowAttendance(false)}>✕</button>
            <h2 style={styles.modalTitle}>Mark Attendance</h2>
            <h3 style={{marginBottom: '20px', color: '#555'}}>{selectedSession.title}</h3>
            
            <form onSubmit={submitAttendance} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Enter Ticket Number:</label>
                <input
                  type="text"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="e.g. 123456 (6-digit ticket #)"
                  style={styles.input}
                  autoFocus
                />
              </div>
              <button type="submit" style={styles.submitButton}>
                ✓ Mark Present
              </button>
            </form>

            <div ref={attendanceListRef} style={styles.attendanceList}>
              <h3 style={{marginTop: '30px', marginBottom: '15px'}}>
                Attendance List ({attendance.length} present)
              </h3>
              {attendance.length === 0 ? (
                <p style={{color: '#999'}}>No attendance marked yet. Mark someone present above and they will appear here.</p>
              ) : (
                <ul style={{listStyle: 'none', padding: 0}}>
                  {attendance.map((record) => (
                    <li key={record.id || `${record.ticket_number}-${record.marked_at}`} style={styles.attendanceRecord}>
                      <div>
                        <strong>{record.student_name}</strong>
                        <span style={{marginLeft: '10px', color: '#666', fontSize: '12px'}}>
                          ({record.student_email})
                        </span>
                        <span style={{marginLeft: '10px', color: '#999', fontSize: '11px'}}>
                          🎫 {record.ticket_number}
                        </span>
                      </div>
                      <span style={{color: 'green', fontSize: '12px'}}>
                        ✓ {new Date(record.marked_at).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "90vh",
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  logoutButton: {
    padding: "10px 20px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  userInfo: {
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  section: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "24px",
    color: "#0051a8",
    margin: "0",
  },
  manageButton: {
    padding: "12px 25px",
    backgroundColor: "#0051a8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  createButton: {
    padding: "12px 25px",
    backgroundColor: "#0051a8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  courseList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  courseItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    border: "2px solid #e0e0e0",
  },
  courseDesc: {
    fontSize: "14px",
    color: "#666",
    margin: "5px 0",
  },
  courseMeta: {
    fontSize: "12px",
    color: "#999",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  statCard: {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
    border: "2px solid #e0e0e0",
  },
  statNumber: {
    fontSize: "32px",
    color: "#0051a8",
    margin: "0 0 5px 0",
  },
  statLabel: {
    fontSize: "14px",
    color: "#666",
    margin: 0,
  },
  sessionsList: {
    marginTop: '15px',
    paddingLeft: '15px',
    borderLeft: '3px solid #0051a8',
  },
  sessionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  attendanceButton: {
    padding: '8px 15px',
    backgroundColor: '#0051a8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px dashed #ddd',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  modalTitle: {
    color: '#0051a8',
    marginBottom: '10px',
  },
  form: {
    marginTop: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box',
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  attendanceList: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '2px solid #eee',
  },
  attendanceRecord: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    borderLeft: '4px solid #28a745',
  },
};

export default InstructorPortal;