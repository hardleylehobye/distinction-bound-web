# 🚀 Quick Backend Deployment Guide

## 🎯 Option 1: Render.com (Recommended - Free Tier)

### Deploy via GitHub (Even if local git doesn't work)

1. **Go to:** https://render.com
2. **Sign up** with GitHub
3. **New Web Service**
4. **Connect Repository:** `hardleylehobye/distinction-bound-web`
5. **Configure:**
   - Name: `distinction-bound-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free`

6. **Add Environment Variables:**
   ```
   YOCO_TEST_SECRET_KEY=your_key
   YOCO_TEST_PUBLIC_KEY=your_key
   RESEND_API_KEY=your_key
   FROM_EMAIL=your_email
   NODE_ENV=production
   PORT=10000
   ```

7. **Click "Create Web Service"**

8. **Copy your backend URL** (e.g., `https://distinction-bound-backend.onrender.com`)

---

## ⚡ Option 2: ngrok (Quick Temporary Solution)

Use this while setting up permanent hosting:

1. **Download ngrok:** https://ngrok.com/download
2. **Install and run:**
   ```bash
   ngrok http 5000
   ```
3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)
4. **Use this as your API URL**

**Note:** This URL changes every time you restart ngrok (free tier).

---

## 🌊 Option 3: Railway.app (If it works for you)

1. **Go to:** https://railway.app
2. **Login with GitHub**
3. **New Project → Deploy from GitHub**
4. **Select:** `hardleylehobye/distinction-bound-web`
5. **Add environment variables**
6. **Set root directory to `backend`**
7. **Deploy!**

---

## 🔧 After Backend is Deployed

### Update Netlify Environment Variables

1. **Go to:** https://app.netlify.com
2. **Select your site**
3. **Site Settings → Environment Variables**
4. **Add new variable:**
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-backend-url.com/api`
5. **Save**
6. **Trigger a new deploy**

### Or update locally and redeploy:

```bash
# In your project root
npm run build
netlify deploy --prod --dir=build
```

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Check backend is running
- Check URL is correct (includes `/api` at the end)
- Check CORS is enabled in backend

### "Port already in use"
- Kill process: `Get-Process -Name node | Stop-Process -Force`
- Restart backend

### "Environment variables not working"
- Rebuild frontend after adding variables
- Clear browser cache
- Check variable names match exactly

---

## 📝 Backend URL Format

Your backend URL should end with `/api`:

❌ Wrong: `https://your-backend.onrender.com`
✅ Correct: `https://your-backend.onrender.com/api`

---

## 🎯 Recommended Flow:

1. ✅ Deploy backend to Render (5 minutes)
2. ✅ Copy backend URL
3. ✅ Add `REACT_APP_API_URL` to Netlify environment variables
4. ✅ Rebuild and redeploy frontend
5. ✅ Test your live site!

---

## 💡 Pro Tip

While setting up Render, you can use ngrok as a temporary solution:

```bash
# Terminal 1 - Start backend
cd backend
npm start

# Terminal 2 - Expose with ngrok
ngrok http 5000
```

Copy the ngrok URL and use it in Netlify until Render is ready!
