import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";

function CourseManagementSystem({ userRole, currentUser, onBack, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [managingSessions, setManagingSessions] = useState(null);

  const loadCourses = async () => {
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

        return courseData;
      }));
      
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleUpdateCourse = async (courseId, updates) => {
    try {
      const courseRef = doc(db, "courses", courseId);
      await updateDoc(courseRef, updates);
      alert("Course updated successfully!");
      await loadCourses();
      setEditingCourse(null);
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Error updating course: " + error.message);
    }
  };

  const handleCreateSession = async (sessionData) => {
    try {
      await addDoc(collection(db, "sessions"), {
        ...sessionData,
        courseId: managingSessions.id,
        courseName: managingSessions.title,
        enrolled: 0,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
      });
      alert("Session created successfully!");
      await loadCourses();
      setManagingSessions(null);
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Error: " + error.message);
    }
  };

  const handleUpdateSession = async (sessionId, updates) => {
    try {
      const sessionRef = doc(db, "sessions", sessionId);
      await updateDoc(sessionRef, updates);
      alert("Session updated successfully!");
      await loadCourses();
    } catch (error) {
      console.error("Error updating session:", error);
      alert("Error: " + error.message);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Delete this session? This cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "sessions", sessionId));
      alert("Session deleted!");
      await loadCourses();
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>← Back</button>
        <h1>Course Management</h1>
        <button style={styles.logoutButton} onClick={onLogout}>Logout</button>
      </div>

      <div style={styles.content}>
        {editingCourse ? (
          <CourseForm
            course={editingCourse}
            onSave={handleUpdateCourse}
            onCancel={() => setEditingCourse(null)}
          />
        ) : managingSessions ? (
          <SessionManager
            course={managingSessions}
            onCreateSession={handleCreateSession}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
            onBack={() => setManagingSessions(null)}
            currentUser={currentUser}
          />
        ) : (
          <div>
            <div style={styles.sectionHeader}>
              <h2>My Allocated Courses</h2>
            </div>

            {loading ? (
              <p>Loading courses...</p>
            ) : courses.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No courses have been allocated to you yet.</p>
                <p>Please contact an administrator to get courses assigned.</p>
              </div>
            ) : (
              <div style={styles.coursesList}>
                {courses.map(course => (
                  <div key={course.id} style={styles.courseItem}>
                    <div style={styles.courseMain}>
                      <span style={styles.courseIcon}>{course.image || '📚'}</span>
                      <div style={styles.courseDetails}>
                        <h3 style={styles.courseTitle}>{course.title}</h3>
                        <p style={styles.courseDesc}>{course.description}</p>
                        <div style={styles.courseMeta}>
                          <span>{course.sessions?.length || 0} sessions</span>
                          <span style={styles.visibilityBadge}>
                            {course.visibility === 'public' ? '🌍 Public' : '🔒 Private'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={styles.courseActions}>
                      <button
                        style={styles.sessionButton}
                        onClick={() => setManagingSessions(course)}
                      >
                        📅 Sessions ({course.sessions?.length || 0})
                      </button>
                      <button
                        style={styles.editBtn}
                        onClick={() => setEditingCourse(course)}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseForm({ course, onSave, onCancel }) {
  const [formData, setFormData] = useState(course.id ? course : {
    title: '',
    description: '',
    image: '📚',
    visibility: 'private',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(course.id || null, formData);
  };

  return (
    <div style={styles.formContainer}>
      <h2>{course.id ? 'Edit Course' : 'Create Course'}</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label>Title:</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Description:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            style={styles.textarea}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Icon:</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({...formData, image: e.target.value})}
            placeholder="📚"
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Course Notes (for students):</label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Add notes, instructions, or additional information for students..."
            style={styles.textarea}
            rows={6}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Visibility:</label>
          <select
            value={formData.visibility}
            onChange={(e) => setFormData({...formData, visibility: e.target.value})}
            style={styles.select}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>
        <div style={styles.formActions}>
          <button type="button" onClick={onCancel} style={styles.cancelButton}>Cancel</button>
          <button type="submit" style={styles.submitButton}>
            {course.id ? 'Update' : 'Create'} Course
          </button>
        </div>
      </form>
    </div>
  );
}

function SessionManager({ course, onCreateSession, onUpdateSession, onDeleteSession, onBack, currentUser }) {
  const [editingSession, setEditingSession] = useState(null);
  const [managingMaterials, setManagingMaterials] = useState(null);
  const [activeTab, setActiveTab] = useState('sessions');
  const [courseSections, setCourseSections] = useState([]);
  const [editingSection, setEditingSection] = useState(null);

  // Load course sections
  useEffect(() => {
    loadCourseSections();
  }, [course.id]);

  const loadCourseSections = async () => {
    try {
      const sectionsQuery = query(collection(db, "course_sections"), where("courseId", "==", course.id));
      const sectionsSnapshot = await getDocs(sectionsQuery);
      const sections = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by order
      sections.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCourseSections(sections);
    } catch (error) {
      console.error("Error loading course sections:", error);
    }
  };

  const handleCreateSection = async (sectionData) => {
    try {
      await addDoc(collection(db, "course_sections"), {
        ...sectionData,
        courseId: course.id,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
      });
      alert("Section created successfully!");
      await loadCourseSections();
      setEditingSection(null);
    } catch (error) {
      console.error("Error creating section:", error);
      alert("Error creating section: " + error.message);
    }
  };

  const handleUpdateSection = async (sectionId, updates) => {
    try {
      const sectionRef = doc(db, "course_sections", sectionId);
      await updateDoc(sectionRef, updates);
      alert("Section updated successfully!");
      await loadCourseSections();
      setEditingSection(null);
    } catch (error) {
      console.error("Error updating section:", error);
      alert("Error updating section: " + error.message);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm("Delete this section? This cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "course_sections", sectionId));
      alert("Section deleted!");
      await loadCourseSections();
    } catch (error) {
      console.error("Error deleting section:", error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div style={styles.sessionContainer}>
      <div style={styles.sessionHeader}>
        <button style={styles.backButton} onClick={onBack}>← Back to Courses</button>
        <h2>Sessions for {course.title}</h2>
        <button
          style={styles.createButton}
          onClick={() => setEditingSession({})}
        >
          + Add Session
        </button>
      </div>

      <div style={styles.tabContainer}>
        <button
          style={activeTab === 'sessions' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions ({course.sessions?.length || 0})
        </button>
        <button
          style={activeTab === 'sections' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('sections')}
        >
          Course Sections ({courseSections.length})
        </button>
        <button
          style={activeTab === 'materials' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('materials')}
        >
          Materials
        </button>
      </div>

      {activeTab === 'sessions' && (
        <div style={styles.sessionsList}>
          {(course.sessions?.length || 0) === 0 ? (
            <div style={styles.emptyState}>
              <p>No sessions created yet.</p>
            </div>
          ) : (
            course.sessions?.map(session => (
              <div key={session.id} style={styles.sessionItem}>
                <div style={styles.sessionInfo}>
                  <h3>{session.title}</h3>
                  <p>{session.description}</p>
                  <div style={styles.sessionMeta}>
                    <span>📅 {session.date}</span>
                    <span>⏰ {session.time}</span>
                    <span>📍 {session.venue || session.location}</span>
                    <span>💰 {session.price}</span>
                  </div>
                </div>
                <div style={styles.sessionActions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => setEditingSession(session)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    style={styles.materialsBtn}
                    onClick={() => setManagingMaterials(session)}
                  >
                    📚 Materials
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => onDeleteSession(session.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'sections' && (
        <div style={styles.sectionsContainer}>
          <div style={styles.sectionHeader}>
            <h3>Course Sections</h3>
            <button
              style={styles.createButton}
              onClick={() => setEditingSection({})}
            >
              + Add Section
            </button>
          </div>

          {courseSections.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No sections created yet.</p>
              <p>Create sections to organize course content for students.</p>
            </div>
          ) : (
            <div style={styles.sectionsList}>
              {courseSections.map((section, index) => (
                <div key={section.id} style={styles.sectionItem}>
                  <div style={styles.sectionContent}>
                    <div style={styles.sectionOrder}>#{index + 1}</div>
                    <div style={styles.sectionInfo}>
                      <h4>{section.title}</h4>
                      <p>{section.description}</p>
                      <div style={styles.sectionMeta}>
                        <span>📖 {section.content ? 'Has content' : 'No content'}</span>
                        <span>� {section.notes ? 'Has notes' : 'No notes'}</span>
                        <span>🎥 {section.videos ? 'Has videos' : 'No videos'}</span>
                        <span>�🔒 {section.locked ? 'Locked' : 'Unlocked'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={styles.sectionActions}>
                    <button
                      style={styles.editBtn}
                      onClick={() => setEditingSection(section)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteSection(section.id)}
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

      {activeTab === 'materials' && (
        <MaterialsManager course={course} sessions={course.sessions || []} currentUser={currentUser} />
      )}

      {editingSession !== null && (
        <SessionForm
          session={editingSession}
          onSave={editingSession.id ? (id, data) => onUpdateSession(id, data) : onCreateSession}
          onCancel={() => setEditingSession(null)}
        />
      )}

      {editingSection !== null && (
        <SectionForm
          section={editingSection}
          onSave={editingSection.id ? (id, data) => handleUpdateSection(id, data) : handleCreateSection}
          onCancel={() => setEditingSection(null)}
        />
      )}

      {managingMaterials && (
        <MaterialsModal
          session={managingMaterials}
          onClose={() => setManagingMaterials(null)}
        />
      )}
    </div>
  );
}

function SessionForm({ session, onSave, onCancel }) {
  const [formData, setFormData] = useState(session.id ? session : {
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

  const handleSubmit = (e) => {
    e.preventDefault();

    const sessionData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      capacity: parseInt(formData.capacity) || 30,
      topics: formData.topics.split(',').map(t => t.trim()).filter(t => t),
    };

    onSave(session.id || null, sessionData);
    onCancel();
  };

  return (
    <div style={styles.formContainer}>
      <h2>{session.id ? 'Edit Session' : 'Create Session'}</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label>Title:</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Description:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            style={styles.textarea}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Date:</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Time:</label>
          <input
            type="text"
            value={formData.time}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
            placeholder="15:00 - 17:00"
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Venue/Location:</label>
          <input
            type="text"
            value={formData.venue || formData.location}
            onChange={(e) => setFormData({...formData, venue: e.target.value, location: e.target.value})}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Price:</label>
          <input
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            placeholder="R350"
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Capacity:</label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Topics (comma-separated):</label>
          <input
            type="text"
            value={formData.topics}
            onChange={(e) => setFormData({...formData, topics: e.target.value})}
            placeholder="Topic 1, Topic 2, Topic 3"
            style={styles.input}
          />
        </div>
        <div style={styles.formActions}>
          <button type="button" onClick={onCancel} style={styles.cancelButton}>Cancel</button>
          <button type="submit" style={styles.submitButton}>
            {session.id ? 'Update' : 'Create'} Session
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionForm({ section, onSave, onCancel }) {
  const [formData, setFormData] = useState(section.id ? section : {
    title: '',
    description: '',
    content: '',
    notes: '',
    videos: '',
    locked: false,
    order: 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const sectionData = {
      ...formData,
      order: parseInt(formData.order) || 0,
    };

    onSave(section.id || null, sectionData);
  };

  return (
    <div style={styles.formContainer}>
      <h2>{section.id ? 'Edit Section' : 'Create Section'}</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label>Title:</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Description:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Brief description of this section..."
            style={styles.textarea}
            rows={3}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Content:</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            placeholder="Detailed content for this section..."
            style={styles.textarea}
            rows={8}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Notes:</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Additional notes or instructions for this section..."
            style={styles.textarea}
            rows={6}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Video URLs:</label>
          <textarea
            value={formData.videos}
            onChange={(e) => setFormData({...formData, videos: e.target.value})}
            placeholder="Enter video URLs (one per line)..."
            style={styles.textarea}
            rows={4}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Order:</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({...formData, order: e.target.value})}
            placeholder="0"
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              checked={formData.locked}
              onChange={(e) => setFormData({...formData, locked: e.target.checked})}
            />
            Lock this section (students can only view, not edit)
          </label>
        </div>
        <div style={styles.formActions}>
          <button type="button" onClick={onCancel} style={styles.cancelButton}>Cancel</button>
          <button type="submit" style={styles.submitButton}>
            {section.id ? 'Update' : 'Create'} Section
          </button>
        </div>
      </form>
    </div>
  );
}

function MaterialsManager({ course, sessions, currentUser }) {
  const [selectedSession, setSelectedSession] = useState(null);
  const [notes, setNotes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMaterials = async () => {
    if (!selectedSession) return;
    
    setLoading(true);
    try {
      // Load notes
      const notesQuery = query(collection(db, "notes"), where("sessionId", "==", selectedSession.id));
      const notesSnapshot = await getDocs(notesQuery);
      const notesData = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotes(notesData);

      // Load videos
      const videosQuery = query(collection(db, "videos"), where("sessionId", "==", selectedSession.id));
      const videosSnapshot = await getDocs(videosQuery);
      const videosData = videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVideos(videosData);
    } catch (error) {
      console.error("Error loading materials:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSession) {
      loadMaterials();
    }
  }, [selectedSession]);

  const handleUploadNote = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', selectedSession.id);
      formData.append('title', file.name);

      // For now, just store file info in Firestore
      // In a real app, you'd upload to storage and get URL
      await addDoc(collection(db, "notes"), {
        sessionId: selectedSession.id,
        title: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: serverTimestamp(),
        uploadedBy: currentUser.uid,
      });

      alert("Note uploaded successfully!");
      loadMaterials();
    } catch (error) {
      console.error("Error uploading note:", error);
      alert("Error uploading note: " + error.message);
    }
  };

  const handleUploadVideo = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', selectedSession.id);
      formData.append('title', file.name);

      // For now, just store file info in Firestore
      await addDoc(collection(db, "videos"), {
        sessionId: selectedSession.id,
        title: file.name,
        type: file.type,
        size: file.size,
        duration: 'TBC', // Would need to calculate this
        uploadedAt: serverTimestamp(),
        uploadedBy: currentUser.uid,
      });

      alert("Video uploaded successfully!");
      loadMaterials();
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Error uploading video: " + error.message);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    
    try {
      await deleteDoc(doc(db, "notes", noteId));
      alert("Note deleted!");
      loadMaterials();
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Error: " + error.message);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Delete this video?")) return;
    
    try {
      await deleteDoc(doc(db, "videos", videoId));
      alert("Video deleted!");
      loadMaterials();
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div style={styles.materialsContainer}>
      <div style={styles.materialsHeader}>
        <h3>Manage Materials for {course.title}</h3>
        <select
          style={styles.select}
          value={selectedSession?.id || ''}
          onChange={(e) => {
            const session = sessions.find(s => s.id === e.target.value);
            setSelectedSession(session);
          }}
        >
          <option value="">Select a session</option>
          {sessions.map(session => (
            <option key={session.id} value={session.id}>
              {session.title}
            </option>
          ))}
        </select>
      </div>

      {selectedSession && (
        <div style={styles.sessionMaterials}>
          <div style={styles.materialsSection}>
            <div style={styles.sectionHeader}>
              <h4>📄 Notes ({notes.length})</h4>
              <label style={styles.uploadButton}>
                + Upload Note
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleUploadNote(file);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            {loading ? (
              <p>Loading...</p>
            ) : notes.length === 0 ? (
              <p style={styles.emptyState}>No notes uploaded yet</p>
            ) : (
              <div style={styles.materialsList}>
                {notes.map(note => (
                  <div key={note.id} style={styles.materialItem}>
                    <div style={styles.materialInfo}>
                      <span style={styles.materialIcon}>📄</span>
                      <div>
                        <strong>{note.title}</strong>
                        <p style={styles.materialMeta}>
                          {note.type} • {(note.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.materialsSection}>
            <div style={styles.sectionHeader}>
              <h4>🎥 Videos ({videos.length})</h4>
              <label style={styles.uploadButton}>
                + Upload Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleUploadVideo(file);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            {loading ? (
              <p>Loading...</p>
            ) : videos.length === 0 ? (
              <p style={styles.emptyState}>No videos uploaded yet</p>
            ) : (
              <div style={styles.materialsList}>
                {videos.map(video => (
                  <div key={video.id} style={styles.materialItem}>
                    <div style={styles.materialInfo}>
                      <span style={styles.materialIcon}>🎥</span>
                      <div>
                        <strong>{video.title}</strong>
                        <p style={styles.materialMeta}>
                          {video.type} • {(video.size / (1024 * 1024)).toFixed(1)} MB • {video.duration}
                        </p>
                      </div>
                    </div>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteVideo(video.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialsModal({ session, onClose }) {
  const [notes, setNotes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      // Load notes
      const notesQuery = query(collection(db, "notes"), where("sessionId", "==", session.id));
      const notesSnapshot = await getDocs(notesQuery);
      setNotes(notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load videos
      const videosQuery = query(collection(db, "videos"), where("sessionId", "==", session.id));
      const videosSnapshot = await getDocs(videosQuery);
      setVideos(videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error loading materials:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={{...styles.modalContent, maxWidth: '800px'}} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
        <h2 style={styles.modalTitle}>Materials for {session.title}</h2>
        
        {loading ? (
          <p>Loading materials...</p>
        ) : (
          <div style={styles.modalMaterials}>
            <div style={styles.materialsSection}>
              <h3>📄 Notes ({notes.length})</h3>
              {notes.length === 0 ? (
                <p style={styles.emptyState}>No notes available</p>
              ) : (
                <div style={styles.materialsList}>
                  {notes.map(note => (
                    <div key={note.id} style={styles.materialItem}>
                      <span style={styles.materialIcon}>📄</span>
                      <div style={styles.materialInfo}>
                        <strong>{note.title}</strong>
                        <p>{note.type} • {(note.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.materialsSection}>
              <h3>🎥 Videos ({videos.length})</h3>
              {videos.length === 0 ? (
                <p style={styles.emptyState}>No videos available</p>
              ) : (
                <div style={styles.materialsList}>
                  {videos.map(video => (
                    <div key={video.id} style={styles.materialItem}>
                      <span style={styles.materialIcon}>🎥</span>
                      <div style={styles.materialInfo}>
                        <strong>{video.title}</strong>
                        <p>{video.type} • {(video.size / (1024 * 1024)).toFixed(1)} MB • {video.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: '10px 15px',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  logoutButton: {
    padding: '10px 15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  content: {
    padding: '20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#0051a8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  coursesList: {
    display: 'grid',
    gap: '15px',
  },
  courseItem: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  courseMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  courseIcon: {
    fontSize: '2rem',
  },
  courseDetails: {
    flex: 1,
  },
  courseTitle: {
    margin: '0 0 5px 0',
    fontSize: '1.2rem',
  },
  courseDesc: {
    margin: '0 0 10px 0',
    color: '#666',
  },
  courseMeta: {
    display: 'flex',
    gap: '15px',
    fontSize: '0.9rem',
    color: '#666',
  },
  visibilityBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    backgroundColor: '#e0e0e0',
  },
  courseActions: {
    display: 'flex',
    gap: '10px',
  },
  sessionButton: {
    padding: '8px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  editBtn: {
    padding: '8px 12px',
    backgroundColor: '#ffc107',
    color: 'black',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '8px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    minHeight: '80px',
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '10px 25px',
    backgroundColor: '#0051a8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  sessionContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sessionHeader: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
  },
  sessionsList: {
    padding: '20px',
  },
  sessionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    border: '1px solid #eee',
    borderRadius: '6px',
    marginBottom: '10px',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionMeta: {
    display: 'flex',
    gap: '15px',
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '5px',
  },
  sessionActions: {
    display: 'flex',
    gap: '10px',
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid #eee',
    marginBottom: '20px',
  },
  tab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  tabActive: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid #0051a8',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#0051a8',
    fontWeight: 'bold',
  },
  materialsBtn: {
    padding: '8px 12px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  materialsContainer: {
    padding: '20px',
  },
  materialsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sessionMaterials: {
    display: 'grid',
    gap: '30px',
  },
  materialsSection: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
  },
  uploadButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  materialsList: {
    display: 'grid',
    gap: '10px',
    marginTop: '15px',
  },
  materialItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  materialInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  materialIcon: {
    fontSize: '1.5rem',
  },
  materialMeta: {
    margin: '2px 0 0 0',
    fontSize: '0.8rem',
    color: '#666',
  },
  modalMaterials: {
    display: 'grid',
    gap: '20px',
  },
};

export default CourseManagementSystem;