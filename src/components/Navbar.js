import React from 'react';

function Navbar({ currentPage, setCurrentPage, userRole }) {
  const handleDashboardClick = () => {
    if (userRole === 'student') {
      setCurrentPage('student-portal');
    } else if (userRole === 'admin') {
      setCurrentPage('admin-portal');
    } else if (userRole === 'instructor') {
      setCurrentPage('instructor-dashboard');
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.logo} onClick={() => setCurrentPage('home')}>
          <div style={styles.logoIcon}>🎓</div>
          <div>
            <h2 style={styles.logoText}>Distinction Bound</h2>
            <p style={styles.logoSubtext}>Program</p>
          </div>
        </div>
        
        <ul style={styles.navLinks}>
          <li style={styles.navItem} onClick={() => setCurrentPage('home')}>
            <span style={currentPage === 'home' ? styles.activeLink : styles.link}>Home</span>
          </li>
          <li style={styles.navItem} onClick={() => setCurrentPage('about')}>
            <span style={currentPage === 'about' ? styles.activeLink : styles.link}>About</span>
          </li>
          <li style={styles.navItem} onClick={() => setCurrentPage('courses')}>
            <span style={currentPage === 'courses' ? styles.activeLink : styles.link}>Courses</span>
          </li>
          <li style={styles.navItem} onClick={() => setCurrentPage('contact')}>
            <span style={currentPage === 'contact' ? styles.activeLink : styles.link}>Contact</span>
          </li>
          
          {!userRole && (
            <li style={styles.navItem}>
              <button 
                style={styles.button}
                onClick={() => setCurrentPage('login')}
              >
                Login
              </button>
            </li>
          )}
          
          {userRole === 'student' && (
            <li style={styles.navItem}>
              <button 
                style={styles.button}
                onClick={handleDashboardClick}
              >
                My Dashboard
              </button>
            </li>
          )}
          
          {userRole === 'admin' && (
            <li style={styles.navItem}>
              <button 
                style={styles.button}
                onClick={handleDashboardClick}
              >
                Admin Panel
              </button>
            </li>
          )}
          
          {userRole === 'instructor' && (
            <li style={styles.navItem}>
              <button 
                style={styles.button}
                onClick={handleDashboardClick}
              >
                Instructor Dashboard
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: '#0051a8',
    padding: '1rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    fontSize: '32px',
    color: '#ffd700',
  },
  logoText: {
    color: '#ffd700',
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    lineHeight: '1',
  },
  logoSubtext: {
    color: '#ffd700',
    margin: '0',
    fontSize: '14px',
    fontWeight: 'normal',
    opacity: 0.9,
  },
  navLinks: {
    listStyle: 'none',
    display: 'flex',
    gap: '30px',
    margin: 0,
    padding: 0,
    alignItems: 'center',
  },
  navItem: {
    cursor: 'pointer',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    transition: 'color 0.3s',
  },
  activeLink: {
    color: '#ffd700',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#ffd700',
    color: '#0051a8',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '25px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default Navbar;