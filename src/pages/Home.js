import React from 'react';

function Home({ setCurrentPage }) {

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Normalizing Academic Excellence Among All Students
          </h1>
          <p style={styles.heroSubtitle}>
            We provide comprehensive tutoring services to help high school and university students achieve distinctions and reach their full academic potential.
          </p>
          <div style={styles.heroButtons}>
            <button 
              style={styles.primaryButton}
              onClick={() => setCurrentPage('courses')}
            >
              Browse Courses
            </button>
            <button 
              style={styles.secondaryButton}
              onClick={() => setCurrentPage('about')}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <h2 style={styles.sectionTitle}>Why Choose Distinction Bound?</h2>
        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <div style={styles.icon}>📚</div>
            <h3 style={styles.featureTitle}>Expert Tutoring</h3>
            <p style={styles.featureText}>
              Learn from experienced tutors who are passionate about your success
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>🎯</div>
            <h3 style={styles.featureTitle}>Exam Preparation</h3>
            <p style={styles.featureText}>
              Comprehensive exam prep with planners, timetables, and study strategies
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>👥</div>
            <h3 style={styles.featureTitle}>Small Group Classes</h3>
            <p style={styles.featureText}>
              Personalized attention in focused group sessions
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>💡</div>
            <h3 style={styles.featureTitle}>Study Tools</h3>
            <p style={styles.featureText}>
              Access exam planners, structured timetables, and time management tools
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>🏆</div>
            <h3 style={styles.featureTitle}>Proven Results</h3>
            <p style={styles.featureText}>
              Join students who have achieved distinctions through our program
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>🎓</div>
            <h3 style={styles.featureTitle}>Career Guidance</h3>
            <p style={styles.featureText}>
              Get insights into career paths and academic requirements
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Ready to Excel?</h2>
        <p style={styles.ctaText}>
          Join the Distinction Bound Program and start your journey to academic excellence today.
        </p>
        <button 
          style={styles.ctaButton}
          onClick={() => setCurrentPage('courses')}
        >
          View Available Courses
        </button>
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
  },
  hero: {
    background: 'linear-gradient(135deg, #0051a8 0%, #003d82 100%)',
    color: 'white',
    padding: '100px 20px',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '20px',
    lineHeight: '1.2',
  },
  heroSubtitle: {
    fontSize: '20px',
    marginBottom: '40px',
    lineHeight: '1.6',
    opacity: 0.9,
  },
  heroButtons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#ffd700',
    color: '#0051a8',
    border: 'none',
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'transform 0.3s',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid white',
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'transform 0.3s',
  },
  features: {
    maxWidth: '1200px',
    margin: '80px auto',
    padding: '0 20px',
  },
  sectionTitle: {
    fontSize: '36px',
    textAlign: 'center',
    marginBottom: '60px',
    color: '#0051a8',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
  },
  featureCard: {
    backgroundColor: '#f8f9fa',
    padding: '40px 30px',
    borderRadius: '15px',
    textAlign: 'center',
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '24px',
    color: '#0051a8',
    marginBottom: '15px',
  },
  featureText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6',
  },
  cta: {
    backgroundColor: '#ffd700',
    padding: '80px 20px',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: '36px',
    color: '#0051a8',
    marginBottom: '20px',
  },
  ctaText: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '40px',
    maxWidth: '600px',
    margin: '0 auto 40px',
  },
  ctaButton: {
    backgroundColor: '#0051a8',
    color: 'white',
    border: 'none',
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '30px',
    cursor: 'pointer',
  },
};

export default Home;