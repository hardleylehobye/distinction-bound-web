// API service to replace Firestore
// Use production URL as fallback if env var not set and not on localhost
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // If on localhost, use local backend; otherwise use production
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return 'https://distinction-bound-web.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = {
  // Auth
  async login(uid, email, name) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, email, name })
    });
    return response.json();
  },

  // Users
  async getUser(uid) {
    const response = await fetch(`${API_BASE_URL}/users/${uid}`);
    return response.json();
  },

  async getAllUsers() {
    const response = await fetch(`${API_BASE_URL}/users`);
    return response.json();
  },

  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/users`);
    return response.json();
  },

  async updateUser(uid, data) {
    const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Courses
  async getCourses() {
    const response = await fetch(`${API_BASE_URL}/courses`);
    return response.json();
  },

  async getCourse(courseId) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
    return response.json();
  },

  async createCourse(course) {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course)
    });
    return response.json();
  },

  async updateCourse(courseId, updates) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  },

  async deleteCourse(courseId) {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Sessions
  async getSessions(courseId = null) {
    const url = courseId 
      ? `${API_BASE_URL}/sessions?courseId=${courseId}`
      : `${API_BASE_URL}/sessions`;
    const response = await fetch(url);
    return response.json();
  },

  async getSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
    return response.json();
  },

  async createSession(session) {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    return response.json();
  },

  async updateSession(sessionId, updates) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  },

  async deleteSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Enrollments
  async getUserEnrollments(uid) {
    const response = await fetch(`${API_BASE_URL}/enrollments/user/${uid}`);
    return response.json();
  },

  async createEnrollment(enrollment) {
    const response = await fetch(`${API_BASE_URL}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrollment)
    });
    return response.json();
  },

  // Notes
  async getSessionNotes(sessionId) {
    const response = await fetch(`${API_BASE_URL}/notes/session/${sessionId}`);
    return response.json();
  },

  async createNote(note) {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    });
    return response.json();
  },

  // Videos
  async getSessionVideos(sessionId) {
    const response = await fetch(`${API_BASE_URL}/videos/session/${sessionId}`);
    return response.json();
  },

  async createVideo(video) {
    const response = await fetch(`${API_BASE_URL}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video)
    });
    return response.json();
  },

  // Tickets/Purchases
  async getUserTickets(uid) {
    console.log('🎫 Fetching tickets for UID:', uid);
    const response = await fetch(`${API_BASE_URL}/tickets/user/${uid}`);
    const data = await response.json();
    console.log('🎫 API Response:', data);
    return data;
  },

  async createTicket(ticket) {
    console.log('🎫 API: Creating ticket with data:', ticket);
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('🎫 API: Failed to create ticket:', error);
      throw new Error(error.error || 'Failed to create ticket');
    }
    
    const data = await response.json();
    console.log('🎫 API: Ticket created successfully:', data);
    return data;
  },

  // Attendance
  async getSessionAttendance(sessionId) {
    const response = await fetch(`${API_BASE_URL}/attendance/session/${sessionId}`);
    return response.json();
  },

  async markAttendance(ticketNumber, sessionId, markedBy) {
    const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_number: ticketNumber, session_id: sessionId, marked_by: markedBy })
    });
    return response.json();
  },

  async getTicketAttendance(ticketNumber) {
    const response = await fetch(`${API_BASE_URL}/attendance/ticket/${ticketNumber}`);
    return response.json();
  },

  // Finance
  async getFinanceOverview() {
    const response = await fetch(`${API_BASE_URL}/finance/overview`);
    return response.json();
  },

  async getMonthlySummary(year = null, month = null) {
    let url = `${API_BASE_URL}/finance/monthly-summary`;
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    if (params.toString()) url += `?${params.toString()}`;
    const response = await fetch(url);
    return response.json();
  },

  async getTransactions(startDate = null, endDate = null) {
    let url = `${API_BASE_URL}/finance/transactions`;
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    const response = await fetch(url);
    return response.json();
  },

  // Payouts
  async getPayouts() {
    const response = await fetch(`${API_BASE_URL}/payouts`);
    return response.json();
  },

  async markPayoutPaid(instructorId, month, year, amountPaid, paymentMethod, paymentReference, paidBy) {
    const response = await fetch(`${API_BASE_URL}/payouts/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instructor_id: instructorId,
        month,
        year,
        amount_paid: amountPaid,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        paid_by: paidBy
      })
    });
    return response.json();
  },

  async getInstructorPayoutHistory(instructorId) {
    const response = await fetch(`${API_BASE_URL}/payouts/instructor/${instructorId}`);
    return response.json();
  }
};

export default api;
