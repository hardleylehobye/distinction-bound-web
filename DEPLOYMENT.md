# 🚀 Deployment Guide - Distinction Bound

## 🔒 Security Checklist

Before deploying, ensure all sensitive information is protected:

- [x] `.env` files are in `.gitignore`
- [x] API keys removed from code
- [x] Database files excluded from git
- [x] `.env.example` files created

## 📋 Environment Variables Setup

### Backend Environment Variables

Create `backend/.env` with these variables:

```env
# Database
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_secure_password
DB_NAME=distinction_bound

# Server
PORT=5000
NODE_ENV=production

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=your_verified_email@yourdomain.com

# Yoco Payment Gateway
YOCO_TEST_SECRET_KEY=sk_test_your_key
YOCO_TEST_PUBLIC_KEY=pk_test_your_key
# For production:
# YOCO_LIVE_SECRET_KEY=sk_live_your_key
# YOCO_LIVE_PUBLIC_KEY=pk_live_your_key
```

### Frontend Environment Variables

Create `.env` with these variables:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## 🛠️ Local Development Setup

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
   ```

3. **Setup environment variables:**
   ```bash
   # Copy example files
   cp .env.example .env
   cp backend/.env.example backend/.env
   
   # Edit the .env files with your actual keys
   ```

4. **Start development servers:**
   ```bash
   # Terminal 1 - Frontend
   npm start
   
   # Terminal 2 - Backend
   cd backend
   node server.js
   ```

## 🌐 Deployment Options

### Option 1: Heroku

**Backend:**
```bash
cd backend
heroku create your-app-backend
heroku config:set YOCO_TEST_SECRET_KEY=your_key
heroku config:set YOCO_TEST_PUBLIC_KEY=your_key
heroku config:set RESEND_API_KEY=your_key
# ... set all other env vars
git push heroku main
```

**Frontend:**
```bash
# Build
npm run build

# Deploy to Netlify/Vercel
# Or use Heroku:
heroku create your-app-frontend
git push heroku main
```

### Option 2: Netlify (Frontend) + Railway (Backend)

**Frontend on Netlify:**
1. Connect your GitHub repo
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push

**Backend on Railway:**
1. Connect your GitHub repo
2. Add environment variables
3. Deploy automatically

### Option 3: AWS / DigitalOcean

Upload your code and configure environment variables in your hosting panel.

## 🔐 Security Best Practices

### Never commit these files:
- `.env` files
- `backend/data/*.json` (user data)
- API keys or secrets
- Database credentials

### Before pushing to Git:
```bash
# Check what's being tracked
git status

# Make sure .env is not listed
git ls-files | grep .env

# If .env is tracked, remove it:
git rm --cached .env
git rm --cached backend/.env
```

### Rotating API Keys:
1. Generate new keys in respective platforms
2. Update `.env` files
3. Restart servers
4. Never share old keys

## 📊 Database Setup

For production, use a proper database instead of JSON files:

1. **PostgreSQL** (Recommended)
2. **MySQL**
3. **MongoDB**

Update `backend/db.js` to use a real database connection.

## 🧪 Testing Before Deployment

1. Test all payment flows
2. Verify email sending works
3. Check all API endpoints
4. Test on different devices
5. Verify environment variables are loaded

## 📞 Support

If you encounter issues:
- Check environment variables are set correctly
- Verify API keys are valid
- Check server logs for errors
- Ensure all dependencies are installed

## 🎯 Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Database backups automated
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics configured
- [ ] Domain configured
- [ ] Email sending verified
- [ ] Payment testing completed
- [ ] Mobile responsiveness checked
