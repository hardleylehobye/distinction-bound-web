import React, { useState, useEffect } from "react";
import { signInWithGoogle } from "../authService";
import { db } from "../firebase";
import api from "../services/api";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { generatePDFBase64, downloadTicketPDF } from "../ticketDownloadService";
import YocoPaymentModal from "../components/YocoPaymentModal";

function LoginPortal({ currentUser, onLogin, onLogout, setCurrentPage }) {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('my-courses');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseSessions, setCourseSessions] = useState([]);
  const [courseNotes, setCourseNotes] = useState('');
  const [purchasedTickets, setPurchasedTickets] = useState([]);
  const [selectedSessionForPayment, setSelectedSessionForPayment] = useState(null);
  const [showYocoPaymentModal, setShowYocoPaymentModal] = useState(false);

  // Load real data from Firestore
  useEffect(() => {
    if (currentUser) {
      loadAvailableCourses();
      loadEnrolledCourses();
      loadPurchasedTickets();
    }
  }, [currentUser]);

  const loadPurchasedTickets = async () => {
    try {
      if (!currentUser || !currentUser.uid) {
        return;
      }

      console.log("📡 Loading purchased tickets from API...");
      const tickets = await api.getUserTickets(currentUser.uid);
      console.log("✅ Loaded", tickets.length, "tickets");
      setPurchasedTickets(tickets);
    } catch (error) {
      console.error("Error loading purchased tickets:", error);
      setPurchasedTickets([]);
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      if (!currentUser || !currentUser.uid) {
        return;
      }

      console.log("📡 Loading enrolled courses from API...");
      // Load enrollments for current user from API
      const enrollments = await api.getUserEnrollments(currentUser.uid);

      // Load all courses to get full details
      const allCourses = await api.getCourses();
      
      // Map enrollments with full course details
      const enrolledCoursesData = await Promise.all(enrollments.map(async (enrollment) => {
        // Find the full course data
        const course = allCourses.find(c => c.course_id === enrollment.course_id);
        
        // Load sessions for this course
        const sessions = enrollment.course_id ? await api.getSessions(enrollment.course_id) : [];
        
        return {
          id: enrollment.enrollment_id || enrollment.id,
          courseId: enrollment.course_id,
          course_id: enrollment.course_id,
          sessionId: enrollment.session_id,
          enrollmentId: enrollment.enrollment_id,
          title: enrollment.course_title || course?.title || "Enrolled Course",
          courseTitle: enrollment.course_title || course?.title || "Enrolled Course",
          description: course?.description || "",
          instructor: course?.instructorName || "Unknown Instructor",
          sessionTitle: enrollment.session_title || "Session",
          date: enrollment.date,
          venue: enrollment.venue,
          ticketNumber: enrollment.ticketNumber,
          enrollmentDate: enrollment.enrolled_at,
          status: enrollment.status || 'active',
          price: course?.price || 0,
          sessions: sessions
        };
      }));

      setEnrolledCourses(enrolledCoursesData);
      console.log("✅ Loaded", enrolledCoursesData.length, "enrolled courses with sessions");
    } catch (error) {
      console.error("Error loading enrolled courses:", error);
      setEnrolledCourses([]);
    }
  };

  const loadAvailableCourses = async () => {
    try {
      console.log("📡 Loading available courses from API...");
      
      // Load all courses from API
      const allCourses = await api.getCourses();
      
      // Filter for public courses only
      const publicCourses = allCourses.filter(course => course.visibility === 'public');

      // Load all users once to get instructor names
      const allUsers = await api.getUsers();
      
      const coursesData = await Promise.all(
        publicCourses.map(async (course) => {
          // Load sessions for this course
          const sessions = await api.getSessions(course.id);
          
          // Find instructor by ID
          let instructorName = course.instructorName || "No Instructor Assigned";
          if (course.instructorId) {
            const instructor = allUsers.find(u => u.uid === course.instructorId);
            if (instructor) {
              instructorName = instructor.name || instructor.displayName || instructor.email;
            }
          }
          
          return {
            ...course,
            instructor: instructorName,
            sessionCount: sessions.length,
            enrollmentCount: course.enrolled || 0,
            capacity: course.capacity || 30,
            sessions: sessions
          };
        })
      );

      console.log("✅ Loaded", coursesData.length, "available courses");
      setAvailableCourses(coursesData);
    } catch (error) {
      console.error("Error loading available courses:", error);
    }
  };

  const handleEnrollCourse = async (course) => {
    try {
      console.log("📝 Starting enrollment for course:", course.title);

      if (!currentUser || !currentUser.uid) {
        alert("You must be logged in to enroll in courses.");
        return;
      }

      // Check if user is already enrolled
      const isAlreadyEnrolled = enrolledCourses.some(
        ec => ec.courseId === course.id || ec.course_id === course.id
      );
      if (isAlreadyEnrolled) {
        alert("You are already enrolled in this course.");
        setActiveTab('my-courses');
        return;
      }

      // For now, courses don't have sessions, so we'll create a placeholder
      // In the future, you should prompt user to select a session
      const enrollmentData = {
        uid: currentUser.uid,
        session_id: `SESSION_${course.id}_${Date.now()}`,
        enrollment_id: `ENR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        course_id: course.course_id || course.id,
      };

      console.log("📡 Saving enrollment via API...", enrollmentData);

      // Save to backend API
      await api.createEnrollment(enrollmentData);
      console.log("✅ Enrollment saved successfully!");

      // Reload enrolled courses
      await loadEnrolledCourses();
      
      // Reload available courses to update counts
      await loadAvailableCourses();

      // Switch to my-courses tab
      setActiveTab('my-courses');

      alert(`Successfully enrolled in ${course.title}!`);
    } catch (error) {
      console.error("❌ Error in enrollment process:", error);
      alert(`Failed to enroll in course: ${error.message}`);
    }
  };

  const handleViewCourse = async (course) => {
    setSelectedCourse(course);

    try {
      // Use sessions already loaded with the course, or fetch them
      const sessions = course.sessions || await api.getSessions(course.courseId || course.course_id);
      setCourseSessions(sessions);

      // Load instructor notes from course document
      setCourseNotes(course.notes || 'No notes available for this course.');

      setActiveTab('course-detail');
    } catch (error) {
      console.error("Error loading course details:", error);
      alert("Failed to load course details.");
    }
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setCourseSessions([]);
    setCourseNotes('');
    setActiveTab('my-courses');
  };

  const handlePurchaseTicket = async (session) => {
    // Redirect to Yoco payment
    handleYocoPayment(session);
  };


  const handleYocoPayment = (session) => {
    if (!session) return;
    setSelectedSessionForPayment(session);
    setShowYocoPaymentModal(true);
  };

  const handleYocoPaymentCancel = () => {
    setShowYocoPaymentModal(false);
    setSelectedSessionForPayment(null);
  };

  const handleYocoPaymentSuccess = async (paymentResult) => {
    console.log('✅ Yoco payment successful:', paymentResult);
    
    try {
      // Save ticket to backend
      const ticketData = {
        uid: currentUser.uid,
        session_id: selectedSessionForPayment.session_id || selectedSessionForPayment.id,
        course_id: selectedCourse?.course_id || selectedCourse?.id,
        amount: paymentResult.amount || selectedSessionForPayment.price || selectedCourse?.price || 0,
        payment_method: 'yoco',
        payment_id: paymentResult.id || paymentResult.paymentId || `YOCO-${Date.now()}`,
        ticket_number: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      console.log('💾 Saving ticket:', ticketData);
      await api.createTicket(ticketData);
      console.log('✅ Ticket saved successfully!');
      
      alert(`🎉 Payment successful! Your ticket number is: ${ticketData.ticket_number}`);
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('Payment successful but failed to save ticket. Please contact support.');
    }
    
    setShowYocoPaymentModal(false);
    setSelectedSessionForPayment(null);
    
    // Refresh data to show new purchase
    loadPurchasedTickets();
    loadEnrolledCourses();
  };

  const handleYocoPaymentError = (error) => {
    console.error('Yoco payment error:', error);
    alert(`Payment error: ${error.message}`);
  };

  /* Removed PayFast - using Yoco only
  const processSimplePurchase = async (session, ticketPrice, cardDetails) => {
    try {
      console.log("Processing simple purchase...");
      
      // Generate unique confirmation code
      const confirmationCode = `CONF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create purchase record
      const purchaseData = {
        sessionId: session.id,
        courseId: selectedCourse.id,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.name || currentUser.displayName || "Student",
        sessionTitle: session.title,
        courseTitle: selectedCourse.title,
        sessionDate: session.date,
        sessionTime: session.time,
        location: session.location,
        price: ticketPrice,
        purchaseDate: new Date().toISOString(),
        status: "confirmed",
        ticketNumber: ticketNumber,
        confirmationCode: confirmationCode,
        transferable: true,
        refundPolicy: "Non-refundable - Transferable to another session only",
        paymentId: `CARD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        paymentMethod: 'card',
        paymentStatus: 'completed',
        cardDetails: cardDetails,
        paymentAccount: cardDetails.paymentAccount || 'instructor',
        connectionSecure: cardDetails.connectionSecure || false,
        connectionProtocol: cardDetails.connectionProtocol || 'unknown'
      };

      // Save purchase to Firestore
      await addDoc(collection(db, "purchases"), purchaseData);
      console.log("Purchase saved successfully!");

      // Update session enrolled count
      try {
        const sessionRef = doc(db, "sessions", session.id);
        await updateDoc(sessionRef, {
          enrolled: (session.enrolled || 0) + 1
        });
        console.log("Session enrollment updated!");
      } catch (updateError) {
        console.warn("Session update failed, but purchase succeeded:", updateError);
      }

      // Show success confirmation
      const confirmationMessage = `
🎫 TICKET PURCHASE CONFIRMATION 🎫

Session: ${session.title}
Date: ${session.date} at ${session.time}
Location: ${session.location || 'TBD'}
Price: R${ticketPrice}

Payment ID: ${purchaseData.paymentId}
Card: **** **** **** ${cardDetails.cardNumber}
Account: ${cardDetails.paymentAccount === 'instructor' ? 'Course Instructor (Primary Recipient)' : cardDetails.paymentAccount === 'company' ? 'Distinction Bound Platform (Service Fee)' : 'Account Owner'}
Confirmation Code: ${confirmationCode}
Ticket Number: ${ticketNumber}

🔒 Security Information:
• Connection: ${cardDetails.connectionSecure ? 'Secure (HTTPS)' : 'Not Secure'}
• Protocol: ${cardDetails.connectionProtocol}
• Encryption: 256-bit SSL/TLS
• Compliance: PCI DSS

📋 IMPORTANT INFORMATION:
• This confirmation code will be verified by the instructor
• Present this code when attending the session
• NON-REFUND POLICY: ${purchaseData.refundPolicy}
• TRANSFER OPTION: You can transfer this ticket to another session of the same course
• To transfer: Contact support with your confirmation code

✅ Payment processed successfully!
Your ticket has been purchased and recorded securely.

Thank you for your purchase!
      `;

      alert(confirmationMessage);
      
      // Reload data
      await loadPurchasedTickets();
      
      // Reload sessions
      const sessionsQuery = query(collection(db, "sessions"), where("courseId", "==", selectedCourse.courseId || selectedCourse.id));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const updatedSessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourseSessions(updatedSessions);

    } catch (error) {
      console.error("Error processing purchase:", error);
      alert(`Error completing purchase: ${error.message}`);
    }
  }; */

  const handleTransferTicket = async (ticket) => {
    const confirmationCode = prompt("Please enter your confirmation code to transfer this ticket:");
    
    if (!confirmationCode || confirmationCode !== ticket.confirmationCode) {
      alert("Invalid confirmation code. Transfer cancelled.");
      return;
    }

    // Get original session data
    let originalSession = null;
    try {
      const originalSessionDoc = await getDoc(doc(db, "sessions", ticket.sessionId));
      if (originalSessionDoc.exists()) {
        originalSession = { id: originalSessionDoc.id, ...originalSessionDoc.data() };
      }
    } catch (error) {
      console.error("Error loading original session:", error);
    }

    // Get available sessions for the same course
    const sessionsQuery = query(collection(db, "sessions"), where("courseId", "==", ticket.courseId));
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const availableSessions = sessionsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(session => session.id !== ticket.sessionId && new Date(session.date) > new Date());

    if (availableSessions.length === 0) {
      alert("No other sessions available for transfer.");
      return;
    }

    // Create session selection dialog
    const sessionOptions = availableSessions.map((session, index) => 
      `${index + 1}. ${session.title} - ${session.date} at ${session.time}`
    ).join('\n');

    const selectedOption = prompt(
      `Select a session to transfer your ticket to:\n\n${sessionOptions}\n\nEnter the number of your choice:`
    );

    const selectedIndex = parseInt(selectedOption) - 1;
    
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= availableSessions.length) {
      alert("Invalid selection. Transfer cancelled.");
      return;
    }

    const targetSession = availableSessions[selectedIndex];

    if (!window.confirm(
      `Transfer ticket from "${ticket.sessionTitle}" to "${targetSession.title}"?\n\n` +
      `New Date: ${targetSession.date} at ${targetSession.time}\n\n` +
      `This action cannot be undone.`
    )) {
      return;
    }

    try {
      // Update the ticket with new session
      const ticketRef = doc(db, "purchases", ticket.id);
      await updateDoc(ticketRef, {
        sessionId: targetSession.id,
        sessionTitle: targetSession.title,
        sessionDate: targetSession.date,
        sessionTime: targetSession.time,
        location: targetSession.location,
        transferredAt: new Date().toISOString(),
        originalSessionId: ticket.sessionId,
        transferCount: (ticket.transferCount || 0) + 1
      });

      // Update enrollment counts
      const oldSessionRef = doc(db, "sessions", ticket.sessionId);
      await updateDoc(oldSessionRef, {
        enrolled: Math.max(0, (targetSession.enrolled || 0) - 1)
      });

      const newSessionRef = doc(db, "sessions", targetSession.id);
      await updateDoc(newSessionRef, {
        enrolled: (targetSession.enrolled || 0) + 1
      });

      alert(`Ticket successfully transferred to ${targetSession.title}!\n\nNew Date: ${targetSession.date} at ${targetSession.time}\n\nConfirmation Code: ${ticket.confirmationCode}`);

      // Reload data
      await loadPurchasedTickets();
      await handleViewCourse(selectedCourse);

    } catch (error) {
      console.error("Error transferring ticket:", error);
      alert("Failed to transfer ticket. Please try again.");
    }
  };

  // Login with Google
const handleGoogleLogin = async () => {
  if (isAuthenticating) return; // Prevent multiple clicks

  setIsAuthenticating(true);
  const userData = await signInWithGoogle();
  setIsAuthenticating(false);

  if (userData) {
    if (onLogin) {
      onLogin(userData);
    }

    // The onLogin function will handle redirection based on the new logic in App.js
    // Admin and instructor will go to choose-role, students and new users go directly to student dashboard
  }
};

  // Logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      setCurrentPage("home");
    }
  };

  // Dashboard view
  if (currentUser) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1>Student Dashboard</h1>
          <div style={styles.headerActions}>
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

        <div style={styles.tabs}>
          <button
            style={activeTab === 'available-courses' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('available-courses')}
          >
            Available Courses
          </button>
          <button
            style={activeTab === 'my-courses' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('my-courses')}
          >
            My Courses
          </button>
          <button
            style={activeTab === 'my-tickets' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('my-tickets')}
          >
            My Tickets & Payments
          </button>
          {selectedCourse && (
            <button
              style={activeTab === 'course-detail' ? styles.activeTab : styles.tab}
              onClick={() => setActiveTab('course-detail')}
            >
              {selectedCourse.title}
            </button>
          )}
          <button
            style={activeTab === 'profile' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </div>

        <div style={styles.tabContent}>
          {activeTab === 'available-courses' && (
            <div>
              <h2>Available Courses</h2>
              <p>Browse and enroll in available courses</p>
              <div style={styles.coursesGrid}>
                {availableCourses.map((course) => {
                  const isAlreadyEnrolled = enrolledCourses.some(
                    ec => ec.courseId === course.course_id || 
                          ec.course_id === course.course_id ||
                          ec.courseId === course.id || 
                          ec.course_id === course.id
                  );
                  return (
                    <div key={course.id} style={styles.courseCard}>
                      <h3 style={styles.courseTitle}>{course.title}</h3>
                      <p style={styles.courseDesc}>{course.description}</p>
                      <div style={styles.courseMeta}>
                        <div>👨‍🏫 {course.instructor}</div>
                      </div>
                      <button
                        style={{
                          ...styles.enrollButton,
                          backgroundColor: isAlreadyEnrolled ? '#ccc' : styles.enrollButton.backgroundColor,
                          cursor: isAlreadyEnrolled ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => {
                          if (!isAlreadyEnrolled) {
                            handleEnrollCourse(course);
                          }
                        }}
                        disabled={isAlreadyEnrolled}
                      >
                        {isAlreadyEnrolled ? 'Already Enrolled' : 'Enroll Now'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'my-courses' && (
            <div>
              <h2>My Enrolled Courses</h2>
              <p>Your enrolled courses and session details</p>
              {enrolledCourses.length === 0 ? (
                <p style={styles.emptyState}>You haven't enrolled in any courses yet.</p>
              ) : (
                <div style={styles.coursesGrid}>
                  {enrolledCourses
                    .filter((course, idx, arr) => arr.findIndex(c => c.courseId === course.courseId) === idx)
                    .map((course) => (
                    <div key={course.id} style={{...styles.courseCard, cursor: 'pointer'}} onClick={() => handleViewCourse(course)}>
                      <h3 style={styles.courseTitle}>{course.title}</h3>
                      <p style={styles.courseDesc}>
                        {course.description?.substring(0, 150)}{course.description?.length > 150 ? '...' : ''}
                      </p>
                      <div style={styles.courseMeta}>
                        <div>👨‍🏫 {course.instructor}</div>
                        <div>📅 {course.sessions?.length || 0} Sessions</div>
                        <div>💰 R{course.price || 0}</div>
                      </div>
                      <div style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
                        Enrolled: {new Date(course.enrollmentDate).toLocaleDateString()}
                      </div>
                      <button
                        style={styles.viewButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCourse(course);
                        }}
                      >
                        View Details & Sessions
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'course-detail' && selectedCourse && (
            <div>
              <div style={styles.courseDetailHeader}>
                <button style={styles.backButton} onClick={handleBackToCourses}>
                  ← Back to My Courses
                </button>
                <h2>{selectedCourse.title}</h2>
                <p>{selectedCourse.description}</p>
              </div>

              <div style={styles.courseDetailContent}>
                <div style={styles.detailSection}>
                  <h3>Course Information</h3>
                  <div style={styles.infoGrid}>
                    <div>📅 Start Date: {selectedCourse.date}</div>
                    <div>📊 Status: {selectedCourse.status}</div>
                    <div>💰 Price per Session: R{selectedCourse.price}</div>
                  </div>
                </div>

                <div style={styles.detailSection}>
                  <h3>Upcoming Sessions</h3>
                  {courseSessions.length === 0 ? (
                    <p>No sessions scheduled yet.</p>
                  ) : (
                    <div style={styles.sessionsList}>
                      {courseSessions.map((session) => {
                        const isUpcoming = new Date(session.date) > new Date();
                        const userTicket = purchasedTickets.find(ticket => ticket.sessionId === session.session_id || ticket.sessionId === session.id);
                        
                        return (
                          <div key={session.session_id || session.id} style={styles.sessionItem}>
                            <div style={styles.sessionInfo}>
                              <h4>{session.title}</h4>
                              <p>{session.description}</p>
                              <div style={styles.sessionMeta}>
                                <span>📅 {session.date} {session.start_time ? `at ${session.start_time}` : ''}</span>
                                <span>📍 {session.venue || session.location || 'TBD'}</span>
                                <span>⏱️ {session.duration || (session.end_time && session.start_time ? 'TBD' : 'TBD')}</span>
                                <span>👥 {session.enrolled || 0}/{session.total_seats || 30} enrolled</span>
                                {session.price && <span>💰 R{session.price}</span>}
                              </div>
                            </div>
                            <div style={styles.sessionActions}>
                              <div style={styles.sessionStatus}>
                                <span style={styles.sessionBadge}>
                                  {isUpcoming ? 'Upcoming' : 'Completed'}
                                </span>
                              </div>
                              {userTicket ? (
                                <div style={styles.ticketOwned}>
                                  <span>✅ Ticket Owned</span>
                                  <small>{userTicket.ticketNumber}</small>
                                  <div style={styles.ticketActions}>
                                    <button
                                      style={styles.transferButton}
                                      onClick={() => handleTransferTicket(userTicket)}
                                    >
                                      🔄 Transfer Ticket
                                    </button>
                                  </div>
                                </div>
                              ) : isUpcoming ? (
                                <button
                                  style={styles.purchaseButton}
                                  onClick={() => handleYocoPayment(session)}
                                >
                                  Purchase Ticket - R{session.price || selectedCourse.price || 0}
                                </button>
                              ) : (
                                <span style={styles.sessionExpired}>Session Completed</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={styles.detailSection}>
                  <h3>Instructor Notes</h3>
                  <div style={styles.notesDisplay}>
                    {courseNotes}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'my-tickets' && (
            <div>
              <h2>My Purchased Tickets</h2>
              <p>Your session tickets and attendance records</p>
              {purchasedTickets.length === 0 ? (
                <p style={styles.emptyState}>You haven't purchased any tickets yet.</p>
              ) : (
                <div style={styles.ticketsList}>
                  {purchasedTickets.map((ticket) => (
                    <div key={ticket.id} style={styles.ticketCard}>
                      <div style={styles.ticketHeader}>
                        <h3>{ticket.session_title || ticket.sessionTitle || 'Session'}</h3>
                        <span style={styles.ticketNumber}>🎫 {ticket.ticket_id || ticket.ticketNumber}</span>
                      </div>
                      <div style={styles.ticketDetails}>
                        <p><strong>Course:</strong> {ticket.course_title || ticket.courseTitle}</p>
                        <p><strong>Date:</strong> {ticket.session_date || ticket.sessionDate}</p>
                        <p><strong>Location:</strong> {ticket.session_venue || ticket.location || 'TBD'}</p>
                        <p><strong>Price:</strong> R{ticket.amount || ticket.price}</p>
                        <p><strong>Purchased:</strong> {new Date(ticket.purchased_at || ticket.purchaseDate).toLocaleDateString()}</p>
                        <p><strong>Payment Method:</strong> {ticket.payment_method?.toUpperCase() || 'N/A'}</p>
                        <p><strong>Status:</strong> <span style={{color: ticket.status === 'confirmed' ? 'green' : 'orange'}}>{ticket.status || 'Pending'}</span></p>
                      </div>
                      <div style={styles.ticketStatus}>
                        <span style={styles.statusBadge}>
                          {new Date(ticket.session_date || ticket.sessionDate) > new Date() ? '🎫 Upcoming' : '✅ Completed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2>My Profile</h2>
              <div style={styles.profileSection}>
                <div style={styles.profileInfo}>
                  <h3>Personal Information</h3>
                  <p><strong>Name:</strong> {currentUser?.name}</p>
                  <p><strong>Email:</strong> {currentUser?.email}</p>
                  <p><strong>Role:</strong> Student</p>
                  <p><strong>Member Since:</strong> {new Date().toLocaleDateString()}</p>
                </div>
                <div style={styles.profileActions}>
                  <button style={styles.editButton}>Edit Profile</button>
                  <button style={styles.settingsButton}>Account Settings</button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Yoco Payment Modal */}
        {showYocoPaymentModal && selectedSessionForPayment && (
          <YocoPaymentModal
            isOpen={showYocoPaymentModal}
            onClose={handleYocoPaymentCancel}
            paymentData={{
              amount: selectedSessionForPayment.price || selectedCourse?.price || 0,
              currency: 'ZAR',
              courseData: selectedCourse,
              sessionData: selectedSessionForPayment
            }}
            currentUser={currentUser}
            onPaymentSuccess={handleYocoPaymentSuccess}
            onPaymentError={handleYocoPaymentError}
          />
        )}
      </div>
    );
  }

  // Login view
  return (
    <div style={styles.container}>
      <h1>Login</h1>
      <p>Sign in to access your dashboard</p>
      
      <button
        style={{
          ...styles.googleButton,
          opacity: isAuthenticating ? 0.6 : 1,
          cursor: isAuthenticating ? 'not-allowed' : 'pointer'
        }}
        onClick={handleGoogleLogin}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? 'Signing in...' : 'Login with Google'}
      </button>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "80vh",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "30px",
  },
  header: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  roleSwitchButton: {
    padding: "10px 20px",
    backgroundColor: "#ffd700",
    color: "#0051a8",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  logoutButton: {
    padding: "10px 20px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  section: {
    width: "100%",
    maxWidth: "600px",
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "10px",
  },
  googleButton: {
    padding: "12px 25px",
    backgroundColor: "#4285F4",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
  },
  // Tab styles
  tabs: {
    display: "flex",
    gap: "5px",
    marginBottom: "20px",
    borderBottom: "2px solid #e0e0e0",
    width: "100%",
    maxWidth: "800px",
  },
  tab: {
    padding: "12px 20px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "3px solid transparent",
    cursor: "pointer",
    fontSize: "16px",
    color: "#666",
    flex: 1,
  },
  activeTab: {
    padding: "12px 20px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "3px solid #0051a8",
    cursor: "pointer",
    fontSize: "16px",
    color: "#0051a8",
    fontWeight: "bold",
    flex: 1,
  },
  tabContent: {
    width: "100%",
    maxWidth: "800px",
  },
  // Course styles
  coursesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  courseCard: {
    backgroundColor: "white",
    border: "2px solid #e0e0e0",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  courseTitle: {
    color: "#0051a8",
    margin: "0 0 10px 0",
    fontSize: "18px",
  },
  courseDesc: {
    color: "#666",
    margin: "0 0 15px 0",
    lineHeight: "1.4",
  },
  courseMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "15px",
    fontSize: "14px",
  },
  enrollButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#0051a8",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  // Enrolled courses styles
  coursesList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "20px",
  },
  enrolledCourseCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    padding: "20px",
  },
  courseInfo: {
    flex: 1,
  },
  courseStatus: {
    textAlign: "right",
  },
  statusBadge: {
    backgroundColor: "#e3f2fd",
    color: "#0051a8",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  // Profile styles
  profileSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
    marginTop: "20px",
  },
  profileInfo: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    border: "2px solid #e0e0e0",
  },
  profileActions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  editButton: {
    padding: "10px 20px",
    backgroundColor: "#ffd700",
    color: "#0051a8",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  settingsButton: {
    padding: "10px 20px",
    backgroundColor: "#e0e0e0",
    color: "#333",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
  },
  // Payment styles
  paymentHistory: {
    marginTop: "20px",
  },
  paymentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "15px",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    textAlign: "right",
  },
  paymentStatus: {
    display: "block",
    color: "#28a745",
    fontSize: "12px",
    fontWeight: "bold",
    marginTop: "5px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#666",
    fontStyle: "italic",
  },
  // Course detail styles
  courseDetailHeader: {
    marginBottom: "30px",
  },
  backButton: {
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "14px",
    marginBottom: "15px",
  },
  courseDetailContent: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  detailSection: {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "10px",
    border: "2px solid #e0e0e0",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginTop: "15px",
  },
  sessionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "15px",
  },
  sessionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    padding: "15px",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionMeta: {
    display: "flex",
    gap: "20px",
    marginTop: "10px",
    fontSize: "14px",
    color: "#666",
  },
  sessionActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
  },
  purchaseButton: {
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  ticketOwned: {
    textAlign: "center",
    color: "#28a745",
    fontWeight: "bold",
  },
  ticketActions: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
    justifyContent: "center",
  },
  transferButton: {
    padding: "8px 15px",
    backgroundColor: "#17a2b8",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },
  sessionExpired: {
    color: "#6c757d",
    fontSize: "14px",
    fontStyle: "italic",
  },
  sessionBadge: {
    backgroundColor: "#e3f2fd",
    color: "#0051a8",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  notesDisplay: {
    backgroundColor: "white",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    padding: "15px",
    marginTop: "15px",
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: "1.5",
    minHeight: "100px",
  },
  viewButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#0051a8",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "15px",
  },
  ticketsList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  ticketCard: {
    backgroundColor: "#f8f9fa",
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    padding: "20px",
  },
  ticketHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  ticketNumber: {
    backgroundColor: "#ffd700",
    color: "#0051a8",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  ticketDetails: {
    marginBottom: "15px",
  },
  ticketStatus: {
    textAlign: "right",
  },
};

export default LoginPortal;
