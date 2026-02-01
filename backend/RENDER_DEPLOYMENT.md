# 🚀 Deploy to Render (legacy – PostgreSQL)

**Note:** The backend now supports **Firebase** or **MySQL** only. For Firebase see [FIREBASE_BACKEND.md](./FIREBASE_BACKEND.md); for MySQL see [MYSQL_SETUP.md](./MYSQL_SETUP.md). The steps below are for reference if you still use PostgreSQL elsewhere.

## Step 1: Create PostgreSQL Database on Render

1. **Go to:** https://dashboard.render.com
2. **Click "New +"** → **"PostgreSQL"**
3. **Fill in:**
   - Name: `distinction-bound-db`
   - Database: `distinction_bound`
   - User: (auto-generated)
   - Region: Choose closest to you
   - Plan: **Free**
4. **Click "Create Database"**
5. **IMPORTANT:** Copy the **Internal Database URL** (starts with `postgresql://`)

---

## Step 2: Deploy Backend Web Service

1. **Click "New +"** → **"Web Service"**
2. **Connect your GitHub repository:** `hardleylehobye/distinction-bound-web`
3. **Configure:**
   - **Name:** `distinction-bound-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Add Environment Variables** (click "Advanced" or go to Environment tab):

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<paste the Internal Database URL from Step 1>
YOCO_TEST_SECRET_KEY=<your Yoco test secret key>
YOCO_TEST_PUBLIC_KEY=<your Yoco test public key>
RESEND_API_KEY=<your Resend API key>
FROM_EMAIL=<your verified email>
```

5. **Click "Create Web Service"**

---

## Step 3: Wait for Deployment

- First deploy takes 2-5 minutes
- Render will automatically:
  - Install dependencies
  - Create PostgreSQL tables
  - Start your server
- Watch the logs for any errors

---

## Step 4: Get Your Backend URL

Once deployed, copy your backend URL:
- Example: `https://distinction-bound-backend.onrender.com`
- **Add `/api` at the end:** `https://distinction-bound-backend.onrender.com/api`

---

## Step 5: Update Frontend

Add this to Netlify environment variables:
```
REACT_APP_API_URL=https://distinction-bound-backend.onrender.com/api
```

Then rebuild and redeploy frontend:
```bash
npm run build
netlify deploy --prod --dir=build
```

---

## ✅ Verify It's Working

Test your backend:
```
https://distinction-bound-backend.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Distinction Bound API is running"
}
```

---

## 🎉 Done!

Your backend is now live with PostgreSQL!
- ✅ Data persists forever
- ✅ No data loss on restart
- ✅ Free tier (500MB database, 750 hours/month)

---

## 🔧 Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL is correct
- Make sure you used the **Internal Database URL** (not External)

### "Module not found"
- Build Command should be: `npm install`
- Check package.json is in backend folder

### "Port already in use"
- Start Command should be: `npm start`
- Render automatically sets PORT=10000

### Frontend can't connect
- Make sure REACT_APP_API_URL ends with `/api`
- Rebuild frontend after changing environment variables
- Clear browser cache

---

## 📊 Database Management

**View your data:**
1. Go to your PostgreSQL database on Render
2. Click "Connect" → "External Connection"
3. Use a tool like pgAdmin or TablePlus to connect

**Backup your data:**
- Render automatically backs up your free database
- Manual backup: Click "Backup" in database dashboard

---

## 💰 Pricing

**Free Tier Includes:**
- PostgreSQL: 500MB storage, 90 day retention
- Web Service: 750 hours/month
- ⚠️ Spins down after 15 min inactivity (first request after takes ~30 sec)

**Upgrade to keep always-on:** $7/month

---

## 🚀 Next Steps

After deployment:
1. Test all features (login, payments, tickets)
2. Check data is saving in PostgreSQL
3. Monitor logs for errors
4. Set up custom domain (optional)
