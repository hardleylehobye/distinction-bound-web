# 📧 Email System Setup Instructions

## **Step 1: Update .env File** ⚠️ IMPORTANT

Open `backend/.env` and add these lines at the end:

```env
# Resend Email API
RESEND_API_KEY=re_Dq1oREmM_Cazy5xXKTtGtTfqY2NdneN5W
FROM_EMAIL=onboarding@resend.dev
```

**Your complete .env should look like:**
```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=distinction_bound
PORT=5000
NODE_ENV=development

# Resend Email API
RESEND_API_KEY=re_Dq1oREmM_Cazy5xXKTtGtTfqY2NdneN5W
FROM_EMAIL=onboarding@resend.dev
```

---

## **Step 2: Restart Backend Server**

After updating `.env`, restart your backend:

```powershell
cd "backend"
npm start
```

Or use the startup script:
```powershell
.\start-dev.ps1
```

---

## **✅ Email System is Now Active!**

### **Emails Sent Automatically:**

#### **1. New User Registration** 🎓
- **Trigger:** User signs in with Google for first time
- **Recipient:** New user
- **Content:** Welcome message, account details
- **Also:** Admin gets notification

#### **2. Course Enrollment** 📚
- **Trigger:** Student enrolls in a course
- **Recipient:** Student
- **Content:** Enrollment confirmation, course details
- **Also:** Instructor gets notification

#### **3. Payment Receipt** 🎫
- **Trigger:** Student purchases session ticket
- **Recipient:** Student
- **Content:** 
  - Payment confirmation
  - **6-digit ticket number** (large, easy to read)
  - Session details (date, venue, time)
  - Amount paid

#### **4. Instructor Notifications** 👨‍🏫
- **Trigger:** New student enrolls
- **Recipient:** Course instructor
- **Content:** Student name, course, enrollment date

#### **5. Admin Notifications** 💼
- **Trigger:** New user registers
- **Recipient:** Admin (you)
- **Content:** User details, registration time

---

## **Email Templates Included:**

All emails are professionally designed with:
- ✅ Distinction Bound branding (blue/gold colors)
- ✅ Responsive HTML design
- ✅ Clear call-to-action buttons
- ✅ Mobile-friendly layout
- ✅ Professional formatting

---

## **Test the Email System:**

### **Test 1: New User Registration**
1. Sign out from your app
2. Sign in with a NEW Google account
3. **Expected:** 
   - User gets welcome email
   - Admin (you) gets notification email

### **Test 2: Course Enrollment**
1. Login as student
2. Enroll in a course
3. **Expected:**
   - Student gets enrollment confirmation
   - Instructor gets new student notification

### **Test 3: Payment/Ticket**
1. Login as student
2. Purchase a session ticket
3. **Expected:**
   - Student gets payment receipt with ticket number
   - Email shows: Course, Session, Date, Venue, Amount, Ticket#

---

## **Resend Dashboard:**

Check your emails at: https://resend.com/emails

You can:
- View all sent emails
- Check delivery status
- See opens/clicks (with paid plan)
- Debug any issues

---

## **Free Tier Limits:**

- **100 emails/day** FREE forever
- **3,000 emails/month** FREE
- Perfect for development & testing
- Upgrade when you need more

---

## **Custom Domain (Optional - Later):**

Right now emails come from: `onboarding@resend.dev`

To use your own domain (e.g., `noreply@distinctionbound.com`):
1. Buy a domain
2. Add DNS records in Resend dashboard
3. Update `FROM_EMAIL` in `.env`

---

## **Troubleshooting:**

### **Emails Not Sending?**
1. Check `.env` has correct API key
2. Restart backend server
3. Check terminal for errors
4. Check Resend dashboard

### **Emails Going to Spam?**
- This is normal during testing
- Check your spam folder
- Use custom domain to improve deliverability

### **Need Help?**
- Check backend terminal logs
- Look for "✅ Email sent" or "❌ Email error"
- Check Resend dashboard for delivery status

---

## **What's Next?**

After you update `.env` and restart:

1. Test new user signup → Check welcome email
2. Test enrollment → Check confirmation email  
3. Test payment → Check receipt with ticket number
4. All working? ✅ Email system complete!

---

**Your API Key:** `re_Dq1oREmM_Cazy5xXKTtGtTfqY2NdneN5W`

**Keep this key secret!** Never commit to GitHub.
