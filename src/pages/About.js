import React from 'react';

function About() {
  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>About Distinction Bound Program</h1>
        <p style={styles.heroSubtitle}>
          Building a strong foundation for educational growth since 2021
        </p>
      </section>

      {/* Main Content */}
      <section style={styles.content}>
        <div style={styles.contentBlock}>
          <h2 style={styles.heading}>Our Mission</h2>
          <p style={styles.text}>
            The Distinction Bound Program is an initiative that provides tutoring services to high school and university students. It is designed to supplement the regular school curriculum and reinforce students' understanding of various subjects. The program is committed to fostering academic excellence and helping students achieve top grades, known as 'distinctions', in their studies.
          </p>
          <p style={styles.text}>
            The program is open to all students, irrespective of their current academic standing, underlining its inclusive approach.
          </p>
        </div>

        <div style={styles.contentBlock}>
          <h2 style={styles.heading}>Our Approach</h2>
          <p style={styles.text}>
            The Distinction Bound Program's focus is not just about imparting knowledge but also about instilling a commitment towards personal educational growth. In essence, it encourages students to take ownership of their learning journey, advocating for an investment in their own education. This is not purely about financial investment but more so about the commitment of time, focus, and dedication to learning.
          </p>
          <p style={styles.text}>
            The Distinction Bound Program offers comprehensive academic support, which includes providing learners with the necessary knowledge to excel in their subjects. This means that students are not just taught the curriculum, but are also trained to understand, analyze, and apply their knowledge effectively. This holistic educational approach empowers students to become independent thinkers and learners.
          </p>
        </div>

        <div style={styles.contentBlock}>
          <h2 style={styles.heading}>Beyond Traditional Tutoring</h2>
          <p style={styles.text}>
            The Distinction Bound Program extends beyond traditional academic tutoring. It offers guidance in terms of study techniques, time management skills, and even stress management strategies. This aims to build a strong foundation for learners' overall educational experience and their future academic pursuits.
          </p>
          <p style={styles.text}>
            Career advice is another vital element of this program. Students are given insights into various career paths that align with their subjects of interest and are guided on the academic requirements for these careers. This allows them to make informed decisions about their future.
          </p>
        </div>

        {/* Features Grid */}
        <div style={styles.featuresGrid}>
          <div style={styles.featureBox}>
            <div style={styles.featureIcon}>📚</div>
            <h3 style={styles.featureTitle}>Comprehensive Support</h3>
            <p style={styles.featureText}>
              Study techniques, time management, and stress management strategies
            </p>
          </div>

          <div style={styles.featureBox}>
            <div style={styles.featureIcon}>🎯</div>
            <h3 style={styles.featureTitle}>Exam Planners</h3>
            <p style={styles.featureText}>
              Structured timetables and time management tools
            </p>
          </div>

          <div style={styles.featureBox}>
            <div style={styles.featureIcon}>💼</div>
            <h3 style={styles.featureTitle}>Career Guidance</h3>
            <p style={styles.featureText}>
              Insights into career paths and academic requirements
            </p>
          </div>

          <div style={styles.featureBox}>
            <div style={styles.featureIcon}>👥</div>
            <h3 style={styles.featureTitle}>Expert Team</h3>
            <p style={styles.featureText}>
              Experienced tutors, volunteers, and motivational speakers
            </p>
          </div>
        </div>

        <div style={styles.contentBlock}>
          <h2 style={styles.heading}>Our Team</h2>
          <p style={styles.text}>
            Importantly, the program is spearheaded by a team of experienced tutors, volunteers, and motivational speakers. These individuals play a crucial role in inspiring the learners, addressing their queries, and providing them with a wider perspective on learning and life.
          </p>
          <div style={styles.teamImageContainer}>
            <img 
              src="/images/team-photo.jpeg" 
              alt="Distinction Bound Team" 
              style={styles.teamImage}
              onError={(e) => {
                // Fallback if image doesn't exist yet
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

        <div style={styles.contentBlock}>
          <h2 style={styles.heading}>Our Vision</h2>
          <p style={styles.text}>
            The overarching mission of the Distinction Bound Program is to normalize academic excellence among all students, whether they are currently high-performing or not. This means that the program aspires to create an environment where securing distinctions in academics becomes a common achievement for all students, rather than an exception for a select few.
          </p>
          <p style={styles.textHighlight}>
            The program aims to uplift the potential of each student, ensuring they have the resources, skills, and motivation to reach their academic goals.
          </p>
        </div>

        {/* Stats Section */}
        <div style={styles.statsSection}>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>2021</div>
            <div style={styles.statLabel}>Established</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>100+</div>
            <div style={styles.statLabel}>Students Helped</div>
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
  },
  content: {
    maxWidth: '900px',
    margin: '60px auto',
    padding: '0 20px',
  },
  contentBlock: {
    marginBottom: '50px',
  },
  heading: {
    fontSize: '32px',
    color: '#0051a8',
    marginBottom: '20px',
    borderBottom: '3px solid #ffd700',
    paddingBottom: '10px',
  },
  text: {
    fontSize: '18px',
    lineHeight: '1.8',
    color: '#333',
    marginBottom: '20px',
  },
  textHighlight: {
    fontSize: '20px',
    lineHeight: '1.8',
    color: '#0051a8',
    fontWeight: 'bold',
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#fff3cd',
    borderLeft: '4px solid #ffd700',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    margin: '50px 0',
  },
  featureBox: {
    backgroundColor: '#f8f9fa',
    padding: '30px 20px',
    borderRadius: '10px',
    textAlign: 'center',
  },
  featureIcon: {
    fontSize: '40px',
    marginBottom: '15px',
  },
  featureTitle: {
    fontSize: '18px',
    color: '#0051a8',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
  },
  statsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '30px',
    marginTop: '60px',
    padding: '40px 0',
    borderTop: '2px solid #e0e0e0',
    borderBottom: '2px solid #e0e0e0',
  },
  statBox: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#0051a8',
    marginBottom: '10px',
  },
  statLabel: {
    fontSize: '16px',
    color: '#666',
  },
  teamImageContainer: {
    marginTop: '30px',
    textAlign: 'center',
  },
  teamImage: {
    maxWidth: '100%',
    width: '100%',
    maxWidth: '900px',
    height: 'auto',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    margin: '0 auto',
    display: 'block',
  },
};

export default About;