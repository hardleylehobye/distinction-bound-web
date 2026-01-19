import React, { useState, useEffect } from "react";
import { signInWithGoogle } from "../authService";
import { db } from "../firebase";
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
import PayFastPaymentModal from "../components/PayFastPaymentModal";
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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

      const purchasesQuery = query(
        collection(db, "purchases"),
        where("userId", "==", currentUser.uid)
      );
      const purchasesSnapshot = await getDocs(purchasesQuery);

      const tickets = purchasesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPurchasedTickets(tickets);
    } catch (error) {
      console.error("Error loading purchased tickets:", error);
      setPurchasedTickets([]);
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      if (!currentUser || !currentUser.uid) {
        console.log("No current user, skipping enrolled courses load");
        return;
      }

      console.log("Loading enrolled courses for user:", currentUser.uid);

      // Load enrollments for current user from Firestore
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", currentUser.uid)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      console.log("Found enrollments:", enrollmentsSnapshot.size);

      const enrolledCoursesData = await Promise.all(
        enrollmentsSnapshot.docs.map(async (enrollmentDoc) => {
          const enrollment = { id: enrollmentDoc.id, ...enrollmentDoc.data() };

          // Load course details
          try {
            const courseDoc = await getDoc(doc(db, "courses", enrollment.courseId));
            if (courseDoc.exists()) {
              const courseData = courseDoc.data();
              
              // Load instructor info
              console.log("Enrolled course data:", courseData); // DEBUG
              console.log("instructorId:", courseData.instructorId); // DEBUG
              console.log("instructorName:", courseData.instructorName); // DEBUG
              
              if (courseData.instructorId) {
                try {
                  const instructorDoc = await getDoc(doc(db, "users", courseData.instructorId));
                  if (instructorDoc.exists()) {
                    courseData.instructor = instructorDoc.data().name || instructorDoc.data().displayName || instructorDoc.data().email || JSON.stringify(instructorDoc.data());
                  } else {
                    courseData.instructor = courseData.instructorName || "No Instructor Assigned";
                  }
                } catch (error) {
                  console.error("Error loading instructor for enrolled course:", error);
                  courseData.instructor = courseData.instructorName || "No Instructor Assigned";
                }
              } else {
                courseData.instructor = courseData.instructorName || "No Instructor Assigned";
              }
              
              console.log("Final enrolled course instructor:", courseData.instructor); // DEBUG
              
              return {
                id: courseDoc.id,
                courseId: courseDoc.id, // Add courseId for consistency
                ...courseData,
                enrollmentId: enrollmentDoc.id,
                ticketNumber: enrollment.ticketNumber,
                enrollmentDate: enrollment.enrollmentDate,
                status: enrollment.status,
              };
            }
          } catch (error) {
            console.error("Error loading course details:", error);
          }

          return null;
        })
      );

      // Filter out null values
      const validEnrolledCourses = enrolledCoursesData.filter(course => course !== null);
      console.log("Loaded enrolled courses:", validEnrolledCourses.length);
      setEnrolledCourses(validEnrolledCourses);
    } catch (error) {
      console.error("Error loading enrolled courses:", error);
      setEnrolledCourses([]);
    }
  };

  const loadAvailableCourses = async () => {
    try {
      // Load public courses
      const coursesQuery = query(
        collection(db, "courses"),
        where("visibility", "==", "public")
      );
      const coursesSnapshot = await getDocs(coursesQuery);

      const coursesData = await Promise.all(
        coursesSnapshot.docs.map(async (doc) => {
          const courseData = { id: doc.id, ...doc.data() };

          // Load instructor info
          console.log("Course data:", courseData); // DEBUG
          console.log("instructorId:", courseData.instructorId); // DEBUG
          console.log("instructorName:", courseData.instructorName); // DEBUG
          
          if (courseData.instructorId) {
            try {
              const instructorDoc = await getDoc(doc(db, "users", courseData.instructorId));
              if (instructorDoc.exists()) {
                courseData.instructor = instructorDoc.data().name || instructorDoc.data().displayName || instructorDoc.data().email || JSON.stringify(instructorDoc.data());
              } else {
                courseData.instructor = courseData.instructorName || "No Instructor Assigned";
              }
            } catch (error) {
              console.error("Error loading instructor:", error);
              courseData.instructor = courseData.instructorName || "No Instructor Assigned";
            }
          } else {
            courseData.instructor = courseData.instructorName || "No Instructor Assigned";
          }
          
          console.log("Final instructor name:", courseData.instructor); // DEBUG

          // Load session count and enrollment info
          try {
            const sessionsQuery = query(collection(db, "sessions"), where("courseId", "==", doc.id));
            const sessionsSnapshot = await getDocs(sessionsQuery);
            courseData.sessionCount = sessionsSnapshot.size;

            // Get real enrollment count
            const enrollmentsQuery = query(collection(db, "enrollments"), where("courseId", "==", doc.id));
            const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
            courseData.enrollmentCount = enrollmentsSnapshot.size;
            courseData.capacity = courseData.capacity || 30;
          } catch (error) {
            console.error("Error loading sessions and enrollments:", error);
            courseData.sessionCount = 0;
            courseData.enrollmentCount = 0;
            courseData.capacity = 30;
          }

          return courseData;
        })
      );

      setAvailableCourses(coursesData);
    } catch (error) {
      console.error("Error loading available courses:", error);
    }
  };

  const handleEnrollCourse = async (course) => {
    try {
      console.log("Starting enrollment for course:", course.title);
      console.log("Current user:", currentUser);

      if (!currentUser || !currentUser.uid) {
        alert("You must be logged in to enroll in courses.");
        return;
      }

      // Check if user is already enrolled (local check for now)
      const isAlreadyEnrolled = enrolledCourses.some(ec => ec.courseId === course.id);
      if (isAlreadyEnrolled) {
        alert("You are already enrolled in this course.");
        setActiveTab('my-courses');
        return;
      }

      // Create enrollment data
      const enrollmentData = {
        courseId: course.id,
        studentId: currentUser.uid,
        studentEmail: currentUser.email || "",
        studentName: currentUser.name || currentUser.displayName || "Unknown Student",
        courseTitle: course.title,
        enrollmentDate: new Date().toISOString(),
        status: "active",
        ticketNumber: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      console.log("Attempting to save enrollment data:", enrollmentData);

      // Save to Firestore
      const enrollmentRef = collection(db, "enrollments");
      await addDoc(enrollmentRef, enrollmentData);
      console.log("Enrollment saved to Firestore successfully");

      // Update local state immediately for better UX
      const newEnrolledCourse = {
        id: course.id, // Use course ID as main ID
        courseId: course.id,
        title: course.title,
        description: course.description,
        date: course.date || "TBD",
        price: course.price || 0,
        status: "active",
        enrollmentId: enrollmentData.enrollmentId,
        ticketNumber: enrollmentData.ticketNumber,
        enrollmentDate: enrollmentData.enrollmentDate,
      };

      setEnrolledCourses(prev => [...prev, newEnrolledCourse]);

      // Update available courses count
      setAvailableCourses(prev =>
        prev.map(c =>
          c.id === course.id
            ? { ...c, enrollmentCount: (c.enrollmentCount || 0) + 1 }
            : c
        )
      );

      // Switch to my-courses tab
      setActiveTab('my-courses');

      alert(`Successfully enrolled in ${course.title}!`);
    } catch (error) {
      console.error("Error in enrollment process:", error);
      alert(`Failed to enroll in course: ${error.message}`);
    }
  };

  const handleViewCourse = async (course) => {
    setSelectedCourse(course);

    try {
      // Load course sessions
      const sessionsQuery = query(collection(db, "sessions"), where("courseId", "==", course.courseId || course.id));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    try {
      // Check if user is logged in
      if (!currentUser || !currentUser.uid) {
        alert("You must be logged in to purchase tickets.");
        return;
      }

      // Check if user already has a ticket for this session
      const existingPurchaseQuery = query(
        collection(db, "purchases"),
        where("sessionId", "==", session.id),
        where("userId", "==", currentUser.uid)
      );
      const existingSnapshot = await getDocs(existingPurchaseQuery);

      if (existingSnapshot.empty) {
        // Calculate payment amount
        const ticketPrice = selectedCourse.price || session.price || 0;
        
        // Show payment modal
        setSelectedSessionForPayment(session);
        setShowPaymentModal(true);
        
      } else {
        alert("You already have a ticket for this session.");
        return;
      }

    } catch (error) {
      console.error("Error in ticket purchase setup:", error);
      alert(`Failed to setup purchase: ${error.message}. Please try again.`);
    }
  };

  const handlePaymentConfirm = async (cardDetails) => {
    try {
      if (!selectedSessionForPayment) return;
      
      const ticketPrice = selectedCourse.price || selectedSessionForPayment.price || 0;
      
      // Process the purchase
      await processSimplePurchase(selectedSessionForPayment, ticketPrice, cardDetails);
      
      // Close modal
      setShowPaymentModal(false);
      setSelectedSessionForPayment(null);
      
    } catch (error) {
      console.error("Error processing payment:", error);
      alert(`Error processing payment: ${error.message}`);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setSelectedSessionForPayment(null);
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

  const handleYocoPaymentSuccess = (paymentResult) => {
    console.log('Yoco payment successful:', paymentResult);
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
  };

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

  console.log("User data received:", userData); // DEBUG
  console.log("User role:", userData?.role); // DEBUG

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
                  const isAlreadyEnrolled = enrolledCourses.some(ec => ec.courseId === course.id);
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
                            setActiveTab('my-courses');
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
                    <div key={course.id} style={styles.courseCard}>
                      <h3 style={styles.courseTitle}>{course.title}</h3>
                      <p style={styles.courseDesc}>{course.description}</p>
                      <div style={styles.courseMeta}>
                        <div>👨‍🏫 {course.instructor}</div>
                      </div>
                      <button
                        style={styles.viewButton}
                        onClick={() => handleViewCourse(course)}
                      >
                        View Course
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
                        const userTicket = purchasedTickets.find(ticket => ticket.sessionId === session.id);
                        
                        return (
                          <div key={session.id} style={styles.sessionItem}>
                            <div style={styles.sessionInfo}>
                              <h4>{session.title}</h4>
                              <p>{session.description}</p>
                              <div style={styles.sessionMeta}>
                                <span>📅 {session.date} at {session.time}</span>
                                <span>📍 {session.location || 'TBD'}</span>
                                <span>⏱️ {session.duration || 'TBD'} minutes</span>
                                <span>👥 {session.enrolled || 0} enrolled</span>
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
                                  Purchase Ticket - R{selectedCourse.price}
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
                        <h3>{ticket.sessionTitle}</h3>
                        <span style={styles.ticketNumber}>🎫 {ticket.ticketNumber}</span>
                      </div>
                      <div style={styles.ticketDetails}>
                        <p><strong>Course:</strong> {ticket.courseTitle}</p>
                        <p><strong>Date:</strong> {ticket.sessionDate} at {ticket.sessionTime}</p>
                        <p><strong>Location:</strong> {ticket.location}</p>
                        <p><strong>Price:</strong> R{ticket.price}</p>
                        <p><strong>Purchased:</strong> {new Date(ticket.purchaseDate).toLocaleDateString()}</p>
                      </div>
                      <div style={styles.ticketStatus}>
                        <span style={styles.statusBadge}>
                          {new Date(ticket.sessionDate) > new Date() ? 'Upcoming' : 'Completed'}
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
        
        {/* Payment Modal */}
        {showPaymentModal && selectedSessionForPayment && (
          <PayFastPaymentModal
            session={selectedSessionForPayment}
            course={selectedCourse}
            amount={selectedCourse.price || selectedSessionForPayment.price || 0}
            currentUser={currentUser}
            onConfirm={handlePaymentConfirm}
            onCancel={handlePaymentCancel}
          />
        )}

        {/* Yoco Payment Modal */}
        {showYocoPaymentModal && selectedSessionForPayment && (
          <YocoPaymentModal
            isOpen={showYocoPaymentModal}
            onClose={handleYocoPaymentCancel}
            paymentData={{
              amount: selectedCourse.price || selectedSessionForPayment.price || 0,
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
