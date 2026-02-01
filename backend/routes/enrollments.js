const express = require('express');
const router = express.Router();
const db = require('../database');
const emailService = require('../services/emailService');

// Get enrollments for a user
router.get('/user/:uid', async (req, res) => {
  try {
    const user = await db.findOne('users', { uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const enrollments = await db.find('enrollments', { user_id: user.uid });
    
    // Enrich with session and course data
    const enriched = await Promise.all(enrollments.map(async enrollment => {
      const session = await db.findOne('sessions', { session_id: enrollment.session_id });
      // Try to get course from enrollment.course_id first, then from session
      const courseId = enrollment.course_id || session?.course_id;
      const course = courseId ? await db.findOne('courses', { course_id: courseId }) : null;
      
      return {
        ...enrollment,
        course_id: courseId,
        session_title: session?.title,
        date: session?.date,
        venue: session?.venue,
        course_title: course?.title
      };
    }));
    
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Create new enrollment
router.post('/', async (req, res) => {
  try {
    const { uid, session_id, enrollment_id, course_id } = req.body;
    
    const user = await db.findOne('users', { uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate session_id: if provided, check it exists; otherwise set to null
    let validSessionId = null;
    if (session_id) {
      const session = await db.findOne('sessions', { session_id });
      if (session) {
        validSessionId = session_id;
      } else {
        // Invalid session_id - this is a course enrollment, not session-specific
        console.log(`⚠️ Invalid session_id "${session_id}" provided, treating as course enrollment`);
        validSessionId = null;
      }
    }
    
    const enrollment = await db.insert('enrollments', {
      enrollment_id,
      user_id: uid,
      session_id: validSessionId,
      course_id: course_id || null,
      status: 'active'
    });
    
    // Update enrolled count only if valid session_id
    if (validSessionId) {
      const session = await db.findOne('sessions', { session_id: validSessionId });
      if (session) {
        await db.update('sessions', { session_id: validSessionId }, { enrolled: (session.enrolled || 0) + 1 });
      }
    }
    
    // Update course enrolled count if course_id provided (skip if column missing)
    if (course_id) {
      const course = await db.findOne('courses', { course_id: course_id });
      if (course) {
        try {
          await db.update('courses', { course_id: course_id }, { enrollmentCount: (course.enrollmentCount || 0) + 1 });
        } catch (err) {
          if (!err.message || !err.message.includes('Unknown column')) throw err;
          console.warn('Courses table missing enrollmentCount column; run: ALTER TABLE courses ADD COLUMN enrollmentCount INT DEFAULT 0;');
        }
        // Send enrollment confirmation email
        emailService.sendEnrollmentEmail(user, course).catch(err =>
          console.error('Failed to send enrollment email:', err)
        );
        // Notify instructor
        if (course.instructor_id) {
          const instructor = await db.findOne('users', { uid: course.instructor_id });
          if (instructor) {
            emailService.sendInstructorEnrollmentNotification(instructor, user, course).catch(err =>
              console.error('Failed to send instructor notification:', err)
            );
          }
        }
      }
    }

    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Error creating enrollment:', error);
    const msg = error.sqlMessage || error.message || 'Failed to create enrollment';
    res.status(500).json({ error: msg });
  }
});

module.exports = router;
