// Firebase Admin SDK Configuration
// For server-side operations and Firestore database access

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let serviceAccount;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'backend/firebase-service-account.json';

// Try to load service account JSON file
try {
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(path.resolve(serviceAccountPath));
    console.log('[Firebase] Service account JSON loaded successfully');
  } else {
    console.warn('[Firebase] Service account JSON not found at', serviceAccountPath);
    console.warn('[Firebase] Using Firestore in anonymous/limited mode');
  }
} catch (error) {
  console.warn('[Firebase] Could not load service account:', error.message);
}

// Initialize Firebase Admin
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'trustfin-8e4d1',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'trustfin-8e4d1.appspot.com'
  });
} else {
  // For development/testing without service account
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'trustfin-8e4d1',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'trustfin-8e4d1.appspot.com'
  });
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

// Firestore Collection References
const collections = {
  newsletter: db.collection(process.env.FIRESTORE_COLLECTION_NEWSLETTER || 'newsletter_subscribers'),
  activities: db.collection(process.env.FIRESTORE_COLLECTION_ACTIVITIES || 'user_activities'),
  adminActions: db.collection(process.env.FIRESTORE_COLLECTION_ADMIN || 'admin_actions'),
  emailLogs: db.collection(process.env.FIRESTORE_COLLECTION_EMAIL_LOGS || 'email_logs'),
};

// Enable Firestore offline persistence (optional, for client SDK)
// db.enablePersistence().catch((err) => {
//   if (err.code == 'failed-precondition') {
//     console.warn('[Firebase] Multiple tabs open, persistence only enabled in one tab at a time');
//   } else if (err.code == 'unimplemented') {
//     console.warn('[Firebase] Browser does not support Firestore persistence');
//   }
// });

// Helper function to verify Firestore connection
const verifyConnection = async () => {
  try {
    // Try to read a test document
    const testRef = db.collection('_system').doc('status');
    await testRef.set({ 
      lastChecked: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    }, { merge: true });
    
    console.log('[Firebase] Firestore connection verified successfully');
    return true;
  } catch (error) {
    console.error('[Firebase] Firestore connection verification failed:', error.message);
    return false;
  }
};

// Export Firebase Admin SDK and utilities
module.exports = {
  admin,
  db,
  auth,
  bucket,
  collections,
  verifyConnection,
  FieldValue: admin.firestore.FieldValue,
  Timestamp: admin.firestore.Timestamp,
};
