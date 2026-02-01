import React from 'react';

function Footer({ setCurrentPage }) {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.section}>
          <h3 style={styles.heading}>Distinction Bound Program</h3>
          <p style={styles.text}>
            Normalizing academic excellence among all students since 2021.
          </p>
        </div>

        <div style={styles.section}>
          <h4 style={styles.heading}>Quick Links</h4>
          <ul style={styles.linkList}>
            <li style={styles.linkItem} onClick={() => setCurrentPage('about')}>About Us</li>
            <li style={styles.linkItem} onClick={() => setCurrentPage('courses')}>Courses</li>
            <li style={styles.linkItem} onClick={() => setCurrentPage('contact')}>Contact</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h4 style={styles.heading}>Contact Info</h4>
          <p style={styles.text}>📞 068 587 7354</p>
          <p style={styles.text}>✉️ hardleylehobye@gmail.com</p>
        </div>

        <div style={styles.section}>
          <h4 style={styles.heading}>Follow Us</h4>
          <p style={styles.text}>Stay connected on social media</p>
        </div>
      </div>

      <div style={styles.bottom}>
        <p style={styles.copyright}>
          © 2025 Distinction Bound Program. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: '#0051a8',
    color: 'white',
    padding: '40px 0 20px',
    marginTop: '60px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '30px',
  },
  section: {
    marginBottom: '20px',
  },
  heading: {
    color: '#ffd700',
    marginBottom: '15px',
    fontSize: '18px',
  },
  text: {
    margin: '8px 0',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  linkList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  linkItem: {
    padding: '5px 0',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'color 0.3s',
  },
  bottom: {
    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
    marginTop: '30px',
    paddingTop: '20px',
    textAlign: 'center',
  },
  copyright: {
    margin: 0,
    fontSize: '14px',
  },
};

export default Footer;