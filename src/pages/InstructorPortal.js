import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function InstructorPortal({ currentUser, onLogout, setCurrentPage }) {
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load instructor's courses
  useEffect(() => {
    if (currentUser) {
      loadMyCourses();
    }
  }, [currentUser]);

  const loadMyCourses = async () => {
    setLoading(true);
    try {
      const coursesQuery = query(
        collection(db, "courses"),
        where("instructorId", "==", currentUser.uid)
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesData = await Promise.all(coursesSnapshot.docs.map(async (doc) => {
        const courseData = { id: doc.id, ...doc.data() };
        
        // Load sessions for this course
        try {
          const sessionsQuery = query(collection(db, "sessions"), where("courseId", "==", doc.id));
          const sessionsSnapshot = await getDocs(sessionsQuery);
          courseData.sessions = sessionsSnapshot.docs.map(sessionDoc => ({
            id: sessionDoc.id,
            ...sessionDoc.data()
          }));
        } catch (sessionError) {
          console.error("Error loading sessions for course:", doc.id, sessionError);
          courseData.sessions = [];
        }

        // Load enrollment count
        try {
          const enrollmentsQuery = query(collection(db, "enrollments"), where("courseId", "==", doc.id));
          const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
          courseData.enrollmentCount = enrollmentsSnapshot.size;
        } catch (enrollmentError) {
          console.error("Error loading enrollments for course:", doc.id, enrollmentError);
          courseData.enrollmentCount = 0;
        }
        
        return courseData;
      }));
      
      setMyCourses(coursesData);
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

  // Navigate to course management
  const handleManageCourses = () => {
    setCurrentPage("manage-courses");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Instructor Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {currentUser?.role === 'admin' && (
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
          <div>
            <p>You haven't created any courses yet.</p>
            <button style={styles.createButton} onClick={handleManageCourses}>
              Create Your First Course
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
  }
};

export default InstructorPortal;