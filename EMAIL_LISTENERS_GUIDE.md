# Email Listeners & Activity Auto-Sending Guide

## Overview

The TrustFinvest backend now includes a comprehensive email listener system that automatically sends emails based on user activities. The system monitors all user actions and sends personalized, branded emails to keep users informed and engaged.

**Backend automatically listens to and sends emails for:**
- User registration (new user welcome)
- User login (welcome back emails)
- Deposits (confirmation with details)
- Investments (plan details and earnings estimates)
- Withdrawals (initiated and approval notifications)
- Task completions (reward notifications)
- Daily earnings (earnings summaries)
- Activity alerts (suspicious activity, important events)

---

## Email Templates with App Logo

All email templates now include:

✅ **App Logo** - TrustFinvest logo at the top of every email
✅ **Professional Branding** - Gradient headers with brand colors
✅ **Responsive Design** - Works on mobile and desktop
✅ **Call-to-Action Buttons** - Direct links to dashboard
✅ **User Personalization** - Addresses by first name
✅ **Clear Information** - Transaction details, amounts, timelines
✅ **Footer** - Copyright and unsubscribe links

---

## Activity Types & Auto-Sending

### 1. **New User Registration**
**Trigger:** User creates account
**Email Type:** `newUserRegistration`
**Auto-Sent:** YES - Immediate
**Content:**
- Welcome message
- Account activation confirmation
- Getting started guide (3 steps)
- Link to dashboard
- Support contact info

```javascript
// Example trigger in routes:
const result = await ActivityListener.onUserRegistration({
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    userId: 'user123'
});
```

---

### 2. **Welcome Back (User Login)**
**Trigger:** Returning user logs in (not first login)
**Email Type:** `welcomeBack`
**Auto-Sent:** YES - On returning login
**Content:**
- Welcome back greeting
- Last active date
- What's new features
- Investment status
- Link to dashboard

```javascript
const result = await ActivityListener.onUserLogin({
    email: 'user@example.com',
    firstName: 'John',
    userId: 'user123',
    lastLogin: '2 weeks ago'
});
```

---

### 3. **Deposit Confirmation**
**Trigger:** User deposits funds
**Email Type:** `depositConfirmation`
**Auto-Sent:** YES - When enabled in preferences
**Content:**
- Deposit confirmation
- Amount and reference number
- Transaction details
- Next steps (choose plan, invest, earn)
- Link to investment page

```javascript
const result = await ActivityListener.onDeposit({
    userId: 'user123',
    email: 'user@example.com',
    userName: 'John',
    amount: 5000,
    reference: 'DEP-2024-001234'
});
```

---

### 4. **Investment Created**
**Trigger:** User creates investment
**Email Type:** `investmentCreated`
**Auto-Sent:** YES - When enabled in preferences
**Content:**
- Investment confirmation
- Plan details (name, amount, ROI)
- Earnings calculator
- Expected returns breakdown
- Portfolio link

```javascript
const result = await ActivityListener.onInvestment({
    userId: 'user123',
    email: 'user@example.com',
    userName: 'John',
    plan: 'Premium',
    amount: 5000,
    roi: 12,
    duration: 30
});
```

---

### 5. **Withdrawal Initiated**
**Trigger:** User requests withdrawal
**Email Type:** `withdrawalInitiated`
**Auto-Sent:** YES - When enabled in preferences
**Content:**
- Withdrawal request confirmation
- Amount and method
- Processing timeline
- Status tracking
- Next steps

```javascript
const result = await ActivityListener.onWithdrawalInitiated({
    userId: 'user123',
    email: 'user@example.com',
    userName: 'John',
    amount: 1500,
    method: 'Bank Transfer'
});
```

---

### 6. **Withdrawal Approved**
**Trigger:** Admin approves withdrawal
**Email Type:** `withdrawalApproved`
**Auto-Sent:** YES - When enabled in preferences
**Content:**
- Withdrawal approved notification
- Amount and method
- Expected arrival (1-3 business days)
- Support contact
- Reinvestment encouragement

```javascript
const result = await ActivityListener.onWithdrawalApproved({
    userId: 'user123',
    email: 'user@example.com',
    userName: 'John',
    amount: 1500,
    method: 'Bank Transfer'
});
```

---

### 7. **Task Completed**
**Trigger:** User completes daily task
**Email Type:** `taskCompleted`
**Auto-Sent:** YES - When enabled in preferences
**Content:**
- Task completion congratulations
- Reward amount (in TF tokens)
- Encouragement to complete more tasks
- Link to task dashboard

```javascript
const result = await ActivityListener.onTaskCompleted({
    userId: 'user123',
    email: 'user@example.com',
    userName: 'John',
    taskTitle: 'Share on Social Media',
    reward: 50
});
```

---

