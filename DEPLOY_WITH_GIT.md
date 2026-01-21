# 🚀 Deploy with Git - Easy Push-to-Deploy

## Option 1: Heroku (Recommended for Git Deploy)

### Prerequisites
```bash
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli
# Or: winget install Heroku.HerokuCLI
```

### Deploy Backend to Heroku

1. **Login to Heroku:**
```bash
heroku login
```

2. **Create Heroku app for backend:**
```bash
cd "C:\Users\MC\OneDrive\Desktop\distinction bound\distinction-bound-web"

# Create app
heroku create distinction-bound-backend

# Add Node.js buildpack
heroku buildpacks:add heroku/nodejs -a distinction-bound-backend
```

3. **Set environment variables:**
```bash
# Set all your backend environment variables
heroku config:set NODE_ENV=production -a distinction-bound-backend
heroku config:set PORT=5000 -a distinction-bound-backend
heroku config:set YOCO_TEST_SECRET_KEY=your_key -a distinction-bound-backend
heroku config:set YOCO_TEST_PUBLIC_KEY=your_key -a distinction-bound-backend
heroku config:set RESEND_API_KEY=your_key -a distinction-bound-backend
heroku config:set FROM_EMAIL=your_email -a distinction-bound-backend
```

4. **Create Procfile for backend:**
```bash
echo "web: node server.js" > backend/Procfile
```

5. **Push ONLY backend to Heroku:**
```bash
# Push backend subdirectory to Heroku
git subtree push --prefix backend heroku main

# Or if that doesn't work:
git push heroku `git subtree split --prefix backend main`:refs/heads/main --force
```

### Deploy Frontend to Heroku

1. **Create Heroku app for frontend:**
```bash
# Create frontend app
heroku create distinction-bound-frontend

# Add buildpack
heroku buildpacks:add heroku/nodejs -a distinction-bound-frontend
```

2. **Set environment variables:**
```bash
heroku config:set REACT_APP_FIREBASE_API_KEY=your_key -a distinction-bound-frontend
heroku config:set REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain -a distinction-bound-frontend
heroku config:set REACT_APP_FIREBASE_PROJECT_ID=your_id -a distinction-bound-frontend
heroku config:set REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket -a distinction-bound-frontend
heroku config:set REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_id -a distinction-bound-frontend
heroku config:set REACT_APP_FIREBASE_APP_ID=your_id -a distinction-bound-frontend
```

3. **Push frontend to Heroku:**
```bash
git push heroku main
```

---

## Option 2: Render.com (Git Deploy)

### Deploy Backend

1. **Go to:** https://render.com
2. **Sign up/Login** with your GitHub account
3. **New Web Service:**
   - Connect repository: `hardleylehobye/distinction-bound-web`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Add environment variables
4. **Click Create Web Service**

### Deploy Frontend

1. **New Static Site:**
   - Connect repository: `hardleylehobye/distinction-bound-web`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`
   - Add environment variables
2. **Click Create Static Site**

**Automatic Deployments:** Every `git push` to main will redeploy!

---

## Option 3: Railway.app (Git Deploy)

### Quick Deploy

1. **Go to:** https://railway.app
2. **Login with GitHub**
3. **New Project → Deploy from GitHub:**
   - Select: `hardleylehobye/distinction-bound-web`
   - Railway detects Node.js automatically
4. **Configure:**
   - For backend: Set root directory to `backend`
   - Add environment variables
5. **Done!** Railway deploys on every push

---

## Option 4: Vercel (Frontend Only - Git Deploy)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

**Auto-deploys on git push!**

---

## Option 5: Netlify (Frontend - Git Deploy)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Production deploy
netlify deploy --prod
```

**Auto-deploys on git push!**

---

## Option 6: DigitalOcean App Platform (Git Deploy)

1. **Go to:** https://cloud.digitalocean.com/apps
2. **Create App:**
   - Connect GitHub: `hardleylehobye/distinction-bound-web`
   - DigitalOcean auto-detects Node.js
3. **Configure resources:**
   - Backend: Select `backend` folder
   - Frontend: Root folder
4. **Add environment variables**
5. **Deploy!**

**Auto-deploys on git push!**

---

## The Easiest: Railway (My Recommendation)

Railway is the simplest git-based deployment:

1. Go to: https://railway.app
2. Click "New Project"
3. Click "Deploy from GitHub repo"
4. Select: `hardleylehobye/distinction-bound-web`
5. Add environment variables
6. Done!

**From now on:** Just `git push origin main` and Railway auto-deploys! 🚀

---

## Quick Deploy Script

Create `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying to production..."

# Commit changes
git add .
git commit -m "Deploy: $(date +%Y-%m-%d_%H:%M:%S)"

# Push to GitHub (triggers auto-deploy)
git push origin main

echo "✅ Deployed! Check your hosting platform for status."
```

Make it executable:
```bash
chmod +x deploy.sh
```

Deploy with:
```bash
./deploy.sh
```

---

## Environment Variables Checklist

### Backend (.env)
- [ ] YOCO_TEST_SECRET_KEY
- [ ] YOCO_TEST_PUBLIC_KEY
- [ ] RESEND_API_KEY
- [ ] FROM_EMAIL
- [ ] NODE_ENV=production
- [ ] PORT=5000

### Frontend (.env)
- [ ] REACT_APP_FIREBASE_API_KEY
- [ ] REACT_APP_FIREBASE_AUTH_DOMAIN
- [ ] REACT_APP_FIREBASE_PROJECT_ID
- [ ] REACT_APP_FIREBASE_STORAGE_BUCKET
- [ ] REACT_APP_FIREBASE_MESSAGING_SENDER_ID
- [ ] REACT_APP_FIREBASE_APP_ID

---

## After First Deploy

Update your frontend API URL in `src/services/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

Then add to frontend environment variables:
```bash
REACT_APP_API_URL=https://your-backend-url.com/api
```

---

## Common Issues

### "Failed to push"
```bash
git push heroku main --force
```

### "Buildpack not detected"
```bash
heroku buildpacks:set heroku/nodejs
```

### "Application error"
```bash
# Check logs
heroku logs --tail
```

---

**🎯 Recommended Workflow:**

1. **Railway for Backend** (Easiest)
2. **Vercel for Frontend** (Free, fast)
3. Both auto-deploy on `git push`!

Just code → commit → push → LIVE! 🚀
