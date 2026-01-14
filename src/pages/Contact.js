import React, { useState } from 'react';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Will integrate with email service or your Manager app
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    }, 3000);
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Get In Touch</h1>
        <p style={styles.heroSubtitle}>
          Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </section>

      {/* Contact Content */}
      <section style={styles.contactSection}>
        <div style={styles.grid}>
          {/* Contact Info */}
          <div style={styles.infoSection}>
            <h2 style={styles.sectionTitle}>Contact Information</h2>
            
            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>📞</div>
              <div>
                <h3 style={styles.infoTitle}>Phone</h3>
                <p style={styles.infoText}>068 587 7354</p>
              </div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>✉️</div>
              <div>
                <h3 style={styles.infoTitle}>Email</h3>
                <p style={styles.infoText}>enquiries@distinctionboundprogram.co.za</p>
              </div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>⏰</div>
              <div>
                <h3 style={styles.infoTitle}>Office Hours</h3>
                <p style={styles.infoText}>Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p style={styles.infoText}>Saturday: 10:00 AM - 4:00 PM</p>
                <p style={styles.infoText}>Sunday: Closed</p>
              </div>
            </div>

            <div style={styles.socialSection}>
              <h3 style={styles.infoTitle}>Follow Us</h3>
              <div style={styles.socialLinks}>
                <div style={styles.socialIcon}>📘 Facebook</div>
                <div style={styles.socialIcon}>📷 Instagram</div>
                <div style={styles.socialIcon}>🐦 Twitter</div>
                <div style={styles.socialIcon}>💼 LinkedIn</div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div style={styles.formSection}>
            <h2 style={styles.sectionTitle}>Send Us a Message</h2>
            
            {submitted ? (
              <div style={styles.successMessage}>
                <div style={styles.successIcon}>✓</div>
                <h3 style={styles.successTitle}>Message Sent!</h3>
                <p style={styles.successText}>
                  Thank you for contacting us. We'll get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="Your full name"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Your phone number"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="What is this regarding?"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    style={styles.textarea}
                    placeholder="Your message here..."
                    rows="6"
                  />
                </div>

                <button type="submit" style={styles.submitButton}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={styles.faqSection}>
        <h2 style={styles.faqTitle}>Frequently Asked Questions</h2>
        <div style={styles.faqGrid}>
          <div style={styles.faqCard}>
            <h3 style={styles.faqQuestion}>How do I register for a session?</h3>
            <p style={styles.faqAnswer}>
              Browse our available courses, select the one you're interested in, and purchase a ticket. You'll receive confirmation via email.
            </p>
          </div>

          <div style={styles.faqCard}>
            <h3 style={styles.faqQuestion}>What subjects do you offer tutoring for?</h3>
            <p style={styles.faqAnswer}>
              We offer tutoring for various high school and university subjects. Check our Courses page for current offerings.
            </p>
          </div>

          <div style={styles.faqCard}>
            <h3 style={styles.faqQuestion}>Are there group or individual sessions?</h3>
            <p style={styles.faqAnswer}>
              We primarily offer small group sessions to provide personalized attention while maintaining an engaging learning environment.
            </p>
          </div>

          <div style={styles.faqCard}>
            <h3 style={styles.faqQuestion}>What if I can't attend a session I registered for?</h3>
            <p style={styles.faqAnswer}>
              Please contact us as soon as possible. We'll do our best to accommodate transfers to future sessions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
  },
  hero: {
    backgroundColor: '#0051a8',
    color: 'white',
    padding: '80px 20px',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  heroSubtitle: {
    fontSize: '20px',
    opacity: 0.9,
    maxWidth: '600px',
    margin: '0 auto',
  },
  contactSection: {
    maxWidth: '1200px',
    margin: '60px auto',
    padding: '0 20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '50px',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionTitle: {
    fontSize: '28px',
    color: '#0051a8',
    marginBottom: '20px',
  },
  infoCard: {
    display: 'flex',
    gap: '15px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
  },
  infoIcon: {
    fontSize: '32px',
  },
  infoTitle: {
    fontSize: '18px',
    color: '#0051a8',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: '14px',
    color: '#666',
    margin: '4px 0',
    lineHeight: '1.6',
  },
  socialSection: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
  },
  socialLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginTop: '10px',
  },
  socialIcon: {
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'transform 0.3s',
  },
  formSection: {},
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    transition: 'border-color 0.3s',
  },
  textarea: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  submitButton: {
    backgroundColor: '#0051a8',
    color: 'white',
    border: 'none',
    padding: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  successMessage: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#d4edda',
    borderRadius: '10px',
  },
  successIcon: {
    width: '60px',
    height: '60px',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    margin: '0 auto 20px',
  },
  successTitle: {
    fontSize: '24px',
    color: '#155724',
    marginBottom: '10px',
  },
  successText: {
    fontSize: '16px',
    color: '#155724',
  },
  faqSection: {
    backgroundColor: '#f8f9fa',
    padding: '80px 20px',
    marginTop: '60px',
  },
  faqTitle: {
    fontSize: '36px',
    textAlign: 'center',
    color: '#0051a8',
    marginBottom: '60px',
  },
  faqGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
  },
  faqCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
  },
  faqQuestion: {
    fontSize: '18px',
    color: '#0051a8',
    marginBottom: '15px',
  },
  faqAnswer: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
  },
};

export default Contact;