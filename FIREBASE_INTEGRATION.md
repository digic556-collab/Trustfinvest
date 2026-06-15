# Firebase Firestore Integration Guide

## Overview

TrustFinvest backend now integrates with **Firebase Firestore** for persistent, scalable cloud database storage. This guide covers setup, configuration, and usage.

## Project Details

- **Firebase Project ID**: trustfin-8e4d1
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth (optional)
- **Storage**: Cloud Storage (optional)
- **Region**: US (default)

## Firebase Configuration

### Web Client Config

Your Firebase configuration (from console):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA4WyMCUe4LoNtx3twnwDkOqjrjPPhGB80",
  authDomain: "trustfin-8e4d1.firebaseapp.com",
  projectId: "trustfin-8e4d1",
  storageBucket: "trustfin-8e4d1.firebasestorage.app",
  messagingSenderId: "747695116520",
  appId: "1:747695116520:web:32c2d0428f48e51eca795d",
  measurementId: "G-K0B1534NMD"
};
```

### Environment Variables

All Firebase credentials are stored in `.env`:

```
FIREBASE_API_KEY=AIzaSyA4WyMCUe4LoNtx3twnwDkOqjrjPPhGB80
FIREBASE_AUTH_DOMAIN=trustfin-8e4d1.firebaseapp.com
FIREBASE_PROJECT_ID=trustfin-8e4d1
FIREBASE_STORAGE_BUCKET=trustfin-8e4d1.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=747695116520
FIREBASE_APP_ID=1:747695116520:web:32c2d0428f48e51eca795d
FIREBASE_MEASUREMENT_ID=G-K0B1534NMD
```

## Firestore Collections

### 1. newsletter_subscribers

Stores all newsletter subscribers and their preferences.

**Schema**:
```javascript
{
  email: string,           // Document ID: email normalized
  firstName: string,
  lastName: string,
  subscribedAt: Timestamp,
  unsubscribedAt: Timestamp (optional),
  isActive: boolean,
  preferences: {
    newsletter: boolean,
    activities: boolean,
    investments: boolean,
    withdrawals: boolean,
    promotions: boolean
  },
  tags: string[],          // ['subscriber', 'vip', 'inactive']
  unsubscribeToken: string
}
```

**Indexes**:
- `isActive` (descending) - For querying active subscribers
- `subscribedAt` (descending) - For recent subscribers

### 2. user_activities

Logs all user activities (deposits, investments, withdrawals, etc.).

**Schema**:
```javascript
{
  userId: string,
  userEmail: string,
  userName: string,
  activityType: string,    // 'deposit', 'investment', 'withdrawal', 'earning', 'login', 'task_completed'
  details: {
    amount: number,
    plan: string,
    roi: number,
    duration: number,
    // ... activity-specific data
  },
  timestamp: Timestamp,
  date: string,            // ISO date for easy filtering
  status: string,          // 'completed', 'pending', 'failed'
  notificationSent: boolean,
  notificationSentAt: Timestamp (optional)
}
```

**Indexes**:
- `userId` + `timestamp` (descending) - For user activity history
- `activityType` + `timestamp` - For activity filtering
- `date` - For daily statistics

### 3. admin_actions

Logs all admin operations.

**Schema**:
```javascript
{
  adminId: string,
  adminEmail: string,
  adminName: string,
  actionType: string,      // 'user_created', 'investment_verified', 'withdrawal_approved'
  targetId: string,        // User/investment ID affected
  details: object,
  timestamp: Timestamp,
  date: string,
  status: string           // 'completed', 'pending'
}
```

### 4. email_logs

Tracks all sent emails for debugging and analytics.

**Schema**:
```javascript
{
  toEmail: string,
  toName: string,
  subject: string,
  fromEmail: string,
  fromName: string,
  activityId: string (optional),
  status: string,          // 'sent', 'failed', 'bounced', 'spam'
  timestamp: Timestamp,
  date: string,
  attempts: number,
  lastAttempt: Timestamp
}
```

## Backend Files

### Core Firebase Files

#### 1. backend/firebase-admin.js
Server-side Firebase Admin SDK initialization.

```javascript
const { admin, db, auth, bucket, collections } = require('./backend/firebase-admin');

// Use in your routes
await collections.newsletter.doc(email).set(data);
```

#### 2. backend/firebase-client.js
Client-side Firebase SDK initialization (for frontend).

```javascript
import { auth, db, storage } from './backend/firebase-client';
```

#### 3. backend/services/firestoreService.js
High-level Firestore operations (342 lines).

**Services**:
- `newsletterService` - Subscribe, unsubscribe, get preferences
- `activityService` - Log activities, get history
- `emailLogService` - Log emails, get statistics
- `adminActionService` - Log admin actions
- `batchService` - Bulk operations

## Usage Examples

### Subscribe to Newsletter

```javascript
const { newsletterService } = require('./backend/services/firestoreService');

const result = await newsletterService.subscribe(
  'user@example.com',
  'John',
  'Doe',
  {
    newsletter: true,
    activities: true,
    investments: true
  }
);
```

### Log User Activity

```javascript
const { activityService } = require('./backend/services/firestoreService');

await activityService.logActivity(
  'user123',
  'user@example.com',
  'John Doe',
  'investment',
  {
    amount: 5000,
    plan: 'Premium',
    roi: 12,
    duration: 30,
    maturityDate: '2024-07-15'
  }
);
```

### Get User Activities

```javascript
const activities = await activityService.getUserActivities('user123', 50);
console.log(activities);
```

### Send Email and Log

```javascript
const { emailService } = require('./backend/services/emailService');
const { emailLogService } = require('./backend/services/firestoreService');

