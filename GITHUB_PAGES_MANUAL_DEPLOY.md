# 🚀 Deploy to GitHub Pages (Manual Method)

## Problem: Can't connect to GitHub from command line?

**No worries!** You can deploy directly from the GitHub website.

---

## 📦 Step 1: Upload Your Code to GitHub

### Option A: Use GitHub Desktop (Easiest!)

1. **Download GitHub Desktop:** https://desktop.github.com/
2. **Install and login**
3. **File → Add Local Repository**
4. Select: `C:\Users\MC\OneDrive\Desktop\distinction bound\distinction-bound-web`
5. **Click "Publish repository"** or **"Push origin"**

### Option B: Use GitHub Web Upload

1. **Go to:** https://github.com/hardleylehobye/distinction-bound-web
2. **Click "Add file"** → **"Upload files"**
3. **Drag your entire project folder** (except node_modules)
4. **Commit changes**

---

## 🌐 Step 2: Enable GitHub Pages

1. **Go to your repository:** https://github.com/hardleylehobye/distinction-bound-web

2. **Click "Settings"** (top right)

3. **Click "Pages"** (left sidebar)

4. **Under "Build and deployment":**
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** (or **main**)
   - Folder: **/ (root)** or **/build** if deploying from main
   - Click **"Save"**

5. **Wait 2-3 minutes**

6. **Your site will be live at:**
   ```
   https://hardleylehobye.github.io/distinction-bound-web/
   ```

---

## 🎯 Alternative: Use GitHub Actions (Auto-Deploy)

Create this file: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build
```

**How it works:**
- Every time you push to `main`, it auto-builds and deploys!
- No need to run `npm run deploy` manually

---

## ⚙️ Step 3: Add Environment Variables

GitHub Pages needs your Firebase config!

### Option 1: Public Environment Variables (in code)

Create `src/config/production.js`:

```javascript
export const config = {
  apiUrl: 'https://your-backend.render.com/api',
  firebase: {
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-app.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-app.appspot.com',
    messagingSenderId: 'your-sender-id',
    appId: 'your-app-id'
  }
};
```

**Note:** Firebase config is safe to expose (it's public anyway!)

### Option 2: Use GitHub Secrets (for GitHub Actions)

1. **Go to:** Repository → Settings → Secrets and variables → Actions
2. **Add your secrets:**
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - etc.

3. **Update workflow to use secrets:**
```yaml
- name: Build
  run: npm run build
  env:
    REACT_APP_FIREBASE_API_KEY: ${{ secrets.REACT_APP_FIREBASE_API_KEY }}
    REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.REACT_APP_FIREBASE_AUTH_DOMAIN }}
```

---

## 🔧 Step 4: Deploy Your Backend

**Remember:** GitHub Pages only hosts the frontend!

### Quick Backend Deploy to Render (Free):

1. **Go to:** https://render.com
2. **Sign up with GitHub**
3. **New Web Service**
4. **Connect:** `hardleylehobye/distinction-bound-web`
5. **Settings:**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. **Add environment variables** from your `backend/.env`
7. **Create Web Service**

**Your backend will be at:** `https://your-app.onrender.com`

---

## 🔗 Step 5: Connect Frontend to Backend

Update `src/services/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  'https://your-backend.onrender.com/api';
```

Then rebuild and redeploy!

---

## ✅ Verify Deployment

1. **Visit:** https://hardleylehobye.github.io/distinction-bound-web/
2. **Check browser console** for errors
3. **Test login and payments**

---

## 🐛 Troubleshooting

### "404 Not Found"
- Make sure `homepage` in `package.json` matches your GitHub Pages URL
- Wait a few minutes after enabling Pages

### "Blank page"
- Check browser console for errors
- Verify `homepage` field in `package.json`

### "API errors"
- Make sure backend is deployed and running
- Update `REACT_APP_API_URL` to point to your backend

### Can't push to GitHub?
- **Check internet connection**
- **Try different network** (mobile hotspot?)
- **Use GitHub Desktop** instead of command line
- **Check if port 443 is blocked** by firewall/VPN

---

## 🎯 Quick Summary

1. ✅ Upload code to GitHub (via GitHub Desktop or web)
2. ✅ Enable GitHub Pages in repository settings
3. ✅ Deploy backend to Render
4. ✅ Update API URL in frontend
5. ✅ Visit your live site!

**Your site will be at:**
```
https://hardleylehobye.github.io/distinction-bound-web/
```

---

## 💡 Pro Tip: Auto-Deploy Workflow

Once you solve the network issue:

```bash
# Edit code
# Commit
git add .
git commit -m "Your changes"

# Push (triggers auto-deploy via GitHub Actions)
git push origin main
```

**Live in 2-3 minutes!** 🚀
