#!/bin/bash

# 🚀 Distinction Bound Program - Quick Deployment Script
# This script helps you deploy your app to Netlify

echo "🎓 Distinction Bound Program - Deployment Script"
echo "=========================================="

# Check if build folder exists
if [ ! -d "build" ]; then
    echo "📦 Building your application..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed! Please fix errors before deploying."
        exit 1
    fi
    echo "✅ Build successful!"
else
    echo "✅ Build folder already exists"
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📋 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Distinction Bound Program"
    echo "✅ Git repository initialized!"
fi

echo ""
echo "🌟 Next Steps for Deployment:"
echo "=============================="
echo ""
echo "1. 📤 Push to GitHub:"
echo "   git remote add origin https://github.com/yourusername/distinction-bound-program.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "2. 🚀 Deploy to Netlify:"
echo "   - Go to https://netlify.com"
echo "   - Click 'New site from Git'"
echo "   - Connect your GitHub repository"
echo "   - Build command: npm run build"
echo "   - Publish directory: build"
echo ""
echo "3. 🔧 Set Environment Variables in Netlify:"
echo "   - FIREBASE_API_KEY"
echo "   - FIREBASE_PROJECT_ID"
echo "   - PAYFAST_MERCHANT_ID"
echo "   - PAYFAST_MERCHANT_KEY"
echo ""
echo "4. 🎯 Your app will be live at:"
echo "   https://your-site-name.netlify.app"
echo ""
echo "📚 Full guide: Check DEPLOYMENT.md file"
echo ""
echo "🚀 Ready to deploy your Distinction Bound Program!"
