const { Resend } = require('resend');

// Check if API key is available
const API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

// Resend does not allow sending FROM @gmail.com (domain cannot be verified). Use Resend default and Reply-To.
const fromTrimmed = String(FROM_EMAIL || '').trim();
const unverifiedPattern = /@(gmail|googlemail|yahoo|hotmail|outlook|live|icloud)\.(com|co\.uk|org)\b/i;
const isUnverifiedDomain = unverifiedPattern.test(fromTrimmed);
const SEND_FROM = isUnverifiedDomain ? 'Distinction Bound <onboarding@resend.dev>' : FROM_EMAIL;
const replyToMatch = fromTrimmed.match(/<([^>]+)>/);
const REPLY_TO = isUnverifiedDomain ? (replyToMatch ? replyToMatch[1].trim() : fromTrimmed) : undefined;

let resend = null;
let emailEnabled = false;

if (API_KEY) {
  try {
    resend = new Resend(API_KEY);
    emailEnabled = true;
    console.log('✅ Email service enabled');
    console.log('📧 From:', SEND_FROM, REPLY_TO ? `(replies to ${REPLY_TO})` : '');
  } catch (error) {
    console.warn('⚠️ Email service initialization failed:', error.message);
    console.warn('📧 Emails will be disabled');
  }
} else {
  console.warn('⚠️ RESEND_API_KEY not found in environment variables');
  console.warn('📧 Email notifications are disabled');
  console.warn('💡 Add RESEND_API_KEY to backend/.env to enable emails');
}

