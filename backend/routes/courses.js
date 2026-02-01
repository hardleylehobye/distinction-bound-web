const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all courses (with instructor name when instructor_id is set)
router.get('/', async (req, res) => {
  try {
    const courses = await db.find('courses');
    const sessions = await db.find('sessions');
    
    const coursesWithSessions = await Promise.all(courses.map(async (course) => {
      const rawSessions = sessions.filter(session => session.course_id === course.course_id);
      const courseSessions = rawSessions.map(s => ({
        ...s,
        time: s.start_time && s.end_time
          ? `${String(s.start_time).slice(0, 5)} - ${String(s.end_time).slice(0, 5)}`
          : (s.start_time ? String(s.start_time).slice(0, 5) : ''),
        start_time: s.start_time ? String(s.start_time).slice(0, 5) : null,
        end_time: s.end_time ? String(s.end_time).slice(0, 5) : null
      }));
      let instructorName = null;
      let instructorEmail = null;
      if (course.instructor_id) {
        const instructor = await db.findOne('users', { uid: course.instructor_id });
        if (instructor) {
          instructorName = instructor.name;
          instructorEmail = instructor.email;
        }
      }
      return {
        ...course,
        id: course.course_id,
        instructorId: course.instructor_id,
        instructorName: instructorName || null,
        instructorEmail: instructorEmail || null,
        enrollmentCount: course.enrollmentCount || 0,
        sessions: courseSessions
      };
    }));
    
    res.json(coursesWithSessions);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by ID
router.get('/:courseId', async (req, res) => {
  try {
    const course = await db.findOne('courses', { course_id: req.params.courseId });
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
router.post('/', async (req, res) => {
  try {
    const { course_id, title, description, price, instructor_id, visibility } = req.body;
    
    // If no instructor assigned, find default admin "lehloholonolo"
    let finalInstructorId = instructor_id;
    if (!finalInstructorId) {
      // Search for admin user with name containing "lehloholonolo" (case-insensitive)
      const allUsers = await db.find('users');
      const defaultAdmin = allUsers.find(u => 
        (u.name && u.name.toLowerCase().includes('lehloholonolo')) ||
        (u.email && u.email.toLowerCase().includes('lehloholonolo')) ||
        (u.role === 'admin' && u.special_admin === true)
      );
      
      if (defaultAdmin) {
        finalInstructorId = defaultAdmin.uid;
        console.log(`📌 No instructor assigned, using default admin: ${defaultAdmin.name} (${defaultAdmin.uid})`);
      } else {
        // Fallback: find any admin user
        const anyAdmin = allUsers.find(u => u.role === 'admin');
        if (anyAdmin) {
          finalInstructorId = anyAdmin.uid;
          console.log(`📌 Using fallback admin: ${anyAdmin.name} (${anyAdmin.uid})`);
        }
      }
    }
    
    const courseData = { 
      course_id, 
      title, 
      description, 
      price,
      visibility: visibility || 'public'
    };
    
    // Only add instructor_id if we have one
    if (finalInstructorId) {
      courseData.instructor_id = finalInstructorId;
    }
    
    const course = await db.insert('courses', courseData);
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/:courseId', async (req, res) => {
  try {
    const courseId = decodeURIComponent(req.params.courseId).trim(); // Decode and trim whitespace
    
    console.log(`✏️ Update request for course_id: "${courseId}"`);
    
    // Filter out fields that don't exist in the database table
    // Only allow: title, description, price, visibility, instructor_id
    // Remove: id, course_id, sessions, enrollmentCount, instructorName, instructorEmail, image, and other frontend-only fields
    const allowedFields = ['title', 'description', 'price', 'visibility', 'instructor_id'];
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Handle instructor_id from frontend (might be sent as instructorId)
    if (req.body.instructorId && !updates.instructor_id) {
      updates.instructor_id = req.body.instructorId;
    }
    
    // If instructor_id is being set to empty/null and no instructor provided, set default admin
    if (updates.instructor_id === '' || updates.instructor_id === null || updates.instructor_id === undefined) {
      const allUsers = await db.find('users');
      const defaultAdmin = allUsers.find(u => 
        (u.name && u.name.toLowerCase().includes('lehloholonolo')) ||
        (u.email && u.email.toLowerCase().includes('lehloholonolo')) ||
        (u.role === 'admin' && u.special_admin === true)
      );
      
      if (defaultAdmin) {
        updates.instructor_id = defaultAdmin.uid;
        console.log(`📌 No instructor assigned, using default admin: ${defaultAdmin.name} (${defaultAdmin.uid})`);
      } else {
        // Fallback: find any admin user
        const anyAdmin = allUsers.find(u => u.role === 'admin');
        if (anyAdmin) {
          updates.instructor_id = anyAdmin.uid;
          console.log(`📌 Using fallback admin: ${anyAdmin.name} (${anyAdmin.uid})`);
        }
      }
    }
    
    // Convert price to number if it's a string
    if (updates.price !== undefined) {
      updates.price = parseFloat(updates.price) || 0;
    }
    
    console.log(`✏️ Filtered updates:`, updates);
    
    // First, check if course exists
    const existingCourse = await db.findOne('courses', { course_id: courseId });
    if (!existingCourse) {
      // Try case-insensitive search as fallback
      const allCourses = await db.find('courses');
      const caseInsensitiveMatch = allCourses.find(c => 
        c.course_id && c.course_id.toLowerCase() === courseId.toLowerCase()
      );
      
      if (caseInsensitiveMatch) {
        console.log(`✏️ Found case-insensitive match, using: "${caseInsensitiveMatch.course_id}"`);
        
        // If instructor_id is not being updated, preserve existing one or set default
        if (!updates.instructor_id && !caseInsensitiveMatch.instructor_id) {
          const allUsers = await db.find('users');
          const defaultAdmin = allUsers.find(u => 
            (u.name && u.name.toLowerCase().includes('lehloholonolo')) ||
            (u.email && u.email.toLowerCase().includes('lehloholonolo')) ||
            (u.role === 'admin' && u.special_admin === true)
          );
          if (defaultAdmin) {
            updates.instructor_id = defaultAdmin.uid;
            console.log(`📌 Preserving/assigning default admin: ${defaultAdmin.name} (${defaultAdmin.uid})`);
          }
        }
        
        const course = await db.update('courses', { course_id: caseInsensitiveMatch.course_id }, updates);
        if (!course) {
          return res.status(500).json({ error: 'Failed to update course' });
        }
        return res.json(course);
      }
      
      return res.status(404).json({ error: `Course not found: ${courseId}` });
    }
    
    // If instructor_id is not being updated, preserve existing one or set default
    if (!updates.instructor_id) {
      if (existingCourse.instructor_id) {
        // Preserve existing instructor_id
        updates.instructor_id = existingCourse.instructor_id;
        console.log(`📌 Preserving existing instructor_id: ${existingCourse.instructor_id}`);
      } else {
        // No instructor assigned, set default admin
        const allUsers = await db.find('users');
        const defaultAdmin = allUsers.find(u => 
          (u.name && u.name.toLowerCase().includes('lehloholonolo')) ||
          (u.email && u.email.toLowerCase().includes('lehloholonolo')) ||
          (u.role === 'admin' && u.special_admin === true)
        );
        if (defaultAdmin) {
          updates.instructor_id = defaultAdmin.uid;
          console.log(`📌 Assigning default admin: ${defaultAdmin.name} (${defaultAdmin.uid})`);
        }
      }
    }
    
    const course = await db.update('courses', { course_id: courseId }, updates);
    if (!course) {
      return res.status(500).json({ error: 'Failed to update course' });
    }
    
    console.log(`✅ Successfully updated course: ${courseId}`);
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: error.message || 'Failed to update course' });
  }
});

// Delete course
router.delete('/:courseId', async (req, res) => {
  try {
    const courseId = decodeURIComponent(req.params.courseId).trim(); // Decode and trim whitespace
    
    console.log(`🗑️ Delete request for course_id: "${courseId}"`);
    console.log(`🗑️ Course ID length: ${courseId.length}`);
    
    // Get all courses first for debugging
    const allCourses = await db.find('courses');
    console.log('🗑️ Available course_ids in database:');
    allCourses.forEach(c => {
      console.log(`  - "${c.course_id}" (length: ${c.course_id.length})`);
    });
    
    // First, check if course exists
    const course = await db.findOne('courses', { course_id: courseId });
    if (!course) {
      // Try case-insensitive search as fallback
      const caseInsensitiveMatch = allCourses.find(c => 
        c.course_id && c.course_id.toLowerCase() === courseId.toLowerCase()
      );
      
      if (caseInsensitiveMatch) {
        console.log(`🗑️ Found case-insensitive match, using: "${caseInsensitiveMatch.course_id}"`);
        // Use the actual course_id from database
        return await deleteCourseWithId(caseInsensitiveMatch.course_id, res, db);
      }
      
      return res.status(404).json({ 
        error: `Course not found: ${courseId}`,
        available_courses: allCourses.map(c => c.course_id)
      });
    }
    
    // Course found, proceed with deletion
    return await deleteCourseWithId(courseId, res, db);
  } catch (error) {
    console.error('Error deleting course:', error);
    
    // Check for foreign key constraint errors
    if (error.code === '23503' || error.message?.includes('foreign key')) {
      return res.status(400).json({ 
        error: 'Cannot delete course: It has related data that could not be deleted. Please contact support.' 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to delete course' });
  }
});

// Helper function to delete course and related data
async function deleteCourseWithId(courseId, res, db) {
  try {
    // Get all sessions for this course
    const sessions = await db.find('sessions', { course_id: courseId });
    const sessionIds = sessions.map(s => s.session_id);
    
    console.log(`🗑️ Found ${sessions.length} sessions for course ${courseId}`);
    
    // Delete related data in order (respecting foreign key constraints)
    // NOTE: Tickets/purchases are NOT deleted - they are financial records for clients
    
    // 1. Delete attendance records for sessions
    for (const sessionId of sessionIds) {
      try {
        const attendanceRecords = await db.find('attendance', { session_id: sessionId });
        for (const record of attendanceRecords) {
          await db.delete('attendance', { id: record.id });
        }
      } catch (err) {
        console.log(`Note: Could not delete attendance for session ${sessionId}:`, err.message);
      }
    }
    
    // 2. Delete notes and videos for sessions
    for (const sessionId of sessionIds) {
      try {
        const notes = await db.find('notes', { session_id: sessionId });
        for (const note of notes) {
          await db.delete('notes', { id: note.id });
        }
        const videos = await db.find('videos', { session_id: sessionId });
        for (const video of videos) {
          await db.delete('videos', { id: video.id });
        }
      } catch (err) {
        console.log(`Note: Could not delete materials for session ${sessionId}:`, err.message);
      }
    }
    
    // 3. Delete enrollments (both session and course level)
    try {
      const enrollments = await db.find('enrollments', { course_id: courseId });
      for (const enrollment of enrollments) {
        await db.delete('enrollments', { enrollment_id: enrollment.enrollment_id });
      }
    } catch (err) {
      console.log(`Note: Could not delete enrollments:`, err.message);
    }
    
    // 4. Delete sessions
    for (const session of sessions) {
      await db.delete('sessions', { session_id: session.session_id });
    }
    
    // 5. Finally, delete the course
    // Note: Purchases/tickets are preserved as financial records
    const deleted = await db.delete('courses', { course_id: courseId });
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete course' });
    }
    
    console.log(`✅ Successfully deleted course: ${courseId}`);
    res.json({ message: 'Course deleted successfully. Note: Purchase tickets are preserved as financial records.' });
  } catch (error) {
    console.error('Error in deleteCourseWithId:', error);
    throw error;
  }
}

// Assign default instructor to courses without one
router.post('/assign-default-instructor', async (req, res) => {
  try {
    console.log('🔍 Finding default admin "lehloholonolo"...');
    const allUsers = await db.find('users');
    
    const defaultAdmin = allUsers.find(u => 
      (u.name && u.name.toLowerCase().includes('lehloholonolo')) ||
      (u.email && u.email.toLowerCase().includes('lehloholonolo')) ||
      (u.role === 'admin' && u.special_admin === true)
    );
    
    let adminToUse;
    if (!defaultAdmin) {
      // Fallback: find any admin user
      const anyAdmin = allUsers.find(u => u.role === 'admin');
      if (!anyAdmin) {
        return res.status(404).json({ error: 'No admin user found!' });
      }
      console.log(`📌 Using fallback admin: ${anyAdmin.name} (${anyAdmin.uid})`);
      adminToUse = anyAdmin;
    } else {
      console.log(`✅ Found default admin: ${defaultAdmin.name} (${defaultAdmin.uid})`);
      adminToUse = defaultAdmin;
    }
    
    console.log('\n🔍 Finding courses without instructor_id...');
    const allCourses = await db.find('courses');
    const coursesWithoutInstructor = allCourses.filter(c => !c.instructor_id);
    
    console.log(`Found ${coursesWithoutInstructor.length} courses without instructor`);
    
    if (coursesWithoutInstructor.length === 0) {
      return res.json({ 
        message: 'All courses already have instructors assigned!',
        updated: 0 
      });
    }
    
    console.log('\n📝 Assigning default instructor to courses...');
    let updated = 0;
    const updatedCourses = [];
    
    for (const course of coursesWithoutInstructor) {
      try {
        await db.update('courses', { course_id: course.course_id }, { 
          instructor_id: adminToUse.uid 
        });
        console.log(`  ✅ Assigned "${course.title}" to ${adminToUse.name}`);
        updatedCourses.push(course.title);
        updated++;
      } catch (error) {
        console.error(`  ❌ Failed to update "${course.title}":`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully assigned instructor to ${updated} courses!`);
    res.json({ 
      message: `Successfully assigned instructor to ${updated} courses!`,
      updated,
      instructor: adminToUse.name,
      courses: updatedCourses
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message || 'Failed to assign default instructor' });
  }
});

module.exports = router;
