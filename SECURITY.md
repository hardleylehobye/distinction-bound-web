# 🔒 Security Configuration

## ✅ Security Measures Implemented

### 1. Environment Variables Protection
- ✅ All `.env` files added to `.gitignore`
- ✅ `.env.example` templates created for reference
- ✅ API keys removed from code
- ✅ Removed `.env` files from Git tracking

### 2. Sensitive Data Protection
- ✅ User data files (`backend/data/*.json`) excluded from Git
- ✅ `.gitkeep` added to preserve folder structure
- ✅ No database credentials in code

### 3. API Keys Secured

**Backend (.env):**
- Resend API Key
- Yoco Test Secret Key
- Yoco Test Public Key
- Database credentials

**Frontend (.env):**
- Firebase configuration
- All keys use environment variables

## 🔑 Required API Keys

### Resend (Email Service)
- Get from: https://resend.com/api-keys
- Variable: `RESEND_API_KEY`

### Yoco (Payment Gateway)
- Get from: https://portal.yoco.com/settings/api-keys
- Variables:
  - `YOCO_TEST_SECRET_KEY`
  - `YOCO_TEST_PUBLIC_KEY`
  - `YOCO_LIVE_SECRET_KEY` (production)
  - `YOCO_LIVE_PUBLIC_KEY` (production)

### Firebase (Authentication & Database)
- Get from: Firebase Console > Project Settings
- Variables: See `.env.example`

## 🚨 Before Pushing to Git

### Verify no secrets are exposed:
```bash
# Check for .env files
git ls-files | grep .env

# Check for API keys in code
git diff | grep -i "api.*key\|secret\|password"

# Verify .gitignore is working
git status
```

### If you accidentally committed secrets:

**1. Remove from Git history:**
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

**2. Force push (⚠️ Warning: Rewrites history):**
```bash
git push --force --all
```

**3. Rotate all exposed keys immediately!**

## 🛡️ Security Best Practices

### ✅ DO:
- Use environment variables for all secrets
- Keep `.env` files local only
- Use `.env.example` for documentation
- Rotate API keys regularly
- Use different keys for test/production
- Enable 2FA on all service accounts
- Use HTTPS in production
- Validate all user inputs
- Sanitize database queries
- Keep dependencies updated

### ❌ DON'T:
- Commit `.env` files
- Hardcode API keys
- Share secrets in chat/email
- Use production keys in development
- Commit database files with real data
- Disable CORS without consideration
- Store passwords in plain text
- Expose error details to users

## 🔄 Rotating API Keys

### When to rotate:
- Key accidentally exposed
- Team member leaves
- Every 90 days (best practice)
- After a security incident

### How to rotate:
1. Generate new key in service dashboard
2. Update `.env` file
3. Test thoroughly
4. Deploy new keys
5. Revoke old keys
6. Update documentation

## 📊 Monitoring

### Watch for:
- Unusual API usage
- Failed authentication attempts
- Unexpected payment requests
- Database access patterns
- Error rate spikes

### Tools to use:
- Sentry (Error monitoring)
- LogRocket (Session replay)
- DataDog (Infrastructure)
- Google Analytics (Usage)

## 🔐 Production Checklist

- [ ] All environment variables configured on hosting platform
- [ ] HTTPS enabled with valid SSL certificate
- [ ] CORS configured for production domains only
- [ ] Database connection secured with SSL
- [ ] Backup strategy implemented
- [ ] Error monitoring configured
- [ ] Rate limiting enabled on API
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Security headers configured
- [ ] Dependency audit completed (`npm audit`)

## 🆘 In Case of Security Breach

1. **Immediate Actions:**
   - Rotate all API keys
   - Change all passwords
   - Review access logs
   - Disable compromised accounts

2. **Investigation:**
   - Check git history for exposed secrets
   - Review recent commits
   - Analyze error logs
   - Check for unusual activity

3. **Recovery:**
   - Deploy with new credentials
   - Notify affected users (if applicable)
   - Document the incident
   - Implement preventive measures

4. **Prevention:**
   - Add pre-commit hooks
   - Setup secret scanning (GitHub Advanced Security)
   - Educate team on security practices
   - Regular security audits

## 📞 Security Contacts

- **Git Platform:** Remove sensitive data from public repos immediately
- **Yoco Support:** support@yoco.com
- **Resend Support:** support@resend.com
- **Firebase Support:** Firebase Console > Support

## 🔗 Useful Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [NPM Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Last Updated:** January 21, 2026  
**Review Frequency:** Monthly  
**Next Review:** February 21, 2026
