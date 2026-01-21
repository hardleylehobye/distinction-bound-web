# 🚀 Git Deployment Instructions

## ✅ Your Changes Are Committed!

Commit: `102a9e8` - Complete ticket system with Yoco payments, security hardening, and bug fixes

## 📤 Push to GitHub

### Option 1: Create New Repository on GitHub

1. **Go to GitHub:**
   - Visit: https://github.com/new
   - Or: GitHub.com → Click "+" → "New repository"

2. **Configure Repository:**
   - **Repository name:** `distinction-bound-web` (or your choice)
   - **Description:** Online Learning Platform with Ticket System
   - **Visibility:** 
     - ✅ **Private** (Recommended - contains sensitive config)
     - ⚠️ Public (Make 100% sure no secrets are in code)
   - **DO NOT** initialize with README, .gitignore, or license

3. **Copy the repository URL:**
   - You'll get something like: `https://github.com/yourusername/distinction-bound-web.git`

4. **Add remote and push:**
   ```bash
   cd "C:\Users\MC\OneDrive\Desktop\distinction bound\distinction-bound-web"
   
   # Add remote
   git remote add origin https://github.com/YOUR_USERNAME/distinction-bound-web.git
   
   # Rename branch to main (GitHub's default)
   git branch -M main
   
   # Push to GitHub
   git push -u origin main
   ```

5. **Enter credentials when prompted:**
   - Use Personal Access Token, not password
   - Get token from: https://github.com/settings/tokens

### Option 2: Use Existing Repository

If you already have a repository:

```bash
# Add remote
git remote add origin YOUR_REPO_URL

# Push
git branch -M main
git push -u origin main
```

## 🔒 Final Security Check

Before pushing, verify:

```bash
# Make sure .env files are NOT tracked
git ls-files | findstr .env
# Should only show .env.example files

# Check for API keys in staged files
git diff --cached | findstr /i "api.*key secret password"
# Should show nothing critical
```

## ⚠️ IMPORTANT: After Pushing

1. **Set Repository to Private** (if containing any sensitive info)
2. **Enable Branch Protection** (Settings → Branches)
3. **Setup Secrets** for CI/CD:
   - Settings → Secrets and variables → Actions
   - Add all environment variables

## 🎯 Next Steps After GitHub Push

### Deploy Frontend (Netlify)
1. Go to: https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Add environment variables from `.env.example`
5. Deploy!

### Deploy Backend (Railway)
1. Go to: https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - Root directory: `backend`
   - Start command: `node server.js`
   - Add environment variables from `backend/.env.example`
5. Deploy!

### Alternative: Heroku
```bash
# Frontend
heroku create your-app-name-frontend
git push heroku main

# Backend
heroku create your-app-name-backend
cd backend
heroku config:set YOCO_TEST_SECRET_KEY=your_key
# ... set all env vars
git push heroku main
```

## 📊 Verify Deployment

After deployment, test:
- [ ] Login works
- [ ] Can view courses
- [ ] Payment flow works
- [ ] Tickets are created
- [ ] Emails are sent (if configured)
- [ ] All pages are responsive

## 🆘 Troubleshooting

### Push rejected?
```bash
# If remote has changes
git pull origin main --rebase
git push origin main
```

### Authentication failed?
- Use Personal Access Token instead of password
- Generate at: https://github.com/settings/tokens
- Select scopes: `repo`, `workflow`

### Large files rejected?
```bash
# Check file sizes
git ls-files | xargs ls -lh | sort -k5 -hr | head -20

# Remove if needed
git rm --cached large-file.ext
```

## 📞 Need Help?

- GitHub Docs: https://docs.github.com
- Netlify Docs: https://docs.netlify.com
- Railway Docs: https://docs.railway.app
- Heroku Docs: https://devcenter.heroku.com

---

**✅ You're ready to push! Run the commands above to deploy to GitHub.**
