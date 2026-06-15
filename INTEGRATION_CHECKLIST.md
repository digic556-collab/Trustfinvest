# Email Listener System - Integration Checklist

## System Overview

The email system now automatically listens to all user activities and sends personalized emails. No manual email sending required - everything is automated!

**Backend listens to 9 activity types:**
1. New user registration → Welcome email
2. User login (returning) → Welcome back email
3. Deposit → Confirmation email
4. Investment created → Confirmation email
5. Withdrawal initiated → Notification email
6. Withdrawal approved → Approval email
7. Task completed → Reward email
8. Daily earnings → Summary email
9. Activity alert → Alert email

---

## Files Ready to Use

### Email Service (903 lines)
**File:** `backend/services/emailService.js`

Contains:
- 10 professional HTML email templates
- All templates include app logo
- All templates include brand colors
- 11 email sending functions (one for each template type)
- Responsive design for mobile/desktop
- Personalized greetings with user names

### Activity Listener (397 lines)
**File:** `backend/services/activityListener.js`

Contains:
- Auto-listeners for 9 activity types
- Checks user email preferences
- Logs emails to Firestore
- Routes activities to correct email handler
- `autoSendEmail()` function for routing

---

## How to Integrate

### Step 1: Update Routes

In `backend/routes/index.js`, add activity listener calls to each route.

#### Example 1: User Registration Route

