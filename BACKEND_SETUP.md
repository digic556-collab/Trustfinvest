# TrustFinvest Backend - Newsletter & Notification Service

## Overview

A complete Node.js/Express backend service for managing newsletter subscriptions, user activity tracking, and automated email notifications using Nodemailer with Hostinger SMTP.

**Features:**
- ✅ Newsletter subscription management
- ✅ User activity logging and tracking
- ✅ Automated email notifications
- ✅ Investment & withdrawal notifications
- ✅ Admin action logging
- ✅ Email campaign management
- ✅ Email log tracking
- ✅ MongoDB integration (optional)

---

## Setup & Installation

### 1. Install Dependencies

```bash
cd /path/to/trustfinvest
npm install
```

### 2. Environment Configuration

The `.env` file is already configured with SMTP settings:

```env
# SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@trustfinvest.com
SMTP_PASSWORD=Beesystem1#
SMTP_FROM_NAME=TrustFinvest
SMTP_FROM_EMAIL=info@trustfinvest.com

# API Configuration
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000
```

### 3. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start on: `http://localhost:5000`

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/email
```

### Health Check
```
GET /health
```
Returns server status and uptime.

---

## Newsletter Management

### Subscribe to Newsletter
```
POST /api/email/subscribe
```

**Request:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter",
  "subscriber": { "email": "user@example.com" }
}
```

### Unsubscribe from Newsletter
```
POST /api/email/unsubscribe
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

### Get Email Preferences
```
GET /api/email/preferences/:email
```

**Response:**
```json
{
  "success": true,
  "preferences": {
    "newsletter": true,
    "activities": true,
    "investments": true,
    "promotions": true
  }
}
```

### Update Email Preferences
```
PUT /api/email/preferences/:email
```

**Request:**
```json
{
  "preferences": {
    "newsletter": true,
    "activities": false,
    "investments": true,
    "promotions": false
  }
}
```

---

## User Activity Tracking

### Log User Activity
```
POST /api/email/activity/log
```

**Request:**
```json
{
  "userId": "user123",
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "type": "investment|deposit|withdrawal|earning|task_completed",
  "description": "Investment of $1000 in Premium plan",
  "amount": 1000,
  "status": "completed",
  "metadata": {
    "plan": "Premium",
    "roi": "12%"
  }
}
```

**Activity Types:**
- `deposit` - Funds deposited
- `investment` - New investment made
- `withdrawal` - Funds withdrawn
- `earning` - Daily returns or earnings
- `task_completed` - Daily task completed
- `referral` - Referral reward earned
- `login` - User login event
- `profile_update` - Profile updated
- `plan_change` - Investment plan changed
- `admin_action` - Admin action performed

### Get User Activities
```
GET /api/email/activity/user/:userId?limit=10&skip=0
```

**Response:**
```json
{
  "success": true,
  "activities": [...],
  "pagination": {
    "total": 45,
    "limit": 10,
    "skip": 0
  }
}
```

---

## Notifications

### Send Investment Notification
```
POST /api/email/notification/investment
```

**Request:**
```json
{
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "userId": "user123",
  "investment": {
    "plan": "Premium",
    "amount": 5000,
    "roi": 12,
    "duration": 30,
    "maturityDate": "2024-07-15",
    "id": "inv123"
  }
}
```

### Send Withdrawal Notification
```
POST /api/email/notification/withdrawal
```

**Request:**
```json
{
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "userId": "user123",
  "withdrawal": {
    "amount": 2500,
    "method": "Bank Transfer",
    "status": "pending",
    "estimatedTime": "2-3 business days",
    "id": "wd123"
  }
}
```

---

## Admin Operations

### Log Admin Action
```
POST /api/email/admin/action
```

**Request:**
```json
{
  "adminId": "admin1",
  "adminEmail": "admin@trustfinvest.com",
  "adminName": "Admin User",
  "action": "withdrawal_approved|user_verified|payment_processed",
  "description": "Approved withdrawal request for user",
  "targetUserId": "user123",
  "targetUserEmail": "user@example.com",
  "details": {
    "withdrawalId": "wd123",
    "amount": 2500
  },
  "affectedUsers": 1
}
```

### Send Bulk Newsletter
```
POST /api/email/admin/newsletter/send
```

**Request:**
```json
{
  "subject": "Weekly Newsletter - Market Update",
  "content": "<div class=\"news-item\">...</div>",
  "targetGroup": "all|active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Newsletter sent to 1250 subscribers",
  "results": {
    "sent": 1250,
    "failed": 3,
    "total": 1253
  }
}
```

### Get Email Logs
```
GET /api/email/admin/logs/emails?limit=50&skip=0&status=sent&type=newsletter
```

**Query Parameters:**
- `limit` - Results per page (default: 50)
- `skip` - Skip N results (default: 0)
- `status` - Filter by status: `sent|failed|bounced`
- `type` - Filter by type: `welcome|newsletter|activity|investment|withdrawal|admin|campaign`

### Get Subscriber Statistics
```
GET /api/email/admin/subscribers/count
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 5420,
    "active": 5200,
    "unsubscribed": 220
  }
}
```

---

## Email Templates

### 1. Welcome Email
Sent when user subscribes to newsletter.

### 2. Newsletter
Periodic newsletter with market updates and announcements.

### 3. Activity Notification
Sent for user activities (deposit, withdrawal, earning, etc.).

### 4. Investment Confirmation
Sent when user makes an investment.

### 5. Withdrawal Confirmation
Sent when user requests withdrawal.

---

## Frontend Integration

### Import API Client

```html
<script src="/backend/client.js"></script>
```

### Initialize Client

```javascript
const api = new TrustFinvestAPI('http://localhost:5000');
```

### Example Usage

```javascript
// Subscribe to newsletter
api.subscribeNewsletter('user@example.com', 'John', 'Doe')
  .then(res => console.log('Subscribed!'))
  .catch(err => console.error('Error:', err));

