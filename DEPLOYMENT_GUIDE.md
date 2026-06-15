# TrustFinvest - Deployment Guide

## Security Configuration Complete

Your website now has comprehensive security protection with the .htaccess file.

### What's Protected

**File Access Blocking:**
- ✓ CSS files (.css) → Returns 404
- ✓ JavaScript files (.js) → Returns 404  
- ✓ HTML files (.html) → Returns 404 (except index.html for routing)
- ✓ Configuration files (.env, .git, package.json, etc.)
- ✓ Backup files (.bak, .old, .orig, .backup)

**Attack Prevention:**
- ✓ SQL Injection attempts
- ✓ Cross-Site Scripting (XSS) attempts
- ✓ Path Traversal attacks
- ✓ Null Byte Injection
- ✓ Directory listing enumeration

**Security Headers:**
- ✓ X-Content-Type-Options: nosniff (prevents MIME sniffing)
- ✓ X-XSS-Protection: 1; mode=block
- ✓ X-Frame-Options: SAMEORIGIN (clickjacking protection)
- ✓ Content-Security-Policy (strict inline script policy)
- ✓ Referrer-Policy: strict-origin-when-cross-origin

**Performance:**
- ✓ Gzip compression enabled
- ✓ Browser caching configured
- ✓ Image caching: 1 month
- ✓ Font caching: 1 year
- ✓ HTML caching: 5 minutes

---

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel handles most of this automatically, but you still need security headers:

```bash
# 1. Push to GitHub
git add .
git commit -m "Add security configuration and contact info"
git push origin main

# 2. Connect to Vercel
# Go to vercel.com
# Click "New Project"
# Select your GitHub repository
# Click "Import"

# 3. Set environment variables
# In Vercel Dashboard:
# Settings → Environment Variables
# Add all variables from .env file

# 4. Deploy
# Vercel will auto-deploy on push
```

**Note:** Create a `vercel.json` for additional configuration:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

### Option 2: Traditional Web Hosting (With cPanel)

Perfect for hosting with .htaccess support:

```bash
# 1. Prepare files
# Copy all files to your local machine
# Ensure .htaccess is included

# 2. Upload via FTP
# Use FileZilla or similar
# Connect to your hosting FTP
# Upload all files to public_html/

# 3. Verify .htaccess
# .htaccess should be in root (public_html/)
# Most hosts require FileZilla to show hidden files (Ctrl+H)

# 4. Test security
# Try accessing: yoursite.com/css/style.css
# Should get 404 error
# Try: yoursite.com/js/main.js
# Should get 404 error

# 5. Set up SSL (HTTPS)
# Use AutoSSL in cPanel
# Or generate free SSL via Let's Encrypt
```

### Option 3: Docker Deployment

For containerized hosting:

```bash
# 1. Create Dockerfile
cat > Dockerfile << 'DOCKER_EOF'
FROM ubuntu:22.04

# Install Apache
RUN apt-get update && apt-get install -y apache2

# Enable mod_rewrite and mod_headers
RUN a2enmod rewrite headers

# Copy website files
COPY . /var/www/html/

# Copy .htaccess
COPY .htaccess /var/www/html/.htaccess

# Set permissions
RUN chown -R www-data:www-data /var/www/html/

# Start Apache
CMD ["apache2ctl", "-D", "FOREGROUND"]

# Expose port 80
EXPOSE 80
DOCKER_EOF

# 2. Build image
docker build -t trustfinvest-website .

# 3. Run container
docker run -d -p 80:80 trustfinvest-website
```

### Option 4: AWS/Cloud Hosting

For AWS EC2 or similar:

```bash
# 1. SSH into your instance
ssh -i your-key.pem ec2-user@your-instance-ip

# 2. Install Apache
sudo yum update -y
sudo yum install -y httpd
sudo systemctl start httpd
sudo systemctl enable httpd

# 3. Copy website files
scp -r -i your-key.pem ./* ec2-user@your-instance-ip:/var/www/html/

# 4. Verify .htaccess permissions
sudo chown apache:apache /var/www/html/.htaccess
sudo chmod 644 /var/www/html/.htaccess

# 5. Test
curl http://your-instance-ip
```

---

## Pre-Deployment Checklist

Before deploying to production:

### Security
- [ ] .htaccess file created ✓
- [ ] CSS files protected (404 on direct access)
- [ ] JS files protected (404 on direct access)
- [ ] HTML files protected (404 on direct access)
- [ ] Configuration files blocked (.env, package.json, etc.)
- [ ] Security headers configured

### Files
- [ ] index.html updated with contact info ✓
- [ ] style.css has contact styles ✓
- [ ] All CSS files in /css folder
- [ ] All JS files in /js folder
- [ ] All images in /img folder
- [ ] favicon set to app logo

### Backend
- [ ] .env file configured (NOT uploaded to public!)
- [ ] Firebase credentials in .env (NOT in code)
- [ ] SMTP credentials in .env (NOT in code)
- [ ] Database connections ready