### 8. **Daily Earnings Update**
**Trigger:** Daily scheduled or on-demand
**Email Type:** `earningsUpdate`
**Auto-Sent:** YES - Configurable frequency
**Content:**
- Today's earnings
- Total lifetime earnings
- Active investments count
- Earnings breakdown
- Growth statistics

```javascript
const result = await ActivityListener.onDailyEarnings({
    userId: 'user123',
    email: 'user@example.com',
    userName: 'John',
    dailyEarnings: 15.50,
    totalEarnings: 450.25,
    investmentCount: 3
});
```

---

### 9. **Activity Alert**
**Trigger:** Important or suspicious activity
**Email Type:** `activityAlert`
**Auto-Sent:** YES - When enabled in preferences
**Content:**
- Activity type
- Activity details
- Timestamp
- Action required (if needed)
- Link to activity log

```javascript
const result = await ActivityListener.onActivityAlert({
    userId: 'user123',
    email: 'user@example.com',
    userName: 'John',
    activityType: 'Unusual Login',
    details: 'Login from new device: Chrome on Windows'
});
```

---

### 10. **Newsletter**
**Trigger:** Admin sends newsletter
**Email Type:** `newsletter`
**Auto-Sent:** YES - If user subscribed
**Content:**
- Newsletter content
- Feature highlights
- Market updates
- Promotional offers
- Unsubscribe link

```javascript
const result = await emailService.sendNewsletter(
    'user@example.com',
    '<h3>Market Update</h3><p>New investment opportunities available...</p>'
);
```

---

## Auto-Sending System

### How It Works

1. **Activity Occurs** → User performs action (deposit, investment, login, etc.)
2. **Log Activity** → Activity is logged to Firestore
3. **Trigger Listener** → Activity listener is called
4. **Check Preferences** → System checks user's email preferences
5. **Send Email** → If enabled, email is sent automatically
6. **Log Delivery** → Email log is recorded in Firestore
7. **Confirm Status** → Email status tracked (sent, failed, bounced)

### Email Preferences

Users can enable/disable emails for:
- `newsletter` - Marketing and promotional emails
- `activities` - Activity notifications (deposits, investments, withdrawals)
- `investments` - Investment confirmations and updates
- `tasks` - Task completion and reward notifications
- `alerts` - Important security and account alerts

---

## Integration in Routes

### In Activity Routes

```javascript
const activityListener = require('../services/activityListener');

// When user registers (in signup route)
router.post('/auth/register', async (req, res) => {
    // ... register logic ...
    
    // Auto-send welcome email
    await activityListener.onUserRegistration({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userId: user.id
    });
});

// When user makes deposit (in deposit route)
router.post('/deposit', async (req, res) => {
    // ... deposit logic ...
    
    // Auto-send deposit confirmation
    await activityListener.onDeposit({
        userId: user.id,
        email: user.email,
        userName: user.firstName,
        amount: req.body.amount,
        reference: depositId
    });
});

// When investment is created (in investment route)
router.post('/investment', async (req, res) => {
    // ... investment logic ...
    
    // Auto-send investment confirmation
    await activityListener.onInvestment({
        userId: user.id,
        email: user.email,
        userName: user.firstName,
        plan: investment.plan,
        amount: investment.amount,
        roi: investment.roi,
        duration: investment.duration
    });
});
```

---

## Frontend Integration

### Register New Activity Type

In your frontend JavaScript:

```javascript
// Include the API client
const api = new TrustFinvestAPI('http://localhost:5000');

// 1. Register user (triggers welcome email automatically)
api.registerUser({
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'secure_password'
});

// 2. Make deposit (triggers deposit email automatically)
api.makeDeposit({
    userId: 'user123',
    amount: 5000,
    method: 'card'
});

// 3. Create investment (triggers investment email automatically)
api.createInvestment({
    userId: 'user123',
    plan: 'Premium',
    amount: 5000,
    duration: 30
});

// 4. Initiate withdrawal (triggers withdrawal email automatically)
api.initiateWithdrawal({
    userId: 'user123',
    amount: 1500,
    method: 'bank_transfer'
});
```

---

## Email Preferences API

### Get User Preferences

```javascript
GET /api/email/preferences/:email

Response:
{
    "email": "user@example.com",
    "preferences": {
        "newsletter": true,
        "activities": true,
        "investments": true,
        "tasks": true,
        "alerts": true
    }
}
```

### Update Preferences

```javascript
PUT /api/email/preferences/:email
Body:
{
    "preferences": {
        "newsletter": false,
        "activities": true,
        "investments": true,
        "tasks": false,
        "alerts": true
    }
}

Response:
{
    "success": true,
    "message": "Preferences updated"
}
```

---

## Email Logs & Tracking

### Get Email Logs

```javascript
GET /api/email/admin/logs/emails

Response:
[
    {
        "id": "log123",
        "userId": "user123",
        "email": "user@example.com",
        "emailType": "deposit_confirmation",
        "subject": "Deposit Confirmed - $5000",
        "sentAt": "2024-01-15T10:30:00Z",
        "status": "sent",
        "messageId": "msg_12345"
    }
]
```