// Send email
await emailService.sendInvestmentNotification(
  'user@example.com',
  'John',
  'user123',
  investmentData
);

// Log the send
await emailLogService.logEmail(
  'user@example.com',
  'John',
  'Investment Notification',
  activityId,
  'sent'
);
```

### Get Admin Actions

```javascript
const { adminActionService } = require('./backend/services/firestoreService');

const actions = await adminActionService.getAdminActions(adminId, 100);
```

## Firestore Security Rules

### Recommended Rules (for Firebase Console)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Newsletter subscribers - read only for authenticated users, write for backend
    match /newsletter_subscribers/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
    
    // User activities - read own, write for backend
    match /user_activities/{document=**} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if request.auth.token.admin == true;
    }
    
    // Admin actions - admin only
    match /admin_actions/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
    
    // Email logs - admin only
    match /email_logs/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

## Setup Instructions

### 1. Install Firebase Packages

```bash
npm install firebase-admin firebase
```

### 2. Get Service Account Key (for Admin SDK)

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: trustfin-8e4d1
3. Settings → Service Accounts → Generate New Private Key
4. Save JSON file to `backend/firebase-service-account.json`
5. **IMPORTANT**: Never commit this file to Git!

### 3. Update .env

```
FIREBASE_PROJECT_ID=trustfin-8e4d1
FIREBASE_API_KEY=AIzaSyA4WyMCUe4LoNtx3twnwDkOqjrjPPhGB80
FIREBASE_SERVICE_ACCOUNT_PATH=backend/firebase-service-account.json
```

### 4. Create Firestore Collections

In Firebase Console, create these collections:

1. `newsletter_subscribers`
2. `user_activities`
3. `admin_actions`
4. `email_logs`

Or use the backend to auto-create them on first use.

### 5. Run Backend

```bash
npm install
npm run dev
```

## API Integration

### Using the API Client

```javascript
const api = new TrustFinvestAPI('http://localhost:5000');

// Subscribe to newsletter
await api.subscribeNewsletter('user@example.com', 'John', 'Doe');

// Log investment
await api.logInvestment('user123', 'user@example.com', 'John', 5000, 'Premium', 12);

// Send notification
await api.sendInvestmentNotification('user@example.com', 'John', 'user123', {
  plan: 'Premium',
  amount: 5000,
  roi: 12,
  duration: 30
});

// Get user activities
const activities = await api.getUserActivities('user123');
```

## Querying Data

### Query Active Subscribers

```javascript
const snapshot = await db.collection('newsletter_subscribers')
  .where('isActive', '==', true)
  .limit(100)
  .get();

snapshot.forEach(doc => {
  console.log(doc.id, '=>', doc.data());
});
```

### Query User Activities

```javascript
const snapshot = await db.collection('user_activities')
  .where('userId', '==', 'user123')
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get();
```

### Query Email Logs

```javascript
const snapshot = await db.collection('email_logs')
  .where('status', '==', 'sent')
  .where('date', '>=', '2024-06-01')
  .get();
```

## Performance Tips

1. **Indexing**: Create composite indexes for frequently filtered queries
2. **Pagination**: Use `limit()` and cursor pagination for large datasets
3. **Denormalization**: Store user name/email in activities for fast display
4. **Batching**: Use batch operations for multiple writes
5. **Caching**: Cache frequently accessed data client-side

## Monitoring & Analytics

### Firebase Console

Monitor in real-time:
- https://console.firebase.google.com/project/trustfin-8e4d1/firestore/data

### View Costs

- Storage: $0.06 per GB/month
- Reads: $0.06 per 100k reads
- Writes: $0.18 per 100k writes
- Deletes: $0.02 per 100k deletes

Free tier includes:
- 1 GB storage
- 50k reads/day
- 20k writes/day
- 20k deletes/day

## Troubleshooting

### Connection Failed

**Error**: "Failed to get document because the client is offline"

**Solution**:
```javascript
// Check internet connection
// Ensure Firebase config is correct in .env
// Check Firebase project ID
```

### Permission Denied

**Error**: "PERMISSION_DENIED: Missing or insufficient permissions"

**Solution**:
1. Check Firestore security rules
2. Verify authentication token
3. Check service account permissions
4. See Security Rules section above

### Slow Queries

**Problem**: Queries taking too long

**Solution**:
1. Add composite indexes (Firebase will suggest)
2. Reduce query result size with `limit()`
3. Add `where()` conditions
4. Use pagination

### Rate Limiting

**Error**: "Quota exceeded"

**Solution**:
1. Upgrade Firebase plan
2. Reduce write frequency
3. Batch operations together
4. Implement client-side caching

## Deployment

### Vercel

1. Add environment variables in Vercel dashboard
2. Set `FIREBASE_SERVICE_ACCOUNT_PATH`
3. Upload service account JSON as environment variable
4. Deploy

### Heroku

```bash
heroku config:set FIREBASE_PROJECT_ID=trustfin-8e4d1
heroku config:set FIREBASE_API_KEY=...
```

### Docker

```dockerfile
FROM node:18

WORKDIR /app
COPY . .
RUN npm install

COPY backend/firebase-service-account.json ./backend/

CMD ["npm", "start"]
```

## Additional Resources

- Firebase Docs: https://firebase.google.com/docs
- Firestore Guide: https://firebase.google.com/docs/firestore
- Admin SDK: https://firebase.google.com/docs/database/admin/start
- Pricing: https://firebase.google.com/pricing

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review security rules
3. Check .env configuration
4. Run test-smtp.js to verify setup

