const express = require('express');
const router = express.Router();
const db = require('../db');

// Get enrollments for a user
router.get('/user/:uid', (req, res) => {
  try {
    const user = db.findOne('users', { uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const enrollments = db.find('enrollments', { student_id: user.id });
    
    // Enrich with session and course data
    const enriched = enrollments.map(enrollment => {
      const session = db.findOne('sessions', { session_id: enrollment.session_id });
      // Try to get course from enrollment.course_id first, then from session
      const courseId = enrollment.course_id || session?.course_id;
      const course = courseId ? db.findOne('courses', { course_id: courseId }) : null;
      
      return {
        ...enrollment,
        course_id: courseId,
        session_title: session?.title,
        date: session?.date,
        venue: session?.venue,
        course_title: course?.title
      };
    });
    
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Create new enrollment
router.post('/', (req, res) => {
  try {
    const { uid, session_id, enrollment_id, course_id } = req.body;
    
    const user = db.findOne('users', { uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const enrollment = db.insert('enrollments', {
      enrollment_id,
      student_id: user.id,
      session_id,
      course_id: course_id || null,
      status: 'active',
      enrolled_at: new Date().toISOString()
    });
    
    // Update enrolled count
    const session = db.findOne('sessions', { session_id });
    if (session) {
      db.update('sessions', { session_id }, { enrolled: (session.enrolled || 0) + 1 });
    }
    
    // Update course enrolled count if course_id provided
    if (course_id) {
      const course = db.findOne('courses', { course_id });
      if (course) {
        db.update('courses', { course_id }, { enrollmentCount: (course.enrollmentCount || 0) + 1 });
      }
    }
    
    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({ error: 'Failed to create enrollment' });
  }
});

module.exports = router;