const emailService = {
  // Welcome email for new users
  async sendWelcomeEmail(user) {
    if (!emailEnabled) {
      console.log('📧 [SKIPPED] Welcome email (service disabled):', user.email);
      return { success: false, error: 'Email service not configured' };
    }
    
    try {
      const { data, error } = await resend.emails.send({
        from: SEND_FROM,
        ...(REPLY_TO && { replyTo: REPLY_TO }),
        to: user.email,
        subject: '🎓 Welcome to Distinction Bound!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0051a8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #ffd700; color: #0051a8; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎓 Welcome to Distinction Bound!</h1>
                </div>
                <div class="content">
                  <h2>Hi ${user.name}!</h2>
                  <p>Thank you for joining <strong>Distinction Bound</strong> - your path to academic excellence!</p>
                  
                  <p>Your account has been created successfully:</p>
                  <ul>
                    <li><strong>Email:</strong> ${user.email}</li>
                    <li><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</li>
                  </ul>
                  
                  <p>You can now:</p>
                  <ul>
                    <li>✅ Browse available courses</li>
                    <li>✅ Enroll in sessions</li>
                    <li>✅ Access course materials</li>
                    <li>✅ Track your progress</li>
                  </ul>
                  
                  <div style="text-align: center;">
                    <a href="http://localhost:3000" class="button">Go to Dashboard</a>
                  </div>
                  
                  <p style="margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>
                  
                  <p>Best regards,<br><strong>The Distinction Bound Team</strong></p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Distinction Bound. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('❌ Email send error:', error);
        return { success: false, error };
      }

      console.log('✅ Welcome email sent to:', user.email);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Email service error:', error);
      return { success: false, error: error.message };
    }
  },

  // Enrollment confirmation email
  async sendEnrollmentEmail(user, course, session) {
    if (!emailEnabled) {
      console.log('📧 [SKIPPED] Enrollment email (service disabled):', user.email);
      return { success: false, error: 'Email service not configured' };
    }
    
    try {
      const { data, error } = await resend.emails.send({
        from: SEND_FROM,
        ...(REPLY_TO && { replyTo: REPLY_TO }),
        to: user.email,
        subject: `📚 Enrollment Confirmed: ${course.title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0051a8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .info-box { background: white; padding: 15px; border-left: 4px solid #ffd700; margin: 15px 0; }
                .button { display: inline-block; background: #ffd700; color: #0051a8; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 You're Enrolled!</h1>
                </div>
                <div class="content">
                  <h2>Hi ${user.name}!</h2>
                  <p>Great news! You've successfully enrolled in:</p>
                  
                  <div class="info-box">
                    <h3 style="margin-top: 0;">${course.title}</h3>
                    ${course.description ? `<p>${course.description}</p>` : ''}
                  </div>
                  
                  <p><strong>What's next?</strong></p>
                  <ul>
                    <li>Access your course materials in the dashboard</li>
                    <li>Attend sessions and engage with content</li>
                    <li>Purchase individual session tickets as needed</li>
                  </ul>
                  
                  <div style="text-align: center;">
                    <a href="http://localhost:3000" class="button">View My Courses</a>
                  </div>
                  
                  <p style="margin-top: 30px;">Good luck with your studies!</p>
                  
                  <p>Best regards,<br><strong>The Distinction Bound Team</strong></p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('❌ Email send error:', error);
        return { success: false, error };
      }

      console.log('✅ Enrollment email sent to:', user.email);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Email service error:', error);
      return { success: false, error: error.message };
    }
  },

  // Payment receipt email with ticket
  async sendPaymentReceiptEmail(user, purchase, session, course) {
    if (!emailEnabled) {
      console.log('📧 [SKIPPED] Payment receipt (service disabled):', user.email);
      return { success: false, error: 'Email service not configured' };
    }
    
    try {
      const { data, error} = await resend.emails.send({
        from: SEND_FROM,
        ...(REPLY_TO && { replyTo: REPLY_TO }),
        to: user.email,
        subject: `🎫 Payment Confirmed - Ticket #${purchase.ticket_id}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .ticket { background: white; border: 2px dashed #0051a8; padding: 20px; margin: 20px 0; text-align: center; }
                .ticket-number { font-size: 32px; font-weight: bold; color: #0051a8; font-family: monospace; letter-spacing: 3px; }
                .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                .amount { font-size: 24px; color: #28a745; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Payment Successful!</h1>
                </div>
                <div class="content">
                  <h2>Hi ${user.name}!</h2>
                  <p>Your payment has been processed successfully. Here's your ticket:</p>
                  
                  <div class="ticket">
                    <h3 style="margin-top: 0;">🎫 SESSION TICKET</h3>
                    <div class="ticket-number">${purchase.ticket_id}</div>
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Save this number for attendance</p>
                  </div>
                  
                  <h3>Session Details:</h3>
                  <div style="background: white; padding: 15px; border-radius: 5px;">
                    <div class="info-row">
                      <span><strong>Course:</strong></span>
                      <span>${course?.title || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span><strong>Session:</strong></span>
                      <span>${session?.title || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span><strong>Date:</strong></span>
                      <span>${session?.date ? new Date(session.date).toLocaleDateString('en-ZA') : 'TBA'}</span>
                    </div>
                    <div class="info-row">
                      <span><strong>Venue:</strong></span>
                      <span>${session?.venue || 'TBA'}</span>
                    </div>
                    <div class="info-row" style="border-bottom: none; margin-top: 10px;">
                      <span><strong>Amount Paid:</strong></span>
                      <span class="amount">R${parseFloat(purchase.amount).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <p style="margin-top: 20px;"><strong>Important:</strong></p>
                  <ul>
                    <li>Keep your ticket number safe</li>
                    <li>You'll need it to mark attendance</li>
                    <li>Arrive 10 minutes early to the session</li>
                  </ul>
                  
                  <p>See you at the session!</p>
                  
                  <p>Best regards,<br><strong>The Distinction Bound Team</strong></p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('❌ Email send error:', error);
        return { success: false, error };
      }

      console.log('✅ Payment receipt sent to:', user.email);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Email service error:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin notification for new user
  async sendAdminNewUserNotification(adminEmail, newUser) {
    if (!emailEnabled) {
      console.log('📧 [SKIPPED] Admin notification (service disabled)');
      return { success: false, error: 'Email service not configured' };
    }
    
    try {
      const { data, error } = await resend.emails.send({
        from: SEND_FROM,
        ...(REPLY_TO && { replyTo: REPLY_TO }),
        to: adminEmail,
        subject: `👤 New User Registered: ${newUser.name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>New User Registration</h2>
              <p>A new user has registered on Distinction Bound:</p>
              <ul>
                <li><strong>Name:</strong> ${newUser.name}</li>
                <li><strong>Email:</strong> ${newUser.email}</li>
                <li><strong>Role:</strong> ${newUser.role}</li>
                <li><strong>Registered:</strong> ${new Date().toLocaleString('en-ZA')}</li>
              </ul>
              <p><a href="http://localhost:3000">View in Admin Portal</a></p>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('❌ Admin email error:', error);
        return { success: false, error };
      }

      console.log('✅ Admin notification sent');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Email service error:', error);
      return { success: false, error: error.message };
    }
  },

  // Contact support / grievance: forward to hardleylehobye@gmail.com, CC lehlohonolomahlangu718@gmail.com
  async sendContactEnquiry({ name, email, subject, message, phone }) {
    if (!emailEnabled || !resend) {
      console.log('📧 [SKIPPED] Contact enquiry (service disabled)');
      return { success: false, error: 'Email service not configured' };
    }
    const toSupport = 'hardleylehobye@gmail.com';
    const ccSupport = 'lehlohonolomahlangu718@gmail.com';
    try {
      const { data, error } = await resend.emails.send({
        from: SEND_FROM,
        ...(REPLY_TO && { replyTo: REPLY_TO }),
        to: toSupport,
        cc: ccSupport,
        replyTo: email,
        subject: `[Contact Support] ${subject || 'Enquiry / Grievance'}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
              <h2>Contact / Grievance submitted via website</h2>
              <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
              <p><strong>Subject:</strong> ${subject || 'Enquiry / Grievance'}</p>
              <hr/>
              <h3>Message</h3>
              <p style="white-space: pre-wrap;">${(message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              <hr/>
              <p style="color:#666;font-size:12px;">Received at ${new Date().toLocaleString('en-ZA')}</p>
            </body>
          </html>
        `,
      });
      if (error) {
        console.error('❌ Contact enquiry email error:', error);
        const errMsg = typeof error === 'object' && error !== null
          ? (error.message || error.name || JSON.stringify(error))
          : String(error);
        return { success: false, error: errMsg };
      }
      console.log('✅ Contact enquiry sent to support');
      return { success: true, data };
    } catch (err) {
      console.error('❌ Contact enquiry error:', err);
      return { success: false, error: err && err.message ? err.message : String(err) };
    }
  },

  // Auto-reply to user: "We have received your query and we are working on it"
  async sendContactAutoReply(userEmail, userName) {
    if (!emailEnabled) {
      return { success: false, error: 'Email service not configured' };
    }
    try {
      const { data, error } = await resend.emails.send({
        from: SEND_FROM,
        ...(REPLY_TO && { replyTo: REPLY_TO }),
        to: userEmail,
        subject: 'We have received your query – Distinction Bound',
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
              <h2>Thank you for contacting us</h2>
              <p>Hi ${userName || 'there'},</p>
              <p>We have received your query and we are working on it. Our team will get back to you as soon as possible.</p>
              <p>If your matter is urgent, you can also reach us during office hours.</p>
              <p>Best regards,<br/><strong>The Distinction Bound Team</strong></p>
            </body>
          </html>
        `,
      });
      if (error) {
        console.error('❌ Contact auto-reply error:', error);
        return { success: false, error };
      }
      console.log('✅ Contact auto-reply sent to:', userEmail);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Contact auto-reply error:', err);
      return { success: false, error: err.message };
    }
  },

  // Instructor notification for new enrollment
  async sendInstructorEnrollmentNotification(instructor, student, course) {
    if (!emailEnabled) {
      console.log('📧 [SKIPPED] Instructor notification (service disabled)');
      return { success: false, error: 'Email service not configured' };
    }
    
    try {
      const { data, error } = await resend.emails.send({
        from: SEND_FROM,
        ...(REPLY_TO && { replyTo: REPLY_TO }),
        to: instructor.email,
        subject: `📚 New Student Enrolled: ${course.title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>New Student Enrollment</h2>
              <p>Hi ${instructor.name},</p>
              <p>A new student has enrolled in your course:</p>
              <ul>
                <li><strong>Student:</strong> ${student.name}</li>
                <li><strong>Email:</strong> ${student.email}</li>
                <li><strong>Course:</strong> ${course.title}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleString('en-ZA')}</li>
              </ul>
              <p><a href="http://localhost:3000">View in Instructor Portal</a></p>
              <p>Best regards,<br>Distinction Bound</p>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('❌ Instructor email error:', error);
        return { success: false, error };
      }

      console.log('✅ Instructor notification sent');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Email service error:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;
