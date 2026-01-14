import React from 'react';

function ChooseRole({ accountRole, setActiveRole, setCurrentPage }) {
  const go = (role, page) => {
    setActiveRole(role);
    localStorage.setItem('distinctionBoundActiveRole', role);
    setCurrentPage(page);
  };

  const styles = {
    container: {
      minHeight: "90vh",
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    },
    title: {
      fontSize: "32px",
      color: "#0051a8",
      margin: "0 0 40px 0",
      textAlign: "center"
    },
    buttonContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "15px",
      width: "100%",
      maxWidth: "400px"
    },
    button: {
      padding: "15px 25px",
      backgroundColor: "#0051a8",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "bold",
      transition: "all 0.2s ease",
      textAlign: "center"
    },
    adminButton: {
      backgroundColor: "#28a745", // Green for admin
    },
    instructorButton: {
      backgroundColor: "#fd7e14", // Orange for instructor
    },
    studentButton: {
      backgroundColor: "#0051a8", // Blue for student
    },
    userInfo: {
      backgroundColor: "#f8f9fa",
      padding: "20px",
      borderRadius: "10px",
      marginBottom: "30px",
      textAlign: "center",
      width: "100%",
      maxWidth: "400px"
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.userInfo}>
        <h3>Current Role: <strong>{accountRole?.toUpperCase() || 'GUEST'}</strong></h3>
        <p>Select which dashboard you want to access:</p>
      </div>
      
      <h1 style={styles.title}>Select Dashboard</h1>
      
      <div style={styles.buttonContainer}>
        {accountRole === 'admin' && (
          <button 
            onClick={() => go('admin', 'admin-portal')} 
            style={{...styles.button, ...styles.adminButton}}
          >
            🛡️ Admin Dashboard
          </button>
        )}

        {(accountRole === 'admin' || accountRole === 'instructor') && (
          <button 
            onClick={() => go('instructor', 'instructor-dashboard')} 
            style={{...styles.button, ...styles.instructorButton}}
          >
            👨‍🏫 Instructor Dashboard
          </button>
        )}

        <button 
          onClick={() => go('student', 'student-portal-dashboard')} 
          style={{...styles.button, ...styles.studentButton}}
        >
          🎓 Student Dashboard
        </button>
      </div>
    </div>
  );
}

export default ChooseRole;
