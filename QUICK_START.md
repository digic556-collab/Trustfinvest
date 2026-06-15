# TrustFinvest Backend - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Verify .env Configuration
Check that `.env` contains:
```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@trustfinvest.com
SMTP_PASSWORD=Beesystem1#
PORT=5000
```

### Step 3: Start the Server
```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║     TrustFinvest Newsletter & Notification Service      ║
╚════════════════════════════════════════════════════════╝

[Server] Running on http://localhost:5000
[SMTP] info@trustfinvest.com @ smtp.hostinger.com
```

### Step 4: Test the Connection
Open browser to: `http://localhost:5000/health`

Should return:
```json
{
  "status": "ok",
  "message": "TrustFinvest Backend is running"
}
```

---

## 📋 Quick API Tests

### Subscribe to Newsletter
```bash
curl -X POST http://localhost:5000/api/email/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Log User Activity
```bash
curl -X POST http://localhost:5000/api/email/activity/log \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "type": "investment",
    "description": "Investment of $5000",
    "amount": 5000,
    "status": "completed"
  }'
```

### Send Investment Notification
```bash
curl -X POST http://localhost:5000/api/email/notification/investment \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "userId": "user123",
    "investment": {
      "plan": "Premium",
      "amount": 5000,
      "roi": 12,
      "duration": 30,
      "maturityDate": "2024-07-15"
    }
  }'
```

---

## 🔌 Frontend Integration

### 1. Add API Client to HTML
```html
<script src="/backend/client.js"></script>
```

### 2. Initialize API
```javascript
const api = new TrustFinvestAPI('http://localhost:5000');
```

### 3. Subscribe to Newsletter
```javascript
api.subscribeNewsletter('user@example.com', 'John', 'Doe')
  .then(res => console.log('Subscribed!'))
  .catch(err => console.error('Error:', err));
```

### 4. Log Activities
```javascript
// Log investment
api.logInvestment('user123', 'user@example.com', 'John', 5000, 'Premium', 12);

// Log withdrawal
api.logWithdrawal('user123', 'user@example.com', 'John', 2500, 'pending');

// Log earning
api.logEarning('user123', 'user@example.com', 'John', 50, 'daily_return');
```

### 5. Send Notifications
```javascript
// Investment notification
api.sendInvestmentNotification('user@example.com', 'John', 'user123', {
  plan: 'Premium',
  amount: 5000,
  roi: 12,
  duration: 30,
  maturityDate: '2024-07-15'
});

// Withdrawal notification
api.sendWithdrawalNotification('user@example.com', 'John', 'user123', {
  amount: 2500,
  method: 'Bank Transfer',
  status: 'pending',
  estimatedTime: '2-3 business days'
});
```

---

## 📧 Email Templates

The backend automatically sends formatted emails for:

1. **Welcome Email** - When user subscribes
2. **Activity Notification** - Deposit, withdrawal, earning, etc.
3. **Investment Confirmation** - When investment is made
4. **Withdrawal Confirmation** - When withdrawal is requested
5. **Newsletter** - Bulk campaigns from admin

All emails include:
- ✅ Professional branding
- ✅ Gradient header (Blue → Orange)
- ✅ Action buttons
- ✅ Footer with company info
- ✅ Responsive design

---

## 🎯 Implementation Checklist

### In Dashboard.html
- [ ] Add newsletter subscription form
- [ ] Add activity logging for investments
- [ ] Add activity logging for withdrawals
- [ ] Add task completion logging
- [ ] Display user activity history
- [ ] Add email preferences settings

### In Admin.html
- [ ] Add send newsletter button
- [ ] Display subscriber statistics
- [ ] Show email logs/history
- [ ] Log admin actions

### In JavaScript Files
- [ ] Import `backend/client.js`
- [ ] Initialize `TrustFinvestAPI`
- [ ] Add API calls after key actions
- [ ] Handle success/error responses
- [ ] Show user notifications

---

## 🔐 Environment Variables

Key variables in `.env`:

```bash
# SMTP (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@trustfinvest.com
SMTP_PASSWORD=Beesystem1#

# Server
PORT=5000
NODE_ENV=development

# Database (optional)
MONGODB_URI=mongodb://localhost:27017/trustfinvest

# Security
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=*
```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill process using port 5000
kill -9 <PID>

# Try different port
PORT=5001 npm run dev
```

### SMTP connection error
```
Error: connect ECONNREFUSED 465
```
- Check internet connection
- Verify credentials in .env
- Try port 587 instead of 465
- Check firewall settings

### Emails not sending
- Check email logs: `GET /api/email/admin/logs/emails`
- Verify recipient email address is valid
- Check user preferences (activities might be disabled)
- Review email service status

### Database connection issues
- MongoDB is optional - service works without it
- For development, just run with CORS enabled
- To enable database: `mongodb://localhost:27017/trustfinvest`

---

## 📊 API Documentation

### View All Endpoints
```
GET http://localhost:5000/api/docs
```

### Health Check
```
GET http://localhost:5000/health
```

---

## 🚢 Deployment

### Vercel/Heroku
1. Push code to GitHub
2. Connect to Vercel/Heroku
3. Set environment variables
4. Deploy

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]
```

### Environment for Production
```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

---

## 💡 Tips & Best Practices

1. **Always validate emails** - Use the validator library
2. **Log everything** - Check email logs for debugging
3. **Handle errors gracefully** - Show user-friendly messages
4. **Test emails first** - Use a test email before going live
5. **Monitor performance** - Track email sending times
6. **Rate limit in production** - Prevent abuse
7. **Back up credentials** - Securely store SMTP password
8. **Regular updates** - Keep dependencies updated

---

## 📚 Full Documentation

See `BACKEND_SETUP.md` for comprehensive documentation.

---

## 🎓 Learning Resources

- **Express.js**: https://expressjs.com/
- **Nodemailer**: https://nodemailer.com/
- **MongoDB**: https://docs.mongodb.com/
- **REST APIs**: https://restfulapi.net/

---

## ✅ Success Checklist

- [ ] Backend running on localhost:5000
- [ ] SMTP connection verified
- [ ] First email test sent successfully
- [ ] Frontend can access API
- [ ] Activity logging working
- [ ] Notifications sending
- [ ] Email preferences saved
- [ ] Admin controls functional

---

**You're all set!** 🎉

Start integrating the API into your frontend. Refer to `backend/integration-examples.js` for code samples.

For questions, check the logs:
```bash
# Check server logs in development
npm run dev
```
