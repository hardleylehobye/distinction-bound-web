# 💳 Yoco Payment Integration Guide

## 🎯 **Overview**
Yoco is a leading South African payment gateway that offers secure online payments with ZAR support. This guide will help you integrate Yoco payments into your Distinction Bound Program.

## 🔧 **Integration Requirements**

### **1. Yoco Account Setup**
- Sign up for a Yoco merchant account
- Get your API keys (Test and Live)
- Configure payment gateway settings

### **2. API Keys**
- **Test Key:** `sk_test_...` (for development)
- **Live Key:** `sk_live_...` (for production)

### **3. Payment Flow**
1. Create checkout session
2. Redirect user to Yoco payment page
3. Handle payment success/failure
4. Update user payment status

---

## 🔧 **API Integration**

### **Create Checkout Endpoint**
```
POST https://payments.yoco.com/api/checkouts
```

### **Request Headers**
```javascript
{
  "Authorization": "Bearer <secret-key>",
  "Content-Type": "application/json"
}
```

### **Request Body**
```javascript
{
  "amount": 10000,  // Amount in cents (R100.00)
  "currency": "ZAR",
  "successUrl": "https://yoursite.com/payment/success",
  "cancelUrl": "https://yoursite.com/payment/cancelled",
  "failureUrl": "https://yoursite.com/payment/failed"
}
```

### **Response**
```javascript
{
  "id": "checkout_abc123",
  "status": "created",
  "amount": 10000,
  "currency": "ZAR",
  "redirectUrl": "https://c.yoco.com/checkout/abc123",
  "paymentId": null,
  "processingMode": "test" // or "live"
}
```

---

## 🔧 **Test Environment**

### **Test Card Details**
- **Card Number:** `4111 1111 1111 1111`
- **CVC:** Any 3 digits
- **Expiry:** Any future date
- **Name:** Any name

### **Test Mode**
- Use `sk_test_...` keys
- Transactions don't appear in sales history
- No real money is processed

---

## 🔧 **Integration Steps**

### **Step 1: Environment Variables**
```env
REACT_APP_YOCO_SECRET_KEY=sk_test_...
REACT_APP_YOCO_LIVE_KEY=sk_live_...
REACT_APP_YOCO_WEBHOOK_SECRET=webhook_secret_...
```

### **Step 2: Payment Service**
Create a service to handle Yoco API calls

### **Step 3: Payment Modal**
Build a modal component for payment selection

### **Step 4: Integration**
Integrate with student portal payment flow

### **Step 5: Testing**
Test with test cards and verify payment flow

---

## 🔧 **Security Considerations**

### **API Key Security**
- Never expose secret keys in client-side code
- Use environment variables for sensitive data
- Implement proper authentication on backend

### **Webhook Security**
- Verify webhook signatures
- Validate payment amounts
- Check payment status before updating

---

## 🔧 **Payment Methods Supported**

### **Credit/Debit Cards**
- Visa
- Mastercard
- American Express

### **Mobile Payments**
- SnapScan
- Zapper
- Masterpass

### **Other Methods**
- EFT (Electronic Funds Transfer)
- Instant EFT

---

## 🔧 **Error Handling**

### **Common Errors**
- **Invalid API Key:** Check your secret key
- **Invalid Amount:** Amount must be in cents
- **Currency Error:** Only ZAR is supported
- **Network Error:** Check internet connection

### **Error Codes**
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `500` - Server Error

---

## 🔧 **Best Practices**

### **User Experience**
- Show loading states during payment
- Provide clear error messages
- Offer multiple payment options
- Send payment confirmations

### **Security**
- Use HTTPS for all requests
- Validate payment amounts
- Implement webhook verification
- Keep API keys secure

### **Performance**
- Cache payment methods
- Optimize API calls
- Handle network timeouts
- Implement retry logic

---

## 🔧 **Next Steps**

### **Immediate Actions**
1. Set up Yoco merchant account
2. Get test API keys
3. Create payment service
4. Build payment modal
5. Integrate with student portal

### **Future Enhancements**
- Add subscription payments
- Implement payment history
- Add refund functionality
- Create payment analytics

---

## 🎯 **Ready to Integrate?**

**🔧 Follow these steps:**
1. **Set up Yoco account** and get API keys
2. **Create payment service** for API integration
3. **Build payment modal** component
4. **Integrate with student portal**
5. **Test payment flow** end-to-end

**💳 Your Distinction Bound Program will soon accept Yoco payments!** 💳✨

**Let's start building the integration!** 🚀
