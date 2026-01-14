# 🎓 Distinction Bound Program

A comprehensive educational platform for tutoring services, course management, and online payments.

## 🚀 Quick Deploy

### **Option 1: Netlify (Recommended)**
1. Click the button below to deploy instantly:
   [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/distinction-bound-program)

2. Or follow these steps:
   ```bash
   # 1. Build the app
   npm run build
   
   # 2. Push to GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   
   # 3. Deploy to Netlify
   # Go to netlify.com and connect your GitHub repo
   ```

### **Option 2: Manual Deploy**
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

## 📋 Features

- 🎓 **Course Management** - Create and manage educational courses
- 👥 **User Roles** - Student, Instructor, and Admin portals
- 💳 **Payment System** - PayFast integration for South African payments
- 📱 **Mobile Responsive** - Works on all devices
- 🔒 **Secure** - HTTPS and Firebase security
- 📊 **Analytics** - Track student progress

## 🛠️ Tech Stack

- **Frontend**: React 19, JavaScript
- **Backend**: Firebase (Firestore, Authentication)
- **Payments**: PayFast (South African EFT)
- **Hosting**: Netlify/Vercel/GitHub Pages
- **Styling**: Inline CSS (React)

## 🔧 Setup

### **Prerequisites**
- Node.js 18+
- Firebase account
- PayFast account (for payments)

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/yourusername/distinction-bound-program.git
cd distinction-bound-program

# Install dependencies
npm install

# Start development server
npm start
```

### **Environment Variables**
Create a `.env.local` file:
```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

REACT_APP_PAYFAST_MERCHANT_ID=your_payfast_merchant_id
REACT_APP_PAYFAST_MERCHANT_KEY=your_payfast_merchant_key
```

## 📱 Mobile App

The platform is fully responsive and works on:
- 📱 **Mobile phones**
- 💻 **Tablets**
- 🖥️ **Desktop computers**

## 💳 Payment Integration

### **PayFast Setup**
1. Register at [payfast.co.za](https://payfast.co.za)
2. Get merchant credentials
3. Add environment variables
4. Test with sandbox, then go live

### **Payment Flow**
1. User selects course session
2. Clicks "Purchase Ticket"
3. Redirects to PayFast
4. User pays via bank EFT
5. Money goes to instructor account
6. Ticket created automatically

## 🔒 Security

- ✅ **HTTPS** encryption (automatic with hosting)
- ✅ **Firebase Security Rules** for data protection
- ✅ **PayFast** secure payment processing
- ✅ **Input validation** and sanitization

## 📊 Analytics

Track your platform performance with:
- Firebase Analytics
- Netlify Analytics (if using Netlify)
- Google Analytics (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support:
- 📧 Email: support@distinctionboundprogram.com
- 📚 Documentation: Check the `DEPLOYMENT.md` file
- 🔗 Issues: Create an issue on GitHub

---

## 🎯 Ready to Launch Your Educational Platform!

Your Distinction Bound Program is ready to help students achieve academic excellence! 🚀
