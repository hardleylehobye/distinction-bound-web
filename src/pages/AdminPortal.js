import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import api from "../services/api";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

function AdminPortal({ onLogout, currentUser, setCurrentPage }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [addingInstructor, setAddingInstructor] = useState(false);
  const [managingSessions, setManagingSessions] = useState(null);


  // Load all data
  useEffect(() => {
    loadCourses();
    loadUsers();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      console.log("📡 Loading courses from API...");
      const coursesData = await api.getCourses();
      
      // Load sessions for each course
      const coursesWithSessions = await Promise.all(
        coursesData.map(async (course) => {
          try {
            const sessions = await api.getSessions(course.course_id);
            return { 
              ...course, 
              id: course.course_id, // Use course_id as id for compatibility
              sessions: sessions || [],
              enrollmentCount: 0 
            };
          } catch (error) {
            console.error("Error loading sessions for course:", course.course_id, error);
            return { 
              ...course, 
              id: course.course_id,
              sessions: [],
              enrollmentCount: 0 
            };
          }
        })
      );

      console.log("✓ Loaded courses from API:", coursesWithSessions.length);
      setCourses(coursesWithSessions);
    } catch (error) {
      console.error("Error loading courses:", error);
      alert("Error loading courses: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log("📡 Loading users from API...");
      const usersData = await api.getAllUsers();
      
      console.log("✓ Loaded users from API:", usersData.length);
      setAllUsers(usersData);
      setInstructors(usersData.filter(u => u.role?.trim() === 'instructor'));
      setStudents(usersData.filter(u => u.role?.trim() === 'student'));
      
      console.log("Instructors:", usersData.filter(u => u.role?.trim() === 'instructor').length);
      console.log("Students:", usersData.filter(u => u.role?.trim() === 'student').length);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleCreateCourse = async (courseData) => {
    try {
      // Generate a unique course ID
      const course_id = `COURSE_${Date.now()}`;
      
      await api.createCourse({
        course_id,
        title: courseData.title,
        description: courseData.description || '',
        price: courseData.price || 0
      });
      
      alert("Course created successfully!");
      await loadCourses();
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Error creating course: " + error.message);
    }
  };

  const handleUpdateCourse = async (courseId, updates) => {
    try {
      await api.updateCourse(courseId, updates);
      alert("Course updated successfully!");
      await loadCourses();
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Error updating course: " + error.message);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course? This will also delete all sessions.")) return;
    
    try {
      console.log("🗑️ Attempting to delete course with ID:", courseId);
      console.log("🗑️ Course ID type:", typeof courseId);
      await api.deleteCourse(courseId);
      alert("Course deleted successfully!");
      await loadCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      console.error("Course ID that failed:", courseId);
      alert("Error: " + error.message);
    }
  };

  const handleAddInstructorByEmail = async (email, name) => {
    try {
      // Check if user already exists
      const existingUser = allUsers.find(u => u.email === email);
      
      if (existingUser) {
        // Update existing user to instructor
        const userRef = doc(db, "users", existingUser.uid);
        await updateDoc(userRef, {
          role: "instructor",
        });
        alert(`${email} promoted to Instructor!`);
      } else {
        // Create new instructor user (they'll sign up later)
        const newInstructorRef = doc(collection(db, "users"));
        await setDoc(newInstructorRef, {
          email: email,
          name: name || email.split('@')[0],
          role: "instructor",
          blocked: false,
          createdAt: serverTimestamp(),
          pendingSignup: true, // Flag to indicate they haven't signed up yet
        });
        alert(`Instructor ${email} added! They can now sign up.`);
      }
      
      await loadUsers();
    } catch (error) {
      console.error("Error adding instructor:", error);
      alert("Error adding instructor: " + error.message);
    }
  };

  const handlePromoteToInstructor = async (userId) => {
    if (!window.confirm("Promote this user to Instructor?")) return;

    try {
      await api.updateUser(userId, { role: "instructor" });
      alert("User promoted to Instructor");
      await loadUsers();
    } catch (error) {
      console.error("Error promoting user:", error);
      alert(error.message);
    }
  };

  const handleToggleBlockUser = async (userId, isBlocked) => {
    const action = isBlocked ? "Unblock" : "Block";
    if (!window.confirm(`${action} this user?`)) return;

    try {
      await api.updateUser(userId, { blocked: !isBlocked });
      alert(`User ${action}ed successfully`);
      await loadUsers();
    } catch (error) {
      console.error("Error blocking user:", error);
      alert(error.message);
    }
  };

  const handleRemoveInstructor = async (userId, instructorName) => {
    if (!window.confirm(`Remove ${instructorName} as instructor? This will unassign them from all courses and delete their account.`)) return;

    try {
      // Unassign instructor from all their courses
      const instructorCourses = courses.filter(c => c.instructorId === userId);
      
      for (const course of instructorCourses) {
        const courseRef = doc(db, "courses", course.id);
        await updateDoc(courseRef, {
          instructorId: '',
          instructorName: '',
          instructorEmail: '',
        });
      }

      // Delete the instructor user document
      await deleteDoc(doc(db, "users", userId));
      
      alert(`Instructor removed successfully. ${instructorCourses.length} course(s) unassigned.`);
      await loadCourses();
      await loadUsers();
    } catch (error) {
      console.error("Error removing instructor:", error);
      alert("Error removing instructor: " + error.message);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      setCurrentPage('home');
    }
  };

  // ADD INSTRUCTOR MODAL
  const AddInstructorModal = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      await handleAddInstructorByEmail(email, name);
      onClose();
    };

    return (
      <div style={styles.modal} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
          <h2 style={styles.modalTitle}>Add Instructor by Email</h2>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address *</label>
              <input
                type="email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="instructor@example.com"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Name (Optional)</label>
              <input
                type="text"
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Instructor Name"
              />
            </div>

            <p style={styles.helpText}>
              💡 If this email is already registered as a student, they will be promoted to instructor. 
              Otherwise, a new instructor account will be created.
            </p>

            <div style={styles.formActions}>
              <button type="button" style={styles.cancelButton} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                Add Instructor
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // SESSION MANAGER COMPONENT
const SessionManager = ({ course, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [editingSession, setEditingSession] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const sessionsData = await api.getSessions(course.course_id || course.id);
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (sessionData) => {
    try {
      await api.createSession({
        ...sessionData,
        session_id: `SESSION_${course.course_id}_${Date.now()}`,
        course_id: course.course_id || course.id,
        course_name: course.title,
        enrolled: 0,
        created_by: currentUser.uid,
      });
      alert("Session created successfully!");
      await loadSessions();
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Error: " + error.message);
    }
  };

  const handleUpdateSession = async (sessionId, updates) => {
    try {
      await api.updateSession(sessionId, updates);
      alert("Session updated successfully!");
      await loadSessions();
    } catch (error) {
      console.error("Error updating session:", error);
      alert("Error: " + error.message);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Delete this session? This cannot be undone.")) return;
    
    try {
      await api.deleteSession(sessionId);
      alert("Session deleted!");
      await loadSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Error: " + error.message);
    }
  };




  // SESSION FORM
  const SessionForm = ({ session, onClose }) => {
    const [formData, setFormData] = useState(session || {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      venue: '',
      price: '',
      capacity: 30,
      topics: '',
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      const sessionData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        capacity: parseInt(formData.capacity) || 30,
        topics: formData.topics.split(',').map(t => t.trim()).filter(t => t),
      };

      if (session) {
        await handleUpdateSession(session.id, sessionData);
      } else {
        await handleCreateSession(sessionData);
      }
      onClose();
    };

    return (
      <div style={styles.modal} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
          <h2 style={styles.modalTitle}>
            {session ? 'Edit Session' : 'Create New Session'}
          </h2>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Session Title *</label>
              <input
                style={styles.input}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Consolidation & Deferred Tax"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                style={styles.textarea}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What will be covered in this session?"
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date *</label>
                <input
                  type="date"
                  style={styles.input}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Time *</label>
                <input
                  style={styles.input}
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="e.g., 15:00 - 17:00"
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Location Type *</label>
              <select
                style={styles.select}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              >
                <option value="">Select location type</option>
                <option value="online">Online</option>
                <option value="in-person">In-Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Venue Details *</label>
              <input
                style={styles.input}
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g., Zoom Link, Room 301, or TBC"
                required
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Price (R) *</label>
                <input
                  type="number"
                  style={styles.input}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="350"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Capacity *</label>
                <input
                  type="number"
                  style={styles.input}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="30"
                  min="1"
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Instructor Payout % *</label>
              <input
                type="number"
                style={styles.input}
                value={formData.instructor_payout_percentage || 70}
                onChange={(e) => setFormData({ ...formData, instructor_payout_percentage: e.target.value })}
                placeholder="70"
                min="0"
                max="100"
                step="1"
                required
              />
              <small style={{color: '#666', fontSize: '12px'}}>
                How much % of the session price goes to the instructor (Platform/Admin gets the rest)
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Topics Covered (comma-separated)</label>
              <textarea
                style={styles.textarea}
                value={formData.topics}
                onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                placeholder="Topic 1, Topic 2, Topic 3"
              />
            </div>

            <div style={styles.formActions}>
              <button type="button" style={styles.cancelButton} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                {session ? 'Update' : 'Create'} Session
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={{...styles.modalContent, maxWidth: '900px'}} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
        <h2 style={styles.modalTitle}>
          {course.image} {course.title} - Sessions
        </h2>
        
        <div style={styles.sessionHeader}>
          <p style={{margin: 0, color: '#666'}}>
            Manage sessions/events for this course
          </p>
          <button
            style={styles.createButton}
            onClick={() => setEditingSession({})}
          >
            + Create Session
          </button>
        </div>

        {loading ? (
          <p>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No sessions created yet for this course.</p>
            <button
              style={styles.createButton}
              onClick={() => setEditingSession({})}
            >
              Create First Session
            </button>
          </div>
        ) : (
          <div style={styles.sessionsList}>
            {sessions.map(session => (
              <div key={session.id} style={styles.sessionItem}>
                <div style={styles.sessionMain}>
                  <h3 style={styles.sessionTitle}>{session.title}</h3>
                  <p style={styles.sessionDesc}>{session.description}</p>
                  
                  <div style={styles.sessionMeta}>
                    <div style={styles.metaItem}>
                      <strong>📅 Date:</strong> {session.date}
                    </div>
                    <div style={styles.metaItem}>
                      <strong>⏰ Time:</strong> {session.time}
                    </div>
                    <div style={styles.metaItem}>
                      <strong>📍 Location:</strong> {session.location} - {session.venue}
                    </div>
                    <div style={styles.metaItem}>
                      <strong>💰 Price:</strong> R{session.price}
                    </div>
                    <div style={styles.metaItem}>
                      <strong>👥 Capacity:</strong> {session.enrolled || 0} / {session.capacity}
                    </div>
                  </div>

                  {session.topics && session.topics.length > 0 && (
                    <div style={styles.topicsSection}>
                      <strong>Topics:</strong>
                      <div style={styles.topicsList}>
                        {session.topics.map((topic, idx) => (
                          <span key={idx} style={styles.topicTag}>{topic}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.sessionActions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => setEditingSession(session)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingSession && (
          <SessionForm
            session={editingSession.id ? editingSession : null}
            onClose={() => setEditingSession(null)}
          />
        )}
      </div>
    </div>
  );
};



  // COURSE EDITOR COMPONENT
  const CourseEditor = ({ course, onClose }) => {
    const [formData, setFormData] = useState(course || {
      title: '',
      description: '',
      image: '📚',
      instructorId: '',
      instructorName: '',
      instructorEmail: '',
      visibility: 'public',
      price: 0,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (isSubmitting) {
        console.log('⏳ Already submitting, ignoring duplicate request');
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        if (course) {
          // Use course_id if available, otherwise use id
          const courseId = course.course_id || course.id;
          console.log('✏️ Updating course with ID:', courseId);
          await handleUpdateCourse(courseId, formData);
        } else {
          await handleCreateCourse(formData);
        }
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div style={styles.modal} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
          <h2 style={styles.modalTitle}>
            {course ? 'Edit Course' : 'Create New Course'}
          </h2>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Course Title *</label>
              <input
                style={styles.input}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description *</label>
              <textarea
                style={styles.textarea}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Emoji Icon</label>
              <input
                style={styles.input}
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="📚"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Assign Instructor</label>
              <select
                style={styles.select}
                value={formData.instructorId}
                onChange={(e) => {
                  const instructor = instructors.find(i => i.uid === e.target.value);
                  setFormData({
                    ...formData,
                    instructorId: e.target.value,
                    instructorName: instructor?.name || '',
                    instructorEmail: instructor?.email || '',
                  });
                }}
              >
                <option value="">-- Select Instructor --</option>
                {instructors.map(instructor => (
                  <option key={instructor.uid} value={instructor.uid}>
                    {instructor.name} ({instructor.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Visibility</label>
              <select
                style={styles.select}
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Course Price (R) *</label>
              <input
                type="number"
                style={styles.input}
                value={formData.price || 0}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
              <small style={{color: '#666', fontSize: '12px'}}>
                This is the base price for the entire course. Individual sessions can override this price.
              </small>
            </div>

            <div style={styles.formActions}>
              <button type="button" style={styles.cancelButton} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                {course ? 'Update' : 'Create'} Course
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Portal</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {currentUser?.role === 'admin' && (
            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                marginRight: "10px",
              }}
              onClick={() => setCurrentPage('finance-portal')}
            >
              💰 Finance
            </button>
          )}
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
        <p><strong>Welcome, Admin</strong></p>
        <p>Email: {currentUser?.email}</p>
      </div>

      {/* TABS */}
      <div style={styles.tabs}>
        <button
          style={activeTab === 'courses' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('courses')}
        >
          Courses ({courses.length})
        </button>
        <button
          style={activeTab === 'instructors' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('instructors')}
        >
          Instructors ({instructors.length})
        </button>
        <button
          style={activeTab === 'students' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('students')}
        >
          Students ({students.length})
        </button>
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        {activeTab === 'courses' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2>Manage Courses</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={styles.createButton}
                  onClick={async () => {
                    try {
                      const sessionsSnapshot = await getDocs(collection(db, "sessions"));
                      console.log(`Found ${sessionsSnapshot.size} sessions in the database:`);
                      sessionsSnapshot.forEach((doc) => {
                        console.log(`${doc.id} =>`, doc.data());
                      });
                      if (sessionsSnapshot.empty) {
                        alert("No sessions found in the database.");
                      } else {
                        alert(`Found ${sessionsSnapshot.size} sessions. Check the console for details.`);
                      }
                    } catch (error) {
                      console.error("Error checking sessions:", error);
                      alert("Error checking sessions: " + error.message);
                    }
                  }}
                >
                  🔍 Check Sessions in DB
                </button>
                <button
                  style={styles.createButton}
                  onClick={() => setEditingCourse({})}
                >
                  + Create Course
                </button>
              </div>
            </div>

            {loading ? (
              <p>Loading courses...</p>
            ) : courses.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No courses created yet.</p>
                <button
                  style={styles.createButton}
                  onClick={() => setEditingCourse({})}
                >
                  Create Your First Course
                </button>
              </div>
            ) : (
              <div style={styles.coursesList}>
                {courses.map(course => (
                  <div key={course.id} style={styles.courseItem}>
                    <div style={styles.courseMain}>
                      <span style={styles.courseIcon}>{course.image}</span>
                      <div style={styles.courseDetails}>
                        <h3 style={styles.courseTitle}>{course.title}</h3>
                        <p style={styles.courseDesc}>{course.description}</p>
                        <div style={styles.courseMeta}>
                          <span>
                            👨‍🏫 {course.instructorName || 'No instructor assigned'}
                          </span>
                          {course.instructorEmail && (
                            <span style={styles.email}>({course.instructorEmail})</span>
                          )}
                          <span style={styles.enrollmentCount}>
                            👥 {course.enrollmentCount || 0} enrolled
                          </span>
                        </div>
                        <span style={styles.visibilityBadge}>
                          {course.visibility === 'public' ? '🌍 Public' : '🔒 Private'}
                        </span>
                      </div>
                    </div>
                    <div style={styles.courseActions}>

                      <button
                        style={styles.createButton}
                        onClick={() => setManagingSessions(course)}
                      >
                        📅 Sessions
                      </button>
                      <button
                        style={styles.editBtn}
                        onClick={() => setEditingCourse(course)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDeleteCourse(course.course_id || course.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'instructors' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2>Instructors</h2>
              <button
                style={styles.createButton}
                onClick={() => setAddingInstructor(true)}
              >
                + Add Instructor by Email
              </button>
            </div>

            {instructors.length === 0 ? (
              <p>No instructors yet. Add one by email or promote a student.</p>
            ) : (
              <div style={styles.usersList}>
                {instructors.map(instructor => (
                  <div key={instructor.uid} style={styles.userItem}>
                    <div>
                      <strong>{instructor.name}</strong>
                      <p style={styles.userEmail}>{instructor.email}</p>
                      <span style={styles.userRole}>Instructor</span>
                      {instructor.pendingSignup && (
                        <span style={styles.pendingBadge}>⏳ Pending Signup</span>
                      )}
                      {instructor.blocked && (
                        <span style={styles.blockedBadge}>🚫 Blocked</span>
                      )}
                    </div>
                    <div style={styles.instructorInfo}>
                      <p style={styles.coursesAssigned}>
                        Courses Assigned: {courses.filter(c => c.instructorId === instructor.uid).length}
                      </p>
                      <div style={styles.instructorActions}>
                        <button
                          style={instructor.blocked ? styles.unblockBtn : styles.blockBtn}
                          onClick={() => handleToggleBlockUser(instructor.uid, instructor.blocked)}
                        >
                          {instructor.blocked ? '✅ Unblock' : '🚫 Block'}
                        </button>
                        <button
                          style={styles.removeBtn}
                          onClick={() => handleRemoveInstructor(instructor.uid, instructor.name)}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <h2>Students</h2>
            {students.length === 0 ? (
              <p>No students registered yet.</p>
            ) : (
              <div style={styles.usersList}>
                {students.map(student => (
                  <div key={student.uid} style={styles.userItem}>
                    <div>
                      <strong>{student.name}</strong>
                      <p style={styles.userEmail}>{student.email}</p>
                      <span style={styles.userRoleStudent}>Student</span>
                      {student.blocked && (
                        <span style={styles.blockedBadge}>🚫 Blocked</span>
                      )}
                    </div>
                    <div style={styles.userActions}>
                      <button
                        style={styles.promoteBtn}
                        onClick={() => handlePromoteToInstructor(student.uid)}
                      >
                        ⬆️ Promote to Instructor
                      </button>
                      <button
                        style={student.blocked ? styles.unblockBtn : styles.blockBtn}
                        onClick={() => handleToggleBlockUser(student.uid, student.blocked)}
                      >
                        {student.blocked ? '✅ Unblock' : '🚫 Block'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editingCourse && (
        <CourseEditor
          course={editingCourse.id ? editingCourse : null}
          onClose={() => setEditingCourse(null)}
        />
      )}

      {addingInstructor && (
        <AddInstructorModal
          onClose={() => setAddingInstructor(false)}
        />
      )}

      {managingSessions && (
        <SessionManager
          course={managingSessions}
          onClose={() => setManagingSessions(null)}
           />
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
  title: {
    fontSize: "32px",
    color: "#0051a8",
    margin: 0,
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
  changeRoleButton: {
    padding: "10px 20px",
    backgroundColor: "#0051a8",
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
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    borderBottom: "2px solid #e0e0e0",
  },
  tab: {
    backgroundColor: "transparent",
    border: "none",
    padding: "12px 20px",
    fontSize: "16px",
    color: "#666",
    cursor: "pointer",
    borderBottom: "3px solid transparent",
  },
  activeTab: {
    backgroundColor: "transparent",
    border: "none",
    padding: "12px 20px",
    fontSize: "16px",
    color: "#0051a8",
    fontWeight: "bold",
    cursor: "pointer",
    borderBottom: "3px solid #0051a8",
  },
  content: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
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
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#666",
  },
  coursesList: {
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
  courseMain: {
    display: "flex",
    gap: "15px",
    flex: 1,
  },
  courseIcon: {
    fontSize: "40px",
  },
  courseDetails: {
    flex: 1,
  },
  courseTitle: {
    fontSize: "20px",
    color: "#0051a8",
    margin: "0 0 8px 0",
  },
  courseDesc: {
    fontSize: "14px",
    color: "#666",
    margin: "0 0 10px 0",
  },
  courseMeta: {
    fontSize: "14px",
    color: "#333",
    marginBottom: "8px",
  },
  email: {
    fontSize: "12px",
    color: "#999",
    marginLeft: "5px",
  },
  enrollmentCount: {
    fontSize: "14px",
    color: "#0051a8",
    fontWeight: "bold",
    marginLeft: "15px",
  },
  visibilityBadge: {
    display: "inline-block",
    backgroundColor: "#e3f2fd",
    color: "#0051a8",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  courseActions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  editBtn: {
    padding: "8px 15px",
    backgroundColor: "#ffd700",
    color: "#0051a8",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  deleteBtn: {
    padding: "8px 15px",
    backgroundColor: "#ff4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  purchaseButton: {
    padding: "8px 15px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  usersList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "20px",
  },
  userItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
  },
  userEmail: {
    fontSize: "14px",
    color: "#666",
    margin: "5px 0",
  },
  userRole: {
    display: "inline-block",
    backgroundColor: "#ffd700",
    color: "#0051a8",
    padding: "4px 10px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  userRoleStudent: {
    display: "inline-block",
    backgroundColor: "#e3f2fd",
    color: "#0051a8",
    padding: "4px 10px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  coursesAssigned: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "10px",
  },
  userActions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "flex-end",
  },
  promoteBtn: {
    padding: "8px 15px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  blockBtn: {
    padding: "8px 15px",
    backgroundColor: "#ff4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  unblockBtn: {
    padding: "8px 15px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  blockedBadge: {
    display: "inline-block",
    backgroundColor: "#ff4444",
    color: "white",
    padding: "4px 10px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "bold",
    marginLeft: "10px",
  },
  pendingBadge: {
    display: "inline-block",
    backgroundColor: "#ffa500",
    color: "white",
    padding: "4px 10px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "bold",
    marginLeft: "10px",
  },
  instructorInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  instructorActions: {
    display: "flex",
    gap: "10px",
  },
  removeBtn: {
    padding: "8px 15px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  helpText: {
    fontSize: "13px",
    color: "#666",
    backgroundColor: "#f0f8ff",
    padding: "10px",
    borderRadius: "6px",
    margin: "10px 0",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "15px",
    padding: "30px",
    maxWidth: "600px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "15px",
    right: "15px",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666",
  },
  modalTitle: {
    fontSize: "24px",
    color: "#0051a8",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    padding: "10px",
    PMborder: "2px solid #e0e0e0",
    borderRadius: "6px",
    fontSize: "14px",
},
textarea: {
padding: "10px",
border: "2px solid #e0e0e0",
borderRadius: "6px",
fontSize: "14px",
minHeight: "80px",
resize: "vertical",
},
select: {
padding: "10px",
border: "2px solid #e0e0e0",
borderRadius: "6px",
fontSize: "14px",
backgroundColor: "white",
},
formActions: {
display: "flex",
justifyContent: "flex-end",
gap: "10px",
marginTop: "10px",
},
cancelButton: {
padding: "10px 20px",
backgroundColor: "#e0e0e0",
color: "#333",
border: "none",
borderRadius: "6px",
cursor: "pointer",
fontSize: "14px",
fontWeight: "bold",
},
submitButton: {
padding: "10px 25px",
backgroundColor: "#0051a8",
color: "white",
border: "none",
borderRadius: "6px",
cursor: "pointer",
fontSize: "14px",
fontWeight: "bold",
},
};
export default AdminPortal;