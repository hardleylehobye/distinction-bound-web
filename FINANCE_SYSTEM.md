# 💰 Finance System Documentation

## Overview
The Finance Portal is an admin-only feature that tracks revenue, instructor payouts, and all transactions in the system.

## Features Implemented

### 1. **Shorter Ticket Codes** ✅
- Changed from long UUIDs like `TKT-1737123456789-abc123xyz` 
- To simple **6-digit codes** like `482916`
- Makes it easy for instructors to manually enter during attendance

### 2. **Finance Portal** ✅
Admin-only portal with 3 main sections:

#### 📊 Overview Tab
- **Total Revenue**: All money collected
- **Total Purchases**: Number of tickets sold
- **Total Enrollments**: Number of course enrollments
- **Active Instructors**: Instructors earning money
- **Instructor Earnings Summary**: Shows each instructor's revenue split
- **Recent Transactions**: Last 10 purchases

#### 💸 Instructor Payouts Tab
- Detailed breakdown per instructor
- Shows all their transactions
- **70% goes to instructor** (instructor_share)
- **30% goes to admin** (admin_share)
- Lists every student payment with dates

#### 📝 All Transactions Tab
- Complete transaction history
- Filterable by date (future enhancement)
- Shows: Date, Student, Email, Course, Amount, Payment Method, Ticket, Status

## Revenue Split Model

```
Student pays R100 for a session
├── R70 (70%) → Instructor
└── R30 (30%) → Admin/Platform
```

This is automatically calculated in the backend.

## Access

### For Admins:
1. Login as admin
2. Go to Admin Portal
3. Click **💰 Finance** button (green button in header)
4. View all financial data

### For Instructors:
- Cannot access Finance Portal
- Can only see their own courses and mark attendance

### For Students:
- Cannot access Finance Portal
- Can only purchase tickets and view their own purchases

## Technical Details

### Backend API Endpoints
- `GET /api/finance/overview` - Financial summary
- `GET /api/finance/instructor-payouts` - Detailed instructor earnings
- `GET /api/finance/transactions` - All transactions (with optional date filters)

### Database
All data stored in JSON files:
- `backend/data/purchases.json` - All ticket purchases
- `backend/data/courses.json` - Course data with instructor IDs
- `backend/data/enrollments.json` - Student enrollments
- `backend/data/users.json` - User information

### Ticket Number Generation
```javascript
// Generates random 6-digit number (100000-999999)
const generateTicketNumber = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
```

## Future Enhancements

### Suggested Features:
1. **Export to CSV/Excel** - Download financial reports
2. **Date Range Filters** - Filter transactions by date
3. **Payment Status Tracking** - Mark payouts as "Paid" or "Pending"
4. **Instructor Payout History** - Track when instructors were paid
5. **Automated Payout Calculations** - Monthly/weekly payout summaries
6. **Tax Reports** - Generate tax documents
7. **Refund Management** - Handle refunds and adjustments
8. **Revenue Charts** - Visual graphs of revenue over time

## Security Notes

- ✅ Only admins can access Finance Portal
- ✅ Route protection in App.js checks `accountRole !== 'admin'`
- ✅ Backend should add authentication middleware (future)
- ⚠️ Currently no backend auth - relies on frontend checks

## Usage Example

### Admin View:
```
Total Revenue: R2,500.00
Total Purchases: 25
Total Enrollments: 30
Active Instructors: 3

Instructor: Thabang Lehobye
├── Students: 10
├── Total Revenue: R1,000.00
├── Instructor Share (70%): R700.00
└── Admin Share (30%): R300.00
```

### Instructor Payout Detail:
```
Thabang Lehobye (thabangth2003@gmail.com)
Total Earned: R700.00

Transactions:
- 2026-01-20 | Formal Languages | John Doe | R100 → R70
- 2026-01-19 | Formal Languages | Jane Smith | R100 → R70
...
```

## Files Modified/Created

### New Files:
- `backend/routes/finance.js` - Finance API routes
- `src/pages/FinancePortal.js` - Finance UI component
- `FINANCE_SYSTEM.md` - This documentation

### Modified Files:
- `backend/routes/tickets.js` - Shorter ticket number generation
- `backend/server.js` - Added finance routes
- `src/services/api.js` - Added finance API methods
- `src/pages/AdminPortal.js` - Added Finance button
- `src/App.js` - Added Finance Portal route

## Testing

1. **Create some test purchases** (as student)
2. **Login as admin** (hardleylehobye@gmail.com)
3. **Click "💰 Finance"** button
4. **Verify**:
   - Overview shows correct totals
   - Instructor payouts show 70/30 split
   - Transactions list all purchases
   - Ticket numbers are 6 digits

## Notes

- Revenue split is hardcoded as 70/30 (can be made configurable)
- All calculations done in backend for security
- Frontend displays formatted currency (R format)
- Dates shown in South African format (en-ZA)
