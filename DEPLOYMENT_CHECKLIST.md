# ✅ Deployment Checklist - PostgreSQL Setup Complete!

## 🎉 What's Been Set Up:

- ✅ PostgreSQL database adapter created
- ✅ Smart database wrapper (auto-switches between JSON and PostgreSQL)
- ✅ All routes updated to use new database system
- ✅ Migration script ready
- ✅ Frontend built and ready to deploy
- ✅ API configured to use environment variables

---

## 📋 Deployment Steps

### Step 1: Deploy Backend to Render (5 minutes)

1. **Open:** https://dashboard.render.com

2. **Create PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Name: `distinction-bound-db`
   - Plan: **Free**
   - Click "Create Database"
   - **📋 COPY the Internal Database URL** (you'll need this!)

3. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect repository: `hardleylehobye/distinction-bound-web`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: **Free**

4. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste your database URL from step 2>
   # Yoco – use LIVE keys in production (backend uses them when NODE_ENV=production)
   YOCO_LIVE_PUBLIC_KEY=<from Yoco dashboard – Live keys>
   YOCO_LIVE_SECRET_KEY=<from Yoco dashboard – Live keys>
   YOCO_TEST_PUBLIC_KEY=<optional, for fallback>
   YOCO_TEST_SECRET_KEY=<optional, for fallback>
   RESEND_API_KEY=<from your backend/.env>
   FROM_EMAIL=<your email>
   ```

5. **Click "Create Web Service"**

6. **Wait 2-3 minutes** for deployment

7. **📋 COPY your backend URL** (e.g., `https://distinction-bound-backend.onrender.com`)

---

### Step 2: Deploy Frontend on Vercel (2 minutes)

1. **Go to:** https://vercel.com/dashboard
2. **Import** your repo: `hardleylehobye/distinction-bound-web` (or connect GitHub if not already).
3. **Configure project:**
   - **Framework Preset:** Create React App (auto-detected)
   - **Root Directory:** leave as `.` (repo root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
4. **Environment Variables** (Settings → Environment Variables):
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-backend-url.onrender.com/api` (your Render backend URL + `/api`)
   - Apply to: Production (and Preview if you want)
5. **Deploy.** Push to `main` = auto redeploy.

---

### Step 3: Verify Everything Works (2 minutes)

1. **Test Backend:**
   - Visit: `https://your-backend-url.onrender.com/api/health`
   - Should see: `{"status":"ok","message":"Distinction Bound API is running"}`

2. **Test Frontend:**
   - Visit: your Vercel URL (e.g. `https://distinction-bound-web.vercel.app`)
   - Login with Google
   - Check if courses load
   - Try making a test purchase (Yoco live in production)

---

## 🎯 What You'll Get:

✅ **Live Data:** All purchases, users, tickets saved forever  
✅ **No Data Loss:** PostgreSQL keeps everything even after restarts  
✅ **Free Hosting:** Both frontend and backend on free tiers  
✅ **Auto HTTPS:** Secure connections included  
✅ **Auto Deploys:** Push to GitHub = auto redeploy  

---

## 📊 Database Features:

- **500MB Storage** (enough for thousands of users/purchases)
- **Automatic Backups** (90 days)
- **High Performance** (much faster than JSON files)
- **Production Ready** (used by thousands of companies)

---

## 🔧 Local Development Still Works!

Your local setup will continue using JSON files:
```bash
# Start backend locally
cd backend
npm start

# Start frontend locally
npm start
```

No changes needed! It automatically uses JSON files locally.

---

## 🚀 Next Steps After Deployment:

1. **Test all features** thoroughly
2. **Add real Yoco keys** (replace test keys) when ready for production
3. **Set up custom domain** (optional)
4. **Monitor logs** on Render dashboard
5. **Upgrade to paid plan** ($7/month) for always-on service (optional)

---

## 📁 Files:

- `backend/database.js` - Database wrapper (MySQL/PostgreSQL)
- `backend/RENDER_DEPLOYMENT.md` - Backend (Render) deployment guide
- `vercel.json` - Frontend SPA rewrites for Vercel
- `DEPLOYMENT_CHECKLIST.md` - This file

---

## ⏱️ Free Tier Limitations:

- **Backend:** Spins down after 15 min of inactivity
  - First request after = ~30 sec delay
  - All subsequent requests = instant
- **Database:** 90 day data retention, 500MB storage
- **Solution:** Upgrade to $7/month for always-on

---

## 🆘 Need Help?

- **Backend:** `backend/RENDER_DEPLOYMENT.md` – Render deployment
- **Frontend:** Vercel auto-builds from `main`; ensure `REACT_APP_API_URL` points at your backend `/api` URL

---

## 🎊 You're Almost Done!

Just follow Steps 1-3 above and you'll have a fully functional, production-ready application with persistent data! 🚀
