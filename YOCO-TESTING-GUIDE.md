# 🧪 Yoco Integration Testing Guide

## 🎯 **Testing Status: Ready for Local Testing**

The development server is running at **http://localhost:3000** - let's test the Yoco integration!

---

## 🔧 **Test Plan:**

### **Step 1: Basic Functionality Test**
1. **Open browser** → http://localhost:3000
2. **Login with Google** (should work now with fixed redirect handling)
3. **Navigate to Student Portal**
4. **Browse available courses**
5. **Click "Purchase Ticket"** on any session

### **Step 2: Yoco Modal Test**
1. **Payment modal should open** with Yoco as default option
2. **Check payment options:**
   - ✅ Yoco (selected by default)
   - ✅ PayFast (alternative option)
3. **Verify modal content:**
   - ✅ Payment amount displayed
   - ✅ User information shown
   - ✅ Test mode indicator

### **Step 3: Yoco Payment Flow Test**
1. **Select Yoco** payment method
2. **Click "Pay with Yoco"**
3. **Expected behavior:**
   - ✅ Loading state shows
   - ✅ "Redirecting to Yoco payment page..." message
   - ✅ Redirect to Yoco (if API key configured)
   - ⚠️ Error message (if no API key - this is expected)

---

## 🔧 **Expected Console Output:**

### **Successful Login:**
```
App: Checking authentication result...
App: Redirect result: null
App: Session data: {user: true, account: "student", active: "student"}
App: Setting existing user session: student
```

### **Payment Modal Open:**
```
Yoco Service: Test mode enabled
Yoco Service: Using test key: sk_test_...
```

### **Payment Attempt (No API Key):**
```
Yoco API Error: 401 Unauthorized
Payment failed: Invalid API key
```

---

## 🔧 **Current Setup Status:**

### **✅ Working Components:**
- **Google Login** - Fixed redirect handling
- **Student Portal** - Course browsing
- **Payment Modal** - Yoco/PayFast selection
- **Yoco Service** - API integration ready
- **Error Handling** - User-friendly messages

### **⚠️ Expected Limitations:**
- **Yoco API Key** - Not configured (will show error)
- **Live Payments** - Test mode only
- **Webhooks** - Not configured for local dev

---

## 🔧 **Testing Scenarios:**

### **Scenario 1: Successful Login Flow**
1. **Visit:** http://localhost:3000
2. **Click:** "Login with Google"
3. **Expected:** Login successful, redirect to student dashboard
4. **Console:** No redirect result errors

### **Scenario 2: Course Purchase Flow**
1. **Login** as student
2. **Browse** available courses
3. **Select** a course session
4. **Click:** "Purchase Ticket"
5. **Expected:** Yoco payment modal opens
6. **Verify:** Payment options and amount displayed

### **Scenario 3: Payment Method Selection**
1. **Open** payment modal
2. **Click:** Yoco option
3. **Expected:** Yoco selected (highlighted)
4. **Click:** PayFast option
5. **Expected:** PayFast selected (highlighted)

### **Scenario 4: Yoco Payment Attempt**
1. **Select** Yoco payment
2. **Click:** "Pay with Yoco"
3. **Expected:** 
   - Loading spinner
   - Error message about API key
   - Modal stays open for retry

---

## 🔧 **Debug Information:**

### **Check Environment Variables:**
```javascript
// In browser console
console.log('Yoco Test Mode:', yocoService.isTestMode());
console.log('Yoco API Key:', process.env.REACT_APP_YOCO_SECRET_KEY);
```

### **Check Yoco Service:**
```javascript
// Test card details
console.log(yocoService.getTestCardDetails());

// Amount formatting
console.log('R100 to cents:', yocoService.formatAmount(100));
console.log('10000 cents to R:', yocoService.parseAmount(10000));
```

---

## 🔧 **Next Steps After Testing:**

### **If All Tests Pass:**
1. **Get Yoco API keys** from Yoco dashboard
2. **Update .env file** with real keys
3. **Test live payments** (small amounts)
4. **Deploy to production**

### **If Issues Found:**
1. **Check console errors** in browser
2. **Verify Firebase configuration**
3. **Test Google login** separately
4. **Check network requests** in dev tools

---

## 🔧 **Test Checklist:**

### **✅ Login Flow:**
- [ ] Google login works
- [ ] No redirect result errors
- [ ] User redirected to correct dashboard
- [ ] Session data loaded properly

### **✅ Course Browsing:**
- [ ] Courses load from Firestore
- [ ] Sessions display correctly
- [ ] Purchase buttons show for available sessions
- [ ] Prices display correctly

### **✅ Payment Modal:**
- [ ] Modal opens on purchase click
- [ ] Yoco option selected by default
- [ ] PayFast option available
- [ ] Payment amount displayed
- [ ] User information shown

### **✅ Yoco Integration:**
- [ ] Yoco service initializes correctly
- [ ] Test mode enabled
- [ ] Error handling works
- [ ] Loading states show

### **✅ Error Handling:**
- [ ] API key errors handled gracefully
- [ ] Network errors show user messages
- [ ] Modal doesn't crash on errors
- [ ] User can retry failed payments

---

## 🎯 **Ready to Test!**

**🔧 Open your browser and navigate to:**
**http://localhost:3000**

**🧪 Follow the test scenarios above and verify everything works!**

**📝 Report any issues you find so we can fix them before deployment!** 🚀

**The Yoco integration is ready for testing!** 💳✨
