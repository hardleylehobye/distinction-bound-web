# 🎓 Distinction Bound - Online Learning Platform

A comprehensive learning management system with course management, ticket purchasing, and payment integration.

## ✨ Features

- 🔐 **Authentication**: Firebase Authentication with Google Sign-In
- 👥 **Multi-Role System**: Students, Instructors, Admins, Finance
- 📚 **Course Management**: Create and manage courses and sessions
- 🎫 **Ticket System**: Purchase tickets for sessions with Yoco payments
- 💳 **Payment Integration**: Secure payments via Yoco (South African payment gateway)
- 📧 **Email Notifications**: Automated emails via Resend
- 📊 **Finance Portal**: Track revenue, payouts, and transactions
- 📱 **Responsive Design**: Works on phones, tablets, and desktops

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Git
- Firebase account
- Yoco account (for payments)
- Resend account (for emails)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd distinction-bound-web
   ```

2. **Install dependencies:**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   cd ..
   ```

3. **Setup environment variables:**
   ```bash
   # Copy example files
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

4. **Configure your `.env` files:**
   - See [DEPLOYMENT.md](DEPLOYMENT.md) for details
   - Get API keys from respective services
   - Never commit `.env` files!

5. **Start development servers:**
   ```bash
   # Terminal 1 - Frontend (http://localhost:3000)
   npm start
   
   # Terminal 2 - Backend (http://localhost:5000)
   cd backend
   node server.js
   ```

## 📁 Project Structure

```
distinction-bound-web/
├── src/                    # Frontend React application
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── firebase.js        # Firebase configuration
├── backend/               # Backend Node.js server
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── data/             # JSON database (dev only)
│   └── server.js         # Express server
├── .env.example          # Frontend environment template
├── backend/.env.example  # Backend environment template
├── DEPLOYMENT.md         # Deployment guide
└── SECURITY.md           # Security documentation
```

## 🔒 Security

This project follows security best practices:

- ✅ All API keys in environment variables
- ✅ No secrets in Git history
- ✅ `.env` files gitignored
- ✅ Secure payment handling
- ✅ Input validation
- ✅ HTTPS in production

See [SECURITY.md](SECURITY.md) for detailed security information.

## 📖 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - How to deploy to production
- **[SECURITY.md](SECURITY.md)** - Security best practices
- **[EMAIL_SETUP_INSTRUCTIONS.md](EMAIL_SETUP_INSTRUCTIONS.md)** - Email configuration

## 🎯 Key Technologies

- **Frontend**: React, Styled Components
- **Backend**: Node.js, Express
- **Database**: JSON (dev), PostgreSQL (production recommended)
- **Authentication**: Firebase Auth
- **Payments**: Yoco Payment Gateway
- **Emails**: Resend API
- **Deployment**: Netlify, Heroku, Railway (flexible)

## 🧪 Testing Payments

### Test Mode (Shift+Click):
- Hold Shift while clicking "Purchase Ticket"
- Creates ticket instantly without Yoco
- Perfect for development

### Yoco Test Cards:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVV: Any 3 digits

## 👥 User Roles

### Student
- Browse courses
- Purchase tickets
- View purchased tickets
- Access course materials

### Instructor
- Create courses and sessions
- View enrollment
- Access finance dashboard

### Admin
- Full system access
- Manage users
- View all courses
- Access all portals

### Finance
- View revenue reports
- Track payouts
- Generate financial reports

## 🛠️ Development

### Running Tests:
```bash
npm test
```

### Building for Production:
```bash
npm run build
```

### Code Quality:
```bash
npm run lint
```

## 📊 Database

Currently using JSON files for development. For production:

1. Setup PostgreSQL or MySQL
2. Update `backend/db.js`
3. Run migrations
4. Update connection in `.env`

## 🚨 Important Notes

### DO NOT:
- ❌ Commit `.env` files
- ❌ Hardcode API keys
- ❌ Push database files with real data
- ❌ Use test keys in production

### DO:
- ✅ Use environment variables
- ✅ Rotate API keys regularly
- ✅ Backup database regularly
- ✅ Monitor error logs

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review error logs
3. Verify environment variables
4. Check API service status

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

- Firebase for authentication
- Yoco for payment processing
- Resend for email delivery
- React community

---

**Version:** 1.0.0  
**Last Updated:** January 21, 2026  
**Status:** Production Ready 🚀
