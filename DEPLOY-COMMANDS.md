# 🚀 GitHub Pages Deployment Commands

# Step 1: Add GitHub remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/distinction-bound-program.git

# Step 2: Push to GitHub
git branch -M main
git push -u origin main

# Step 3: After pushing, go to your repository on GitHub and:
# 1. Click "Settings" tab
# 2. Scroll down to "Pages" section
# 3. Source: "Deploy from a branch"
# 4. Branch: "main"
# 5. Folder: "/root"
# 6. Click "Save"

# Step 4: Deploy your app
npm run deploy

# Your site will be live at: https://YOUR_USERNAME.github.io/distinction-bound-program