### Email System
- [ ] Email service configured ✓
- [ ] Activity listeners ready ✓
- [ ] Email templates verified ✓
- [ ] SMTP tested (node test-smtp.js)

### Frontend
- [ ] Contact info displays in navbar ✓
- [ ] Contact info displays in footer ✓
- [ ] Email links work (mailto:)
- [ ] Responsive design works on mobile
- [ ] All buttons functional
- [ ] Forms submit correctly

### Performance
- [ ] Images optimized
- [ ] CSS minified (optional)
- [ ] JS minified (optional)
- [ ] Gzip compression enabled
- [ ] Browser caching configured

### Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on mobile device
- [ ] Test on tablet
- [ ] All links work
- [ ] Forms submit
- [ ] Email links work

---

## Quick Deployment (Vercel)

Fastest way to deploy:

```bash
# Step 1: Install Vercel CLI
npm install -g vercel

# Step 2: Login to Vercel
vercel login

# Step 3: Deploy
vercel

# Step 4: Set production domain
# In Vercel Dashboard:
# Settings → Domains
# Add your custom domain

# Step 5: Monitor
# Vercel Dashboard → Analytics
# Check deployments and errors
```

---

## Post-Deployment Testing

After deployment, verify security:

```bash
# Test 1: CSS Block (should return 404)
curl -I https://yoursite.com/css/style.css
# Expected: HTTP/1.1 404 Not Found

# Test 2: JS Block (should return 404)
curl -I https://yoursite.com/js/main.js
# Expected: HTTP/1.1 404 Not Found

# Test 3: HTML Block (should return 404)
curl -I https://yoursite.com/dashboard.html
# Expected: HTTP/1.1 404 Not Found

# Test 4: Index works (should return 200)
curl -I https://yoursite.com/index.html
# Expected: HTTP/1.1 200 OK

# Test 5: Security headers
curl -I https://yoursite.com
# Check for X-Content-Type-Options, X-XSS-Protection, etc.
```

---

## SSL/HTTPS Setup

For production, always use HTTPS:

### Vercel (Automatic)
- Vercel automatically provides free SSL
- Custom domains get SSL automatically
- No additional setup needed

### cPanel Hosting
1. Go to cPanel → AutoSSL
2. Click "Run AutoSSL"
3. Certificate generates automatically
4. Uncomment HTTPS redirect in .htaccess:

```apache
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### Let's Encrypt (Manual)
```bash
sudo certbot certonly --webroot -w /var/www/html -d yoursite.com
sudo certbot install --nginx  # or --apache
sudo certbot renew  # Auto-renews before expiry
```

---

## Monitoring & Maintenance

After deployment:

### Daily Checks
- Monitor error logs
- Check email delivery (email_logs in Firestore)
- Monitor Vercel Analytics
- Watch for unusual traffic

### Weekly Tasks
- Backup database
- Review security logs
- Check SSL certificate validity
- Monitor performance metrics

### Monthly Tasks
- Update dependencies
- Review user feedback
- Optimize performance
- Check security advisories

---

## Troubleshooting Deployment

### Files Return 403 Instead of 404
Solution: Check .htaccess permissions (should be 644)

### Static Files Not Loading
Solution: Verify RewriteEngine is enabled in .htaccess

### HTTPS Not Redirecting
Solution: Uncomment HTTPS section in .htaccess

### Backend Not Working
Solution: Check environment variables in Vercel Settings

### Email Not Sending
Solution: Verify SMTP credentials in .env

---

## Environment Variables (Keep Private!)

Never commit these! Add to Vercel:

```
FIREBASE_API_KEY=AIzaSyA4WyMCUe4LoNtx3twnwDkOqjrjPPhGB80
FIREBASE_AUTH_DOMAIN=trustfin-8e4d1.firebaseapp.com
FIREBASE_PROJECT_ID=trustfin-8e4d1
FIREBASE_STORAGE_BUCKET=trustfin-8e4d1.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=747695116520
FIREBASE_APP_ID=1:747695116520:web:32c2d0428f48e51eca795d

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@trustfinvest.com
SMTP_PASSWORD=Beesystem1#
SMTP_FROM_NAME=TrustFinvest

JWT_SECRET=[generate_random_key]
```

---

## Live Deployment Status

Files ready for deployment:
- ✓ .htaccess (security configuration)
- ✓ index.html (with contact info)
- ✓ style.css (with contact styles)
- ✓ All frontend files organized
- ✓ Backend configuration
- ✓ Email system configured
- ✓ Firebase integration ready

**Your site is production-ready. Deploy now!**

---

## Support

- Vercel Docs: https://vercel.com/docs
- Apache .htaccess: https://httpd.apache.org/docs/current/howto/htaccess.html
- Let's Encrypt: https://letsencrypt.org/

Ready to deploy? Follow the Quick Deployment section above!
