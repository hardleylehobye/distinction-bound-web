# 💼 Owner-Controlled Payout System

## Overview
The platform owner (you) decides how much each instructor gets paid **per session**. The system automatically calculates Platform/Admin earnings as the remainder.

---

## How It Works

### 1. **When Creating a Session**
As admin, when you create a session in the Admin Portal, you set:
- Session title, date, venue
- **Price** (e.g., R100)
- **Instructor Payout %** (e.g., 70%)

### 2. **Automatic Calculations**
When a student purchases a ticket:
```
Student Pays: R100
├── Instructor Gets: R70 (70% as you set)
└── Platform/Admin Gets: R30 (remaining 30%)
```

### 3. **Flexible Per-Session Control**
You can set **different percentages for different sessions**:
- **Session 1**: Instructor gets 70%, Platform gets 30%
- **Session 2**: Instructor gets 65%, Platform gets 35%
- **Session 3**: Instructor gets 80%, Platform gets 20%

---

## Finance Portal Features

### 📊 Overview Tab
Shows:
- **Total Revenue**: All money collected
- **Total Instructor Earnings**: Sum of all instructor payouts
- **Platform/Admin Earnings**: Your total earnings (remainder)
- **Per Instructor Breakdown**:
  - Total earned
  - **Paid out** (what you've already sent them)
  - **Pending** (what you still owe them)

### 📅 Monthly Summary Tab
- Filter by month/year
- See exactly what each instructor earned
- Broken down by course and session
- Shows the payout % for each session

### 📝 All Transactions Tab
- Complete transaction history
- Every student payment recorded

---

## Payment Workflow

### Monthly Process:
1. **End of Month**: Check Finance Portal
2. **Review Pending Payouts**: See what each instructor is owed
3. **Pay Instructors**: Transfer money via bank/EFT/etc.
4. **Mark as Paid**: Record the payment in the system
5. **Platform Earnings**: Keep the remainder for yourself

---

## Example Scenario

**January 2026:**

**Instructor: Thabang Lehobye**
- Session 1 (70% payout): 5 students × R100 = R500 → Instructor gets R350
- Session 2 (65% payout): 3 students × R100 = R300 → Instructor gets R195
- **Total Earned**: R545
- **Already Paid**: R0
- **Pending**: R545

**Your Platform Earnings:**
- Session 1: R150 (30%)
- Session 2: R105 (35%)
- **Total**: R255

**End of Month Action:**
1. Pay Thabang R545 via bank transfer
2. Mark payment as "Paid" in Finance Portal
3. Keep your R255 for platform costs/profit

---

## Key Features

### ✅ Owner Control
- **You decide** instructor payout % per session
- **Flexible**: Different % for different sessions
- **Fair**: Transparent calculations

### ✅ Automatic Tracking
- System calculates everything automatically
- No manual spreadsheets needed
- Real-time pending/paid tracking

### ✅ Monthly Reconciliation
- Filter by any month
- See exactly what was earned when
- Track payment history

---

## Database Structure

### Sessions Table
```json
{
  "session_id": "session_123",
  "title": "Introduction to Algorithms",
  "price": 100,
  "instructor_payout_percentage": 70,  // ← Owner sets this
  "course_id": "course_1",
  "date": "2026-02-15"
}
```

### Payouts Table (Coming Soon)
```json
{
  "payout_id": "payout_456",
  "instructor_id": 3,
  "month": 1,
  "year": 2026,
  "amount_paid": 545,
  "payment_method": "bank_transfer",
  "payment_reference": "REF123456",
  "paid_by": "admin",
  "paid_at": "2026-02-01T10:00:00Z"
}
```

---

## Future Enhancements

### Phase 2 (Recommended):
1. **"Mark as Paid" Button** in Finance Portal
2. **Payment Reference Tracking** (EFT reference numbers)
3. **Payment History** per instructor
4. **Automated Invoices** for instructors
5. **CSV Export** for accounting

### Phase 3 (Advanced):
1. **Automated Payouts** via API (Yoco, PayFast)
2. **Tax Documents** generation
3. **Multi-currency** support
4. **Payment Reminders** for pending payouts

---

## How to Use

### Creating a Session with Custom Payout:
1. Login as Admin
2. Go to Admin Portal → Courses
3. Click "Sessions" on a course
4. Click "Create New Session"
5. Fill in details:
   - Title, Date, Venue, Price
   - **Instructor Payout %**: Enter 70 (or any % you want)
6. Save

### Viewing Finances:
1. Login as Admin
2. Click **💰 Finance** button
3. View:
   - **Overview**: Total earnings, instructor breakdown
   - **Monthly Summary**: Filter by month to see specific period
   - **Transactions**: All payments

### Paying Instructors (Manual Process):
1. Check Finance Portal at end of month
2. Note "Pending" amount for each instructor
3. Transfer money to their bank account
4. (Future) Mark as paid in system

---

## Important Notes

- ✅ **Default is 70%** if you don't specify
- ✅ **You can change % per session** (not per course)
- ✅ **Platform/Admin gets remainder** automatically
- ✅ **All calculations are automatic**
- ⚠️ **You must manually pay instructors** (for now)
- ⚠️ **Mark payments as "Paid"** to track properly (coming soon)

---

## Files Modified

### Backend:
- `backend/routes/sessions.js` - Added `instructor_payout_percentage` field
- `backend/routes/finance.js` - Updated calculations to use per-session %
- `backend/routes/payouts.js` - NEW: Track payment history
- `backend/data/payouts.json` - NEW: Store payment records

### Frontend:
- `src/pages/AdminPortal.js` - Added payout % field to session form
- `src/pages/FinancePortal.js` - Updated to show flexible payouts
- `src/services/api.js` - Added payout tracking methods

---

## Summary

**You are in full control!** 

- Set instructor payout % when creating sessions
- Platform/Admin automatically gets the rest
- Track everything in Finance Portal
- Pay instructors monthly based on what they earned
- Keep your platform earnings for costs/profit

This system is **fair, flexible, and transparent** for everyone! 🎉
