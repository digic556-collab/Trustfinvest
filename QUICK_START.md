# Email Listener System - Quick Start Guide

## 🚀 30-Second Overview

Your email system is complete and ready to use!

**What it does:**
- Automatically listens to all user activities
- Sends professional branded emails
- Includes app logo in every email
- No manual email setup required

**How to use it:**
1. Copy-paste listener calls into your routes
2. Done! Emails send automatically

---

## 📧 Email Types (10 Total)

| Activity | Email | Auto-Sent? |
|----------|-------|-----------|
| User registers | Welcome email | ✅ YES |
| User logs in (returning) | Welcome back | ✅ YES |
| User deposits | Confirmation | ✅ YES |
| User invests | Confirmation | ✅ YES |
| Withdrawal requested | Notification | ✅ YES |
| Withdrawal approved | Approval | ✅ YES |
| Task completed | Reward | ✅ YES |
| Daily earnings | Summary | ✅ YES |
| Activity alert | Alert | ✅ YES |
| Newsletter | Newsletter | ✅ YES |

---

## 🎯 3-Step Integration

### Step 1: Import the Listener

```javascript
const activityListener = require('../services/activityListener');
```

### Step 2: Add to Your Routes

In each route where an activity happens, add:

```javascript
// For user registration
await activityListener.onUserRegistration({
    email: user.email,
    firstName: user.firstName,
    userId: user.id
});

// For deposit
await activityListener.onDeposit({
    userId: user.id,
    email: user.email,
    userName: user.firstName,
    amount: depositAmount,
    reference: transactionId
});

// For investment
await activityListener.onInvestment({
    userId: user.id,
    email: user.email,
    userName: user.firstName,
    plan: investmentPlan,
    amount: investmentAmount,
    roi: planROI,
    duration: planDuration
});

// For withdrawal
await activityListener.onWithdrawalInitiated({
    userId: user.id,
    email: user.email,
    userName: user.firstName,
    amount: withdrawalAmount,
    method: withdrawalMethod
});

// For task completion
await activityListener.onTaskCompleted({
    userId: user.id,
    email: user.email,
    userName: user.firstName,
    taskTitle: task.title,
    reward: task.reward
});
```

### Step 3: Test It

Make a user account → Check your email → Done!

---

## 📁 Key Files

- **`backend/services/emailService.js`** (903 lines)
  - All 10 email templates with app logo
  - Professional HTML/CSS
  - Ready for production

- **`backend/services/activityListener.js`** (397 lines)
  - Listens to all 9 activity types
  - Automatically sends emails
  - Checks user preferences

- **`EMAIL_LISTENERS_GUIDE.md`**
  - Complete documentation
  - All activity types explained
  - Integration examples

- **`INTEGRATION_CHECKLIST.md`**
  - Step-by-step integration
  - Code examples for each route
  - Testing instructions

---

## ✨ Features

✅ **App Logo** - Included in every email
✅ **Brand Colors** - Professional design
✅ **Responsive** - Mobile & desktop friendly
✅ **Personalized** - Uses user names
✅ **Action Buttons** - Links to dashboard
✅ **Logged** - All emails tracked in Firestore
✅ **Preferences** - Users can opt-in/out
✅ **Production Ready** - Use it now!

---

## 🔧 Email Listener Functions

```javascript
// Authentication
onUserRegistration(userData)
onUserLogin(userData)

// Financial
onDeposit(depositData)
onInvestment(investmentData)
onWithdrawalInitiated(withdrawalData)
onWithdrawalApproved(withdrawalData)

// Activities
onTaskCompleted(taskData)
onDailyEarnings(earningsData)
onActivityAlert(alertData)

// Newsletter
newsletter(content)
```

---

## 📊 Email Preferences

Users can enable/disable:
- `newsletter` - Marketing emails
- `activities` - Notifications
- `investments` - Investment updates
- `tasks` - Task rewards
- `alerts` - Security alerts

API endpoints:
```
GET  /api/email/preferences/:email
PUT  /api/email/preferences/:email
```

---

## 📧 Sample Email Content

### New User Registration
```
🎉 Welcome to TrustFinvest!

Hi John,
Thank you for joining TrustFinvest...
Start investing today and earn daily returns!

[Access Your Dashboard]
```

### Deposit Confirmation
```
💰 Deposit Confirmed!

Hi John,
Your deposit of $5,000 has been confirmed.
Reference: DEP-2024-001234

Choose an investment plan and start earning!

[Start Investing Now]
```

### Investment Created
```
🎯 Investment Confirmed!

Hi John,
Plan: Premium
Amount: $5,000
ROI: 12% per month
Duration: 30 days

Expected Earnings:
Daily: $20
Total Return: $600

[View Your Portfolio]
```

---

## 🧪 Testing

### Test an Activity
```bash
# Create a test user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "password": "pass123"
  }'

# Check your email for welcome message!
```

### View Email Logs
```bash
# In Firebase Console:
# Go to Firestore → Collections → email_logs
# See all emails sent with timestamps and status
```

---

## 🚦 System Status

| Component | Status |
|-----------|--------|
| Email Templates | ✅ Complete |
| Activity Listeners | ✅ Complete |
| App Logo Integration | ✅ Complete |
| User Preferences | ✅ Complete |
| Firestore Logging | ✅ Complete |
| Production Ready | ✅ YES |

---

## ❓ Common Questions

**Q: Do I need to manually send emails?**
A: No! Everything is automatic.

**Q: How many email templates?**
A: 10 templates for all activity types.

**Q: Are emails professional?**
A: Yes! All have app logo, brand colors, responsive design.

**Q: Can users opt-out?**
A: Yes! Email preferences fully customizable.

**Q: Is everything logged?**
A: Yes! Every email logged to Firestore with timestamp and status.

---

## 📚 Documentation

- **EMAIL_LISTENERS_GUIDE.md** - Complete guide (658 lines)
- **INTEGRATION_CHECKLIST.md** - Step-by-step integration (615 lines)
- **EMAIL_SYSTEM_COMPLETE.txt** - Full implementation summary

---

## 🎯 Next Steps

1. Read **INTEGRATION_CHECKLIST.md** for detailed integration steps
2. Add listener calls to your routes (copy-paste examples)
3. Create test accounts and verify emails
4. Deploy with confidence!

---

## 💡 Pro Tips

1. **Always include user's first name** in listener calls
2. **Check user preferences** before sending (system does this automatically)
3. **Log errors** to console for debugging
4. **Test thoroughly** with your actual email

---

## 📞 Support

For detailed documentation, see:
- **EMAIL_LISTENERS_GUIDE.md** - All activity types explained
- **INTEGRATION_CHECKLIST.md** - Code examples for every route

Everything is documented and ready to use!

---

✅ **Your email system is ready!**
- Start integrating now
- Follow INTEGRATION_CHECKLIST.md
- Emails will send automatically
