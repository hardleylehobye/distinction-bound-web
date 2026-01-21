const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all courses
router.get('/', (req, res) => {
  try {
    const courses = db.find('courses');
    const sessions = db.find('sessions');
    
    // Attach sessions to each course
    const coursesWithSessions = courses.map(course => {
      const courseSessions = sessions.filter(session => session.course_id === course.course_id);
      return {
        ...course,
        sessions: courseSessions
      };
    });
    
    res.json(coursesWithSessions);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by ID
router.get('/:courseId', (req, res) => {
  try {
    const course = db.findOne('courses', { course_id: req.params.courseId });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create new course
router.post('/', (req, res) => {
  try {
    const { course_id, title, description, price } = req.body;
    const course = db.insert('courses', { course_id, title, description, price });
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/:courseId', (req, res) => {
  try {
    const updates = req.body;
    const course = db.update('courses', { course_id: req.params.courseId }, updates);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
router.delete('/:courseId', (req, res) => {
  try {
    const deleted = db.delete('courses', { course_id: req.params.courseId });
    if (!deleted) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

module.exports = router;