```javascript
const activityListener = require('../services/activityListener');

router.post('/auth/register', async (req, res) => {
    try {
        const { email, firstName, lastName, password } = req.body;
        
        // ... create user in database ...
        
        const newUser = {
            id: userId,
            email,
            firstName,
            lastName
        };
        
        // AUTO-SEND WELCOME EMAIL
        await activityListener.onUserRegistration({
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            userId: newUser.id
        });
        
        res.status(201).json({ success: true, user: newUser });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

#### Example 2: Deposit Route

```javascript
router.post('/deposit', async (req, res) => {
    try {
        const { userId, amount, method } = req.body;
        
        // ... process deposit ...
        
        const deposit = {
            id: depositId,
            userId,
            amount,
            reference: depositReference
        };
        
        // Get user info
        const user = await getUserById(userId);
        
        // AUTO-SEND DEPOSIT CONFIRMATION
        await activityListener.onDeposit({
            userId,
            email: user.email,
            userName: user.firstName,
            amount,
            reference: deposit.id
        });
        
        res.json({ success: true, deposit });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

#### Example 3: Investment Route

```javascript
router.post('/investment', async (req, res) => {
    try {
        const { userId, plan, amount, duration } = req.body;
        
        // ... create investment ...
        
        const investment = {
            id: investmentId,
            userId,
            plan,
            amount,
            roi: getPlanROI(plan),
            duration,
            createdAt: new Date()
        };
        
        // Get user info
        const user = await getUserById(userId);
        
        // AUTO-SEND INVESTMENT CONFIRMATION
        await activityListener.onInvestment({
            userId,
            email: user.email,
            userName: user.firstName,
            plan: investment.plan,
            amount: investment.amount,
            roi: investment.roi,
            duration: investment.duration
        });
        
        res.json({ success: true, investment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

#### Example 4: Withdrawal Route

```javascript
router.post('/withdrawal', async (req, res) => {
    try {
        const { userId, amount, method } = req.body;
        
        // ... create withdrawal request ...
        
        const withdrawal = {
            id: withdrawalId,
            userId,
            amount,
            method,
            status: 'initiated',
            createdAt: new Date()
        };
        
        // Get user info
        const user = await getUserById(userId);
        
        // AUTO-SEND WITHDRAWAL INITIATED EMAIL
        await activityListener.onWithdrawalInitiated({
            userId,
            email: user.email,
            userName: user.firstName,
            amount,
            method
        });
        
        res.json({ success: true, withdrawal });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// When admin approves withdrawal
router.post('/admin/withdrawal/approve', async (req, res) => {
    try {
        const { withdrawalId } = req.body;
        
        // ... approve withdrawal ...
        
        const withdrawal = await getWithdrawalById(withdrawalId);
        const user = await getUserById(withdrawal.userId);
        
        // AUTO-SEND WITHDRAWAL APPROVED EMAIL
        await activityListener.onWithdrawalApproved({
            userId: withdrawal.userId,
            email: user.email,
            userName: user.firstName,
            amount: withdrawal.amount,
            method: withdrawal.method
        });
        
        res.json({ success: true, message: 'Withdrawal approved' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

#### Example 5: Task Completion Route

```javascript
router.post('/task/complete', async (req, res) => {
    try {
        const { userId, taskId } = req.body;
        
        // ... mark task as complete and add reward ...
        
        const task = await getTaskById(taskId);
        const reward = calculateReward(task);
        
        // Get user info
        const user = await getUserById(userId);
        
        // AUTO-SEND TASK COMPLETION EMAIL
        await activityListener.onTaskCompleted({
            userId,
            email: user.email,
            userName: user.firstName,
            taskTitle: task.title,
            reward
        });
        
        res.json({ success: true, reward });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

---

## Email Preference Management

### Get User Email Preferences

```javascript
router.get('/preferences/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const doc = await db.collection('newsletter_subscribers')
            .doc(email)
            .get();
        
        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({
            success: true,
            email,
            preferences: doc.data().preferences || {
                newsletter: true,
                activities: true,
                investments: true,
                tasks: true,
                alerts: true
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

### Update User Email Preferences

```javascript
router.put('/preferences/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { preferences } = req.body;
        
        await db.collection('newsletter_subscribers')
            .doc(email)
            .update({
                preferences: {
                    newsletter: preferences.newsletter !== false,
                    activities: preferences.activities !== false,
                    investments: preferences.investments !== false,
                    tasks: preferences.tasks !== false,
                    alerts: preferences.alerts !== false
                },
                updatedAt: new Date()
            });
        
        res.json({ success: true, message: 'Preferences updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

---

## Activity Listener API

### Auto-Send Email by Activity Type

```javascript
const ActivityListener = require('./services/activityListener');

// Generic function to handle any activity type
async function triggerEmailForActivity(activityType, activityData) {
    const result = await ActivityListener.autoSendEmail(activityType, activityData);
    return result;
}

// Usage examples:
// User registration
triggerEmailForActivity('new_user_registered', {
    email: 'user@example.com',
    firstName: 'John',
    userId: 'user123'
});

// User login
triggerEmailForActivity('user_login', {
    email: 'user@example.com',
    firstName: 'John',
    userId: 'user123',
    lastLogin: '2 weeks ago'
});

// Deposit
triggerEmailForActivity('deposit', {
    userId: 'user123',
    email: 'user@example.com',
    userName: 'John',
    amount: 5000,
    reference: 'DEP-001'
});
```

---

## Testing the System

### Test Email Sending

```bash
# 1. Start backend server
npm run dev

# 2. Test SMTP connection first
node test-smtp.js

# 3. Test new user registration email
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "password123"
  }'

# 4. Check email was sent (check your inbox or test email service)

# 5. View email logs
curl http://localhost:5000/api/email/admin/logs/emails
```

### Check Email Logs in Firestore

1. Go to Firebase Console
2. Select `trustfin-8e4d1` project
3. Go to Firestore Database
4. View `email_logs` collection
5. All sent emails are recorded here

---

## Frontend Integration

### Include API Client

```html
<script src="http://localhost:5000/backend/client.js"></script>
```

### Initialize API

```javascript
const api = new TrustFinvestAPI('http://localhost:5000');
```

### Trigger Activities (Auto-Sends Emails)

```javascript
// 1. Register user - Auto-sends welcome email
api.registerUser({
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'password123'
});

// 2. Make deposit - Auto-sends deposit email
api.makeDeposit({
    userId: 'user123',
    amount: 5000,
    method: 'credit_card'
});

// 3. Create investment - Auto-sends investment email
api.createInvestment({
    userId: 'user123',
    plan: 'Premium',
    amount: 5000,
    duration: 30
});

// 4. Withdraw - Auto-sends withdrawal emails
api.initiateWithdrawal({
    userId: 'user123',
    amount: 1500,
    method: 'bank_transfer'
});

// 5. Complete task - Auto-sends task email
api.completeTask({
    userId: 'user123',
    taskId: 'task_456'
});
```

---

## Dashboard Integration

### Show Email Preferences in Dashboard

```html
<!-- In dashboard.html settings section -->
<div class="email-preferences">
    <h3>Email Preferences</h3>
    
    <label>
        <input type="checkbox" name="newsletter" id="newsletter"> 
        Receive newsletters
    </label>
    
    <label>
        <input type="checkbox" name="activities" id="activities"> 
        Activity notifications
    </label>
    
    <label>
        <input type="checkbox" name="investments" id="investments"> 
        Investment updates
    </label>
    
    <label>
        <input type="checkbox" name="tasks" id="tasks"> 
        Task rewards
    </label>
    
    <label>
        <input type="checkbox" name="alerts" id="alerts"> 
        Security alerts
    </label>
    
    <button id="savePreferences">Save Preferences</button>
</div>

<script>
// Load preferences on page load
async function loadPreferences() {
    const email = getCurrentUserEmail();
    const prefs = await api.getEmailPreferences(email);
    
    document.getElementById('newsletter').checked = prefs.newsletter;
    document.getElementById('activities').checked = prefs.activities;
    document.getElementById('investments').checked = prefs.investments;
    document.getElementById('tasks').checked = prefs.tasks;
    document.getElementById('alerts').checked = prefs.alerts;
}

// Save preferences
document.getElementById('savePreferences').addEventListener('click', async () => {
    const email = getCurrentUserEmail();
    const preferences = {
        newsletter: document.getElementById('newsletter').checked,
        activities: document.getElementById('activities').checked,
        investments: document.getElementById('investments').checked,
        tasks: document.getElementById('tasks').checked,
        alerts: document.getElementById('alerts').checked
    };
    
    await api.updateEmailPreferences(email, preferences);
    alert('Preferences saved!');
});

loadPreferences();
</script>
```

---

## Troubleshooting

### Emails Not Sending?

1. **Check backend is running**
   ```bash
   npm run dev
   ```

2. **Test SMTP connection**
   ```bash
   node test-smtp.js
   ```

3. **Check user preferences**
   - Verify email notifications are enabled
   - Check if specific activity type is enabled

4. **Check console logs**
   - Look for `[Email]` messages
   - Look for `[ActivityListener]` messages

5. **Check Firestore email_logs**
   - Go to Firebase Console
   - View email_logs collection
   - Look for recent email attempts

### Logo Not Showing?

1. Verify `LOGO_URL` in `emailService.js`
2. Test that URL directly in browser
3. Update if image URL is wrong

### Wrong Email Recipient?

1. Verify email addresses in user data
2. Check user email is correct in database
3. Verify email not blacklisted

---

## Complete Checklist

### Backend Integration
- [ ] Add `const activityListener = require('../services/activityListener');` to routes
- [ ] Add listener calls to user registration route
- [ ] Add listener calls to deposit route
- [ ] Add listener calls to investment route
- [ ] Add listener calls to withdrawal routes
- [ ] Add listener calls to task completion route
- [ ] Add email preferences GET/PUT routes
- [ ] Test each route individually

### Frontend Integration
- [ ] Include API client script
- [ ] Create email preferences UI in dashboard
- [ ] Add preference loading on page load
- [ ] Add preference saving functionality
- [ ] Update forms to trigger activities

### Testing
- [ ] Test new user registration email
- [ ] Test deposit confirmation email
- [ ] Test investment confirmation email
- [ ] Test withdrawal initiated email
- [ ] Test withdrawal approved email
- [ ] Test task completion email
- [ ] Verify emails appear in inbox
- [ ] Check Firestore email_logs collection

### Deployment
- [ ] All tests passing
- [ ] Production SMTP credentials set
- [ ] Firebase credentials verified
- [ ] No console errors
- [ ] CORS properly configured
- [ ] Ready for production deployment

---

## Summary

The email listener system is complete and ready to use:

✅ **10 professional email templates** with app logo
✅ **9 activity types** auto-monitored
✅ **Automatic email sending** without manual intervention
✅ **User preferences** fully customizable
✅ **Firestore logging** for all emails
✅ **Production-ready** code

Just add the activity listener calls to your routes and start using!