### Email Log Entry Structure

- `userId` - User ID
- `email` - Recipient email
- `emailType` - Type of email (registration, deposit, investment, etc.)
- `subject` - Email subject line
- `sentAt` - When email was sent
- `status` - Email status (sent, failed, bounced)
- `messageId` - SMTP message ID
- Additional context fields (amount, plan, taskTitle, etc.)

---

## Email Templates Included

### Authentication Emails
- ✅ **New User Registration** - Welcome and activation
- ✅ **Welcome Back** - Returning user login

### Transaction Emails
- ✅ **Deposit Confirmation** - Deposit with reference number
- ✅ **Investment Created** - Plan details and earnings calculator
- ✅ **Withdrawal Initiated** - Processing timeline
- ✅ **Withdrawal Approved** - Funds on the way

### Activity Emails
- ✅ **Task Completed** - Reward notification
- ✅ **Daily Earnings** - Earnings summary
- ✅ **Activity Alert** - Security and account alerts

### Newsletter
- ✅ **Newsletter** - Marketing and updates

---

## Best Practices

### 1. Always Check User Preferences
Before sending any email (except alerts), verify user has enabled that preference type:

```javascript
const userPrefs = await db.collection('newsletter_subscribers')
    .doc(email)
    .get();
    
const preferences = userPrefs.data()?.preferences || {};

if (preferences.activities !== false) {
    // Send email
}
```

### 2. Log All Email Activity
Every email should be logged to Firestore for tracking:

```javascript
await db.collection('email_logs').add({
    userId,
    email,
    emailType: 'deposit_confirmation',
    subject: 'Deposit Confirmed',
    sentAt: new Date(),
    status: 'sent',
    messageId: result.messageId
});
```

### 3. Handle Errors Gracefully
Always catch errors and log them:

```javascript
try {
    const result = await emailService.sendDepositConfirmation(...);
    if (!result.success) {
        console.error('[Email] Failed:', result.error);
        // Don't break user flow, just log the error
    }
} catch (error) {
    console.error('[Email] Exception:', error.message);
}
```

### 4. Use Personalization
Always include user's first name in emails:

```javascript
const userName = user.firstName || user.email.split('@')[0];
await emailService.sendDepositConfirmation(email, userName, amount, reference);
```

### 5. Include Action Links
Always provide direct links to relevant dashboard sections:

```html
<a href="${FRONTEND_URL}/dashboard?tab=invest" class="button">
    Start Investing Now
</a>
```

---

## Testing Email Listeners

### Test New User Registration

```bash
curl -X POST http://localhost:5000/api/email/activity/log \
  -H "Content-Type: application/json" \
  -d '{
    "activityType": "new_user_registered",
    "data": {
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "userId": "test123"
    }
  }'
```

### Test Deposit Confirmation

```bash
curl -X POST http://localhost:5000/api/email/activity/log \
  -H "Content-Type: application/json" \
  -d '{
    "activityType": "deposit",
    "data": {
      "userId": "test123",
      "email": "test@example.com",
      "userName": "Test",
      "amount": 5000,
      "reference": "DEP-TEST-001"
    }
  }'
```

### Check Email Logs

```bash
curl http://localhost:5000/api/email/admin/logs/emails
```

---

## Monitoring & Analytics

### Email Statistics

Get subscriber count:
```bash
GET /api/email/admin/subscribers/count
```

Get email logs for specific user:
```bash
GET /api/email/activity/user/:userId
```

View email delivery status:
```bash
GET /api/email/admin/logs/emails?status=sent
GET /api/email/admin/logs/emails?emailType=deposit_confirmation
```

---

## Troubleshooting

### Emails Not Sending

1. **Check SMTP Configuration**
   - Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` in `.env`
   - Run: `node test-smtp.js`

2. **Check User Preferences**
   - Verify user has not disabled email notifications
   - Check if activity type preference is enabled

3. **Review Email Logs**
   - Check Firestore `email_logs` collection
   - Look for any error messages

4. **Check Console Logs**
   - Run backend with: `npm run dev`
   - Look for `[Email]` or `[ActivityListener]` logs

### Email Template Issues

- **Logo not showing:** Verify LOGO_URL in emailService.js points to valid image
- **Colors not displaying:** Check CSS in email templates
- **Links broken:** Verify FRONTEND_URL in `.env` is correct

### Firebase Issues

- **Collection not found:** Create collections manually in Firebase Console
- **Permissions denied:** Check Firestore security rules
- **Connection failed:** Verify firebase-service-account.json is properly configured

---

## Summary

✅ **All user activities are auto-monitored**
✅ **Emails sent automatically based on preferences**
✅ **Professional templates with app logo**
✅ **Complete tracking and logging in Firestore**
✅ **Fully integrated with backend API**
✅ **Ready for production use**

The system is now complete and ready to send emails for all activities!
