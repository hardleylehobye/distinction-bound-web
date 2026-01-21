const express = require('express');
const router = express.Router();
const db = require('../db');

// Get financial overview
router.get('/overview', (req, res) => {
  try {
    const purchases = db.find('purchases');
    const courses = db.find('courses');
    const sessions = db.find('sessions');
    const enrollments = db.find('enrollments');
    const users = db.find('users');
    const payouts = db.find('payouts') || [];
    
    // Calculate total revenue (exclude test payments)
    const totalRevenue = purchases.reduce((sum, p) => {
      const isTest = p.is_test === true || p.payment_method === 'test' || p.status === 'test';
      return sum + (isTest ? 0 : (parseFloat(p.amount) || 0));
    }, 0);
    
    // Group by instructor with course and session details
    const instructorPayouts = {};
    let totalInstructorEarnings = 0;
    
    purchases.forEach(purchase => {
      const session = sessions.find(s => s.session_id === purchase.session_id);
      const course = courses.find(c => c.course_id === purchase.course_id);
      
      if (course && course.instructor_id && session) {
        const instructor = users.find(u => u.id === course.instructor_id);
        if (instructor) {
          if (!instructorPayouts[instructor.id]) {
            instructorPayouts[instructor.id] = {
              instructor_id: instructor.id,
              instructor_name: instructor.name,
              instructor_email: instructor.email,
              total_revenue: 0,
              instructor_share: 0,
              pending_payout: 0,
              paid_out: 0,
              courses: {}
            };
          }
          
          const isTest = purchase.is_test === true || purchase.payment_method === 'test' || purchase.status === 'test';
          const amount = isTest ? 0 : (parseFloat(purchase.amount) || 0);
          const instructorPercentage = parseFloat(session.instructor_payout_percentage || 70) / 100;
          const instructorEarned = amount * instructorPercentage;
          
          instructorPayouts[instructor.id].total_revenue += amount;
          instructorPayouts[instructor.id].instructor_share += instructorEarned;
          totalInstructorEarnings += instructorEarned;
          
          // Track by course
          if (!instructorPayouts[instructor.id].courses[course.course_id]) {
            instructorPayouts[instructor.id].courses[course.course_id] = {
              course_id: course.course_id,
              course_title: course.title,
              total_revenue: 0,
              total_earned: 0,
              sessions: {}
            };
          }
          
          // Track by session within course
          if (!instructorPayouts[instructor.id].courses[course.course_id].sessions[session.session_id]) {
            instructorPayouts[instructor.id].courses[course.course_id].sessions[session.session_id] = {
              session_id: session.session_id,
              session_title: session.title,
              session_date: session.date,
              session_venue: session.venue,
              instructor_percentage: session.instructor_payout_percentage || 70,
              revenue: 0,
              instructor_earned: 0,
              student_count: 0,
              purchases: []
            };
          }
          
          instructorPayouts[instructor.id].courses[course.course_id].total_revenue += amount;
          instructorPayouts[instructor.id].courses[course.course_id].total_earned += instructorEarned;
          instructorPayouts[instructor.id].courses[course.course_id].sessions[session.session_id].revenue += amount;
          instructorPayouts[instructor.id].courses[course.course_id].sessions[session.session_id].instructor_earned += instructorEarned;
          instructorPayouts[instructor.id].courses[course.course_id].sessions[session.session_id].student_count++;
          instructorPayouts[instructor.id].courses[course.course_id].sessions[session.session_id].purchases.push({
            student_name: purchase.user_name,
            amount: amount,
            date: purchase.purchased_at,
            ticket_id: purchase.ticket_id,
            is_test: isTest
          });
        }
      }
    });
    
    // Calculate what instructors have been paid
    Object.keys(instructorPayouts).forEach(instructorId => {
      const instructorPayoutHistory = payouts.filter(p => p.instructor_id === parseInt(instructorId));
      const totalPaid = instructorPayoutHistory.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
      
      instructorPayouts[instructorId].paid_out = totalPaid;
      instructorPayouts[instructorId].pending_payout = instructorPayouts[instructorId].instructor_share - totalPaid;
    });
    
    // Platform/Admin earnings = Total Revenue - Total Instructor Earnings
    const platformAdminEarnings = totalRevenue - totalInstructorEarnings;
    
    res.json({
      total_revenue: totalRevenue,
      total_purchases: purchases.length,
      total_enrollments: enrollments.length,
      total_instructor_earnings: totalInstructorEarnings,
      platform_admin_earnings: platformAdminEarnings,
      instructor_payouts: Object.values(instructorPayouts).map(payout => ({
        ...payout,
        courses: Object.values(payout.courses).map(course => ({
          ...course,
          sessions: Object.values(course.sessions)
        }))
      })),
      recent_transactions: purchases.slice(-10).reverse()
    });
  } catch (error) {
    console.error('Error fetching financial overview:', error);
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
});

// Get monthly summary
router.get('/monthly-summary', (req, res) => {
  try {
    const { year, month } = req.query;
    const purchases = db.find('purchases');
    const courses = db.find('courses');
    const sessions = db.find('sessions');
    const users = db.find('users');
    
    // Filter by month if provided
    let filteredPurchases = purchases;
    if (year && month) {
      filteredPurchases = purchases.filter(p => {
        const purchaseDate = new Date(p.purchased_at);
        return purchaseDate.getFullYear() === parseInt(year) && 
               purchaseDate.getMonth() === parseInt(month) - 1;
      });
    }
    
    const specialAdmin = users.find(u => u.special_admin === true);
    const INSTRUCTOR_SHARE = 0.70;
    const SPECIAL_ADMIN_SHARE = specialAdmin ? 0.20 : 0;
    const REGULAR_ADMIN_SHARE = 1 - INSTRUCTOR_SHARE - SPECIAL_ADMIN_SHARE;
    
    const totalRevenue = filteredPurchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    // Group by instructor
    const instructorSummaries = {};
    
    filteredPurchases.forEach(purchase => {
      const session = sessions.find(s => s.session_id === purchase.session_id);
      const course = courses.find(c => c.course_id === purchase.course_id);
      
      if (course && course.instructor_id && session) {
        const instructor = users.find(u => u.id === course.instructor_id);
        if (instructor) {
          if (!instructorSummaries[instructor.id]) {
            instructorSummaries[instructor.id] = {
              instructor_name: instructor.name,
              instructor_email: instructor.email,
              total_earned: 0,
              courses: {}
            };
          }
          
          const isTest = purchase.is_test === true || purchase.payment_method === 'test' || purchase.status === 'test';
          const amount = isTest ? 0 : (parseFloat(purchase.amount) || 0);
          const instructorEarned = amount * INSTRUCTOR_SHARE;
          
          instructorSummaries[instructor.id].total_earned += instructorEarned;
          
          if (!instructorSummaries[instructor.id].courses[course.course_id]) {
            instructorSummaries[instructor.id].courses[course.course_id] = {
              course_title: course.title,
              sessions: {}
            };
          }
          
          if (!instructorSummaries[instructor.id].courses[course.course_id].sessions[session.session_id]) {
            instructorSummaries[instructor.id].courses[course.course_id].sessions[session.session_id] = {
              session_title: session.title,
              session_date: session.date,
              earned: 0,
              students: []
            };
          }
          
          instructorSummaries[instructor.id].courses[course.course_id].sessions[session.session_id].earned += instructorEarned;
          instructorSummaries[instructor.id].courses[course.course_id].sessions[session.session_id].students.push({
            name: purchase.user_name,
            amount: amount,
            earned: instructorEarned,
            is_test: isTest
          });
        }
      }
    });
    
    res.json({
      period: year && month ? `${year}-${month.padStart(2, '0')}` : 'All Time',
      total_revenue: totalRevenue,
      special_admin_earned: totalRevenue * SPECIAL_ADMIN_SHARE,
      regular_admin_earned: totalRevenue * REGULAR_ADMIN_SHARE,
      instructors: Object.values(instructorSummaries).map(summary => ({
        ...summary,
        courses: Object.values(summary.courses).map(course => ({
          ...course,
          sessions: Object.values(course.sessions)
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    res.status(500).json({ error: 'Failed to fetch monthly summary' });
  }
});

// Get transactions by date range
router.get('/transactions', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let purchases = db.find('purchases');
    const courses = db.find('courses');
    
    // Filter by date if provided
    if (start_date) {
      purchases = purchases.filter(p => new Date(p.purchased_at) >= new Date(start_date));
    }
    if (end_date) {
      purchases = purchases.filter(p => new Date(p.purchased_at) <= new Date(end_date));
    }
    
    // Enrich with course data and mark test payments
    const enrichedTransactions = purchases.map(purchase => {
      const course = courses.find(c => c.course_id === purchase.course_id);
      const isTest = purchase.is_test === true || purchase.payment_method === 'test' || purchase.status === 'test';
      return {
        ...purchase,
        amount: isTest ? 0 : purchase.amount, // Show 0 for test payments
        is_test: isTest,
        course_title: course?.title,
        instructor_id: course?.instructor_id
      };
    });
    
    res.json(enrichedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
