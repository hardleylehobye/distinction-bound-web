import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

function Courses({ userRole }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [purchasedSessions, setPurchasedSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load courses from database
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      // Only load public courses for non-admin users
      const coursesQuery = userRole === 'admin' 
        ? collection(db, "courses")
        : query(collection(db, "courses"), where("visibility", "==", "public"));
      
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
        
        return courseData;
      }));
      
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSession = (session) => {
    if (!userRole) {
      alert('Please login to purchase session access');
      return;
    }
    
    if (purchasedSessions.includes(session.id)) {
      alert('You already own this session!');
      return;
    }
    
    // Simulate purchase
    alert(`Processing payment for ${session.title} - ${session.price}`);
    setPurchasedSessions([...purchasedSessions, session.id]);
  };

  const isSessionPurchased = (sessionId) => {
    return purchasedSessions.includes(sessionId);
  };

  const renderCoursesList = () => (
    <div>
      {loading ? (
        <p>Loading courses...</p>
      ) : courses.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No courses available yet.</p>
        </div>
      ) : (
        <div style={styles.coursesGrid}>
          {courses.map((course) => (
            <div 
              key={course.id} 
              style={styles.courseCard}
              onClick={() => setSelectedCourse(course)}
            >
              <div style={styles.courseIcon}>{course.image || '📚'}</div>
              <h2 style={styles.courseTitle}>{course.title}</h2>
              <p style={styles.courseDescription}>{course.description}</p>
              
              <div style={styles.courseInfo}>
                <div style={styles.infoItem}>
                  <span>👨‍🏫 {course.instructorName || 'TBC'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span>📅 {course.sessions ? course.sessions.length : 0} session(s)</span>
                </div>
              </div>
              
              <button style={styles.viewButton}>
                View Sessions →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCourseSessions = (course) => (
    <div style={styles.courseDetailView}>
      <button 
        style={styles.backButton}
        onClick={() => setSelectedCourse(null)}
      >
        ← Back to Courses
      </button>
      
      <div style={styles.courseHeader}>
        <div style={styles.courseIconLarge}>{course.image || '📚'}</div>
        <div>
          <h1 style={styles.courseDetailTitle}>{course.title}</h1>
          <p style={styles.courseDetailDescription}>{course.description}</p>
          <p style={styles.instructorName}>Instructor: {course.instructorName || 'TBC'}</p>
        </div>
      </div>

      <h2 style={styles.sessionsTitle}>Available Sessions</h2>
      {course.sessions && course.sessions.length > 0 ? (
        <div style={styles.sessionsGrid}>
          {course.sessions.map((session) => {
          const isPurchased = isSessionPurchased(session.id);
          
          return (
            <div key={session.id} style={styles.sessionCard}>
              <div style={styles.sessionHeader}>
                <h3 style={styles.sessionTitle}>{session.title}</h3>
                {isPurchased && (
                  <span style={styles.purchasedBadge}>✓ Purchased</span>
                )}
              </div>
              
              <p style={styles.sessionDescription}>{session.description}</p>
              
              <div style={styles.sessionDetails}>
                <div style={styles.detailRow}>
                  <span>📅 {session.date}</span>
                </div>
                <div style={styles.detailRow}>
                  <span>⏰ {session.time}</span>
                </div>
                <div style={styles.detailRow}>
                  <span>📍 {session.venue || session.location}</span>
                </div>
                <div style={styles.detailRow}>
                  <span>🎫 {session.capacity || 'TBC'} capacity</span>
                </div>
              </div>

              <div style={styles.topicsSection}>
                <strong>Topics covered:</strong>
                <ul style={styles.topicsList}>
                  {session.topics.map((topic, idx) => (
                    <li key={idx}>{topic}</li>
                  ))}
                </ul>
              </div>

              <div style={styles.sessionFooter}>
                <span style={styles.sessionPrice}>{session.price}</span>
                {isPurchased ? (
                  <button
                    style={styles.accessButton}
                    onClick={() => setSelectedSession(session)}
                  >
                    Access Materials
                  </button>
                ) : (
                  <button
                    style={styles.purchaseButton}
                    onClick={() => handlePurchaseSession(session)}
                  >
                    Purchase Access
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <p>No sessions available for this course yet.</p>
        </div>
      )}
    </div>
  );

  const renderSessionMaterials = (session) => (
    <div style={styles.modal} onClick={() => setSelectedSession(null)}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button
          style={styles.closeButton}
          onClick={() => setSelectedSession(null)}
        >
          ✕
        </button>
        
        <h2 style={styles.modalTitle}>{session.title}</h2>
        <p style={styles.modalDescription}>{session.description}</p>
        
        <div style={styles.tabContainer}>
          <button
            style={activeTab === 'overview' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            style={activeTab === 'notes' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('notes')}
          >
            Notes ({session.notes.length})
          </button>
          <button
            style={activeTab === 'videos' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('videos')}
          >
            Videos ({session.videos.length})
          </button>
        </div>

        <div style={styles.tabContent}>
          {activeTab === 'overview' && (
            <div>
              <h3 style={styles.sectionHeading}>Session Details</h3>
              <p><strong>Date:</strong> {session.date}</p>
              <p><strong>Time:</strong> {session.time}</p>
              <p><strong>Venue:</strong> {session.venue}</p>
              
              <h3 style={styles.sectionHeading}>Topics Covered</h3>
              <ul style={styles.materialsList}>
                {session.topics.map((topic, idx) => (
                  <li key={idx}>{topic}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <h3 style={styles.sectionHeading}>Course Notes</h3>
              {session.notes.length > 0 ? (
                <div style={styles.materialsList}>
                  {session.notes.map((note) => (
                    <div key={note.id} style={styles.materialItem}>
                      <span style={styles.materialIcon}>📄</span>
                      <div style={styles.materialInfo}>
                        <strong>{note.title}</strong>
                        <span style={styles.materialType}>{note.type}</span>
                      </div>
                      <button style={styles.downloadButton}>Download</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyState}>No notes available yet</p>
              )}
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              <h3 style={styles.sectionHeading}>Video Lessons</h3>
              {session.videos.length > 0 ? (
                <div style={styles.materialsList}>
                  {session.videos.map((video) => (
                    <div key={video.id} style={styles.materialItem}>
                      <span style={styles.materialIcon}>🎥</span>
                      <div style={styles.materialInfo}>
                        <strong>{video.title}</strong>
                        <span style={styles.materialType}>{video.duration}</span>
                      </div>
                      <button style={styles.playButton}>Play</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyState}>No videos available yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Course Library</h1>
        <p style={styles.heroSubtitle}>
          Browse courses, purchase sessions, and access exclusive learning materials
        </p>
      </section>

      <section style={styles.mainSection}>
        {!selectedCourse ? (
          renderCoursesList()
        ) : (
          renderCourseSessions(selectedCourse)
        )}
      </section>

      {selectedSession && renderSessionMaterials(selectedSession)}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  hero: {
    backgroundColor: '#0051a8',
    color: 'white',
    padding: '60px 20px',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '15px',
    margin: 0,
  },
  heroSubtitle: {
    fontSize: '18px',
    opacity: 0.9,
    margin: 0,
  },
  mainSection: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
  },
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '25px',
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  courseIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  courseTitle: {
    fontSize: '22px',
    color: '#0051a8',
    marginBottom: '10px',
  },
  courseDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    lineHeight: '1.6',
  },
  courseInfo: {
    marginBottom: '20px',
  },
  infoItem: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '8px',
  },
  viewButton: {
    width: '100%',
    backgroundColor: '#0051a8',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  courseDetailView: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  backButton: {
    backgroundColor: 'transparent',
    color: '#0051a8',
    border: '2px solid #0051a8',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '30px',
  },
  courseHeader: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    marginBottom: '40px',
  },
  courseIconLarge: {
    fontSize: '64px',
  },
  courseDetailTitle: {
    fontSize: '32px',
    color: '#0051a8',
    marginBottom: '10px',
  },
  courseDetailDescription: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '10px',
  },
  instructorName: {
    fontSize: '14px',
    color: '#333',
    fontWeight: 'bold',
  },
  sessionsTitle: {
    fontSize: '24px',
    color: '#0051a8',
    marginBottom: '20px',
  },
  sessionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  sessionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    border: '2px solid #e0e0e0',
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  sessionTitle: {
    fontSize: '18px',
    color: '#0051a8',
    margin: 0,
    flex: 1,
  },
  purchasedBadge: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  sessionDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
  },
  sessionDetails: {
    marginBottom: '15px',
  },
  detailRow: {
    fontSize: '13px',
    color: '#333',
    marginBottom: '5px',
  },
  topicsSection: {
    marginBottom: '15px',
    fontSize: '14px',
  },
  topicsList: {
    margin: '8px 0',
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#666',
  },
  sessionFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '15px',
    borderTop: '2px solid #e0e0e0',
  },
  sessionPrice: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#0051a8',
  },
  purchaseButton: {
    backgroundColor: '#ffd700',
    color: '#0051a8',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  accessButton: {
    backgroundColor: '#0051a8',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '30px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  modalTitle: {
    fontSize: '24px',
    color: '#0051a8',
    marginBottom: '10px',
  },
  modalDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
  },
  tabContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #e0e0e0',
  },
  tab: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    color: '#666',
    borderBottom: '3px solid transparent',
  },
  tabActive: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    color: '#0051a8',
    borderBottom: '3px solid #0051a8',
  },
  tabContent: {
    padding: '20px 0',
  },
  sectionHeading: {
    fontSize: '18px',
    color: '#0051a8',
    marginBottom: '15px',
  },
  materialsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  materialItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  materialIcon: {
    fontSize: '24px',
  },
  materialInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  materialType: {
    fontSize: '12px',
    color: '#666',
  },
  downloadButton: {
    backgroundColor: '#0051a8',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  playButton: {
    backgroundColor: '#ffd700',
    color: '#0051a8',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    color: '#666',
    padding: '30px',
    fontSize: '14px',
  },
};

export default Courses;