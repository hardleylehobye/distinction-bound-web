// Local: backend on port 5000. Vercel: same-origin /api. GitHub Pages: use Vercel API (no backend on github.io).
const VERCEL_API = 'https://distinction-bound-web.vercel.app/api';
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5000/api';
    if (host.includes('vercel.app')) return window.location.origin + '/api';
    // GitHub Pages / other static hosts: no API, use Vercel
    if (host.includes('github.io') || host.includes('github.com')) return VERCEL_API;
  }
  const env = (process.env.REACT_APP_API_URL || '').trim();
  if (env) return env.endsWith('/api') ? env : env.replace(/\/?$/, '') + '/api';
  return (typeof window !== 'undefined' ? window.location.origin : '') + '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Throw with backend error message when response is not ok (so UI can show it)
async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data.error || data.message || `Request failed (${response.status})`;
    throw new Error(msg);
  }
  return data;
}

const api = {
  // Auth
  async login(uid, email, name) {
    return fetchJson(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, email, name })
    });
  },

  // Users
  async getUser(uid) {
    return fetchJson(`${API_BASE_URL}/users/${uid}`);
  },

  async getAllUsers() {
    return fetchJson(`${API_BASE_URL}/users`);
  },

  async getUsers() {
    return fetchJson(`${API_BASE_URL}/users`);
  },

  async updateUser(uid, data) {
    return fetchJson(`${API_BASE_URL}/users/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Courses
  async getCourses() {
    return fetchJson(`${API_BASE_URL}/courses`);
  },

  async getCourse(courseId) {
    return fetchJson(`${API_BASE_URL}/courses/${courseId}`);
  },

  async createCourse(course) {
    return fetchJson(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course)
    });
  },

  async updateCourse(courseId, updates) {
    const encodedCourseId = encodeURIComponent(courseId);
    console.log('✏️ API: Updating course with ID:', courseId, 'Encoded:', encodedCourseId);
    return fetchJson(`${API_BASE_URL}/courses/${encodedCourseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  async deleteCourse(courseId) {
    const encodedCourseId = encodeURIComponent(courseId);
    console.log('🗑️ API: Deleting course with ID:', courseId, 'Encoded:', encodedCourseId);
    return fetchJson(`${API_BASE_URL}/courses/${encodedCourseId}`, { method: 'DELETE' });
  },

  async assignDefaultInstructor() {
    return fetchJson(`${API_BASE_URL}/courses/assign-default-instructor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Sessions
  async getSessions(courseId = null) {
    const url = courseId
      ? `${API_BASE_URL}/sessions?courseId=${courseId}`
      : `${API_BASE_URL}/sessions`;
    return fetchJson(url);
  },

  async getSession(sessionId) {
    return fetchJson(`${API_BASE_URL}/sessions/${sessionId}`);
  },

  async createSession(session) {
    return fetchJson(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
  },

  async updateSession(sessionId, updates) {
    return fetchJson(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  async deleteSession(sessionId) {
    return fetchJson(`${API_BASE_URL}/sessions/${sessionId}`, { method: 'DELETE' });
  },

  // Enrollments
  async getUserEnrollments(uid) {
    return fetchJson(`${API_BASE_URL}/enrollments/user/${uid}`);
  },

  async createEnrollment(enrollment) {
    return fetchJson(`${API_BASE_URL}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrollment)
    });
  },

  // Notes
  async getSessionNotes(sessionId) {
    return fetchJson(`${API_BASE_URL}/notes/session/${sessionId}`);
  },

  async createNote(note) {
    return fetchJson(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    });
  },

  // Videos
  async getSessionVideos(sessionId) {
    return fetchJson(`${API_BASE_URL}/videos/session/${sessionId}`);
  },

  async createVideo(video) {
    return fetchJson(`${API_BASE_URL}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video)
    });
  },

  // Tickets/Purchases
  async getUserTickets(uid) {
    console.log('🎫 Fetching tickets for UID:', uid);
    const data = await fetchJson(`${API_BASE_URL}/tickets/user/${uid}`);
    console.log('🎫 API Response:', data);
    return data;
  },

  async createTicket(ticket) {
    console.log('🎫 API: Creating ticket with data:', ticket);
    const data = await fetchJson(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    console.log('🎫 API: Ticket created successfully:', data);
    return data;
  },

  // Attendance
  async getSessionAttendance(sessionId) {
    return fetchJson(`${API_BASE_URL}/attendance/session/${sessionId}`);
  },

  async markAttendance(ticketNumber, sessionId, markedBy) {
    return fetchJson(`${API_BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_number: ticketNumber, session_id: sessionId, marked_by: markedBy })
    });
  },

  async getTicketAttendance(ticketNumber) {
    return fetchJson(`${API_BASE_URL}/attendance/ticket/${ticketNumber}`);
  },

  // Finance
  async getFinanceOverview() {
    return fetchJson(`${API_BASE_URL}/finance/overview`);
  },

  async getMonthlySummary(year = null, month = null) {
    let url = `${API_BASE_URL}/finance/monthly-summary`;
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchJson(url);
  },

  async getTransactions(startDate = null, endDate = null) {
    let url = `${API_BASE_URL}/finance/transactions`;
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchJson(url);
  },

  // Payouts
  async getPayouts() {
    return fetchJson(`${API_BASE_URL}/payouts`);
  },

  async markPayoutPaid(instructorId, month, year, amountPaid, paymentMethod, paymentReference, paidBy) {
    return fetchJson(`${API_BASE_URL}/payouts/mark-paid`, {
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
  },

  async getInstructorPayoutHistory(instructorId) {
    return fetchJson(`${API_BASE_URL}/payouts/instructor/${instructorId}`);
  },

  // Contact support / grievance
  async submitContact({ name, email, subject, message, phone }) {
    return fetchJson(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message, phone })
    });
  }
};

export default api;