// Log investment activity
api.logInvestment(
  'user123',
  'user@example.com',
  'John Doe',
  5000,
  'Premium',
  12
).then(res => console.log('Investment logged!'));

// Send investment notification
api.sendInvestmentNotification(
  'user@example.com',
  'John Doe',
  'user123',
  {
    plan: 'Premium',
    amount: 5000,
    roi: 12,
    duration: 30,
    maturityDate: '2024-07-15'
  }
).then(res => console.log('Notification sent!'));

// Log withdrawal
api.logWithdrawal('user123', 'user@example.com', 'John Doe', 2500, 'pending')
  .then(res => console.log('Withdrawal logged!'));

// Get user activities
api.getUserActivities('user123', 20, 0)
  .then(data => console.log('Activities:', data.activities));

// Get email preferences
api.getPreferences('user@example.com')
  .then(data => console.log('Preferences:', data.preferences));

// Update preferences
api.updatePreferences('user@example.com', {
  newsletter: true,
  activities: true,
  investments: true,
  promotions: false
}).then(res => console.log('Preferences updated!'));
```

### Admin Examples

```javascript
// Log admin action
api.logAdminAction(
  'admin1',
  'admin@trustfinvest.com',
  'Admin User',
  'withdrawal_approved',
  'Approved withdrawal for user123',
  'user123',
  'user@example.com',
  { withdrawalId: 'wd123', amount: 2500 },
  1
);

// Send bulk newsletter
api.sendNewsletter(
  '<div class="news-item">Market Update...</div>',
  'Weekly Newsletter',
  'active'
);

// Get email logs
api.getEmailLogs(50, 0, 'sent', 'investment')
  .then(data => console.log('Logs:', data.logs));

// Get subscriber stats
api.getSubscriberStats()
  .then(data => console.log('Stats:', data.stats));
```

---

## Database Schema

### NewsletterSubscriber
```javascript
{
  email: String (unique),
  firstName: String,
  lastName: String,
  subscribed: Boolean,
  subscriptionDate: Date,
  unsubscriptionDate: Date,
  preferences: {
    newsletter: Boolean,
    activities: Boolean,
    investments: Boolean,
    promotions: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### UserActivity
```javascript
{
  userId: String (required),
  userEmail: String (required),
  userName: String (required),
  type: String (enum),
  description: String,
  amount: Number,
  status: String (enum),
  metadata: Object,
  emailSent: Boolean,
  emailSentAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### AdminActivity
```javascript
{
  adminId: String,
  adminEmail: String,
  adminName: String,
  action: String (enum),
  description: String,
  targetUserId: String,
  targetUserEmail: String,
  details: Object,
  affectedUsers: Number,
  emailSent: Boolean,
  createdAt: Date
}
```

### EmailLog
```javascript
{
  to: String,
  from: String,
  subject: String,
  type: String (enum),
  status: String (enum),
  messageId: String,
  error: String,
  relatedActivityId: ObjectId,
  relatedUserId: String,
  sentAt: Date
}
```

---

## SMTP Configuration

**Provider:** Hostinger
**Host:** smtp.hostinger.com
**Port:** 465
**Security:** TLS/SSL
**Authentication:** 
- Email: info@trustfinvest.com
- Password: Beesystem1#

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

---

## Security Best Practices

1. ✅ Use environment variables for sensitive data
2. ✅ Validate all input emails
3. ✅ Implement rate limiting (recommended for production)
4. ✅ Use HTTPS in production
5. ✅ Implement authentication/authorization for admin endpoints
6. ✅ Store passwords securely in environment
7. ✅ Log all email activities for audit trail

---

## Performance Optimization

- Email sending is asynchronous (non-blocking)
- Database queries are indexed on userId and email
- Bulk operations use batch processing
- Email logs are stored for audit and troubleshooting
- Connection pooling for database

---

## Troubleshooting

### SMTP Connection Error
- Verify credentials in .env
- Check firewall/port settings
- Ensure port 465 is open
- Try port 587 if 465 fails

### Email Not Received
- Check email logs: `GET /api/email/admin/logs/emails?status=sent`
- Verify email preferences
- Check spam folder
- Review error logs

### Database Connection Issues
- MongoDB is optional - service works without it
- For persistent storage, configure MONGODB_URI in .env

---

## Production Deployment

1. Change `NODE_ENV=production`
2. Set strong `JWT_SECRET`
3. Update `CORS_ORIGIN` to allowed domains
4. Enable HTTPS
5. Implement rate limiting middleware
6. Add authentication to admin endpoints
7. Configure MongoDB for production
8. Set up monitoring and logging

---

## Support & Documentation

- API Docs: `GET /api/docs`
- Health Check: `GET /health`
- GitHub: (To be added)
- Email: info@trustfinvest.com

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Production Ready
