#!/usr/bin/env node

/**
 * TrustFinvest Firebase Setup Guide
 * Run: node FIREBASE_SETUP.js
 */

const fs = require('fs');
const path = require('path');

console.clear();
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║         TrustFinvest - Firebase Firestore Setup Guide              ║');
console.log('║         Firebase Project: trustfin-8e4d1                           ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// Step 1: Check Node version
console.log('STEP 1: Checking Environment');
console.log('─'.repeat(70));
console.log(`✓ Node.js version: ${process.version}`);
console.log(`✓ NPM installed: v${require('npm/package.json').version}`);
console.log(`✓ Current directory: ${process.cwd()}\n`);

// Step 2: Check .env file
console.log('STEP 2: Checking Configuration Files');
console.log('─'.repeat(70));

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✓ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const firebaseLines = envContent.split('\n').filter(line => line.includes('FIREBASE'));
  console.log(`✓ Firebase config lines: ${firebaseLines.length}`);
} else {
  console.log('✗ .env file not found! Create it first.');
  process.exit(1);
}

// Step 3: Check Firebase files
console.log('\nSTEP 3: Checking Backend Firebase Files');
console.log('─'.repeat(70));

const firebaseFiles = [
  'backend/firebase-admin.js',
  'backend/firebase-client.js',
  'backend/services/firestoreService.js'
];

firebaseFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const size = fs.statSync(filePath).size;
    console.log(`✓ ${file} (${(size / 1024).toFixed(2)}KB)`);
  } else {
    console.log(`✗ ${file} NOT FOUND`);
  }
});

// Step 4: Installation steps
console.log('\nSTEP 4: Installation Instructions');
console.log('─'.repeat(70));

const steps = [
  {
    title: '4.1 Install Dependencies',
    commands: [
      'npm install',
      'npm install firebase-admin firebase'
    ]
  },
  {
    title: '4.2 Download Service Account Key',
    commands: [
      '1. Go to: https://console.firebase.google.com/',
      '2. Select project: trustfin-8e4d1',
      '3. Go to: Settings → Service Accounts',
      '4. Click: Generate New Private Key',
      '5. Save as: backend/firebase-service-account.json',
      '6. IMPORTANT: Add to .gitignore (never commit!)'
    ]
  },
  {
    title: '4.3 Create Firestore Collections',
    commands: [
      '1. Go to Firestore Database in Firebase Console',
      '2. Create Collection: newsletter_subscribers',
      '3. Create Collection: user_activities',
      '4. Create Collection: admin_actions',
      '5. Create Collection: email_logs'
    ]
  },
  {
    title: '4.4 Verify Configuration',
    commands: [
      'node test-smtp.js     # Test SMTP connection',
      'npm run dev           # Start development server'
    ]
  }
];

steps.forEach((step, idx) => {
  console.log(`\n${step.title}`);
  step.commands.forEach((cmd, cmdIdx) => {
    console.log(`   ${cmd}`);
  });
});

// Step 5: Environment Variables
console.log('\n\nSTEP 5: Required Environment Variables');
console.log('─'.repeat(70));

const requiredVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD'
];

console.log('\nVerifying .env variables:\n');
const envContent = fs.readFileSync(envPath, 'utf8');
requiredVars.forEach(varName => {
  const isPresent = envContent.includes(`${varName}=`);
  const status = isPresent ? '✓' : '✗';
  console.log(`${status} ${varName}`);
});

// Step 6: Collections Info
console.log('\n\nSTEP 6: Firestore Collections Overview');
console.log('─'.repeat(70));

const collections = [
  {
    name: 'newsletter_subscribers',
    description: 'Email subscribers with preferences',
    documents: 'Email-based IDs'
  },
  {
    name: 'user_activities',
    description: 'User actions (deposits, investments, etc)',
    documents: 'Activity IDs'
  },
  {
    name: 'admin_actions',
    description: 'Admin operations (user management, approvals)',
    documents: 'Action IDs'
  },
  {
    name: 'email_logs',
    description: 'Email delivery tracking and logs',
    documents: 'Log IDs'
  }
];

collections.forEach(col => {
  console.log(`\n📋 ${col.name}`);
  console.log(`   Purpose: ${col.description}`);
  console.log(`   ID Type: ${col.documents}`);
});

// Step 7: Quick Test
console.log('\n\nSTEP 7: Quick Start After Installation');
console.log('─'.repeat(70));

const quickStartCode = `
# 1. Install everything
npm install

# 2. Test SMTP
node test-smtp.js

# 3. Start server
npm run dev

# 4. In another terminal, test the API
curl http://localhost:5000/health

# 5. Test newsletter subscription
curl -X POST http://localhost:5000/api/email/subscribe \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "preferences": {
      "newsletter": true,
      "activities": true
    }
  }'
`;

console.log(quickStartCode);

// Step 8: Troubleshooting
console.log('\n\nSTEP 8: Troubleshooting Guide');
console.log('─'.repeat(70));

const issues = [
  {
    problem: 'Firebase connection fails',
    solution: 'Check service account JSON file location and permissions'
  },
  {
    problem: 'PERMISSION_DENIED errors',
    solution: 'Review Firestore security rules in Firebase Console'
  },
  {
    problem: 'SMTP emails not sending',
    solution: 'Verify Hostinger SMTP credentials in .env'
  },
  {
    problem: 'Port 5000 already in use',
    solution: 'Change PORT in .env or kill process: lsof -i :5000'
  },
  {
    problem: 'Collections not found',
    solution: 'Create collections manually in Firebase Console'
  }
];

issues.forEach(issue => {
  console.log(`\n❌ ${issue.problem}`);
  console.log(`   ✓ ${issue.solution}`);
});

// Final checklist
console.log('\n\nFINAL CHECKLIST');
console.log('─'.repeat(70));
console.log('Before running the backend, confirm:');
console.log('\n□ .env file exists with Firebase config');
console.log('□ package.json has firebase-admin and firebase');
console.log('□ backend/firebase-service-account.json downloaded and placed');
console.log('□ Firestore collections created in Firebase Console');
console.log('□ Hostinger SMTP credentials confirmed');
console.log('□ Port 5000 is available');
console.log('□ Internet connection working\n');

// Ready message
console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║                    READY TO START BACKEND!                         ║');
console.log('║                                                                    ║');
console.log('║  Next steps:                                                       ║');
console.log('║    1. npm install                                                  ║');
console.log('║    2. Download Firebase service account JSON                       ║');
console.log('║    3. Create Firestore collections                                 ║');
console.log('║    4. npm run dev                                                  ║');
console.log('║                                                                    ║');
console.log('║  Documentation:                                                    ║');
console.log('║    • FIREBASE_INTEGRATION.md - Complete Firebase guide             ║');
console.log('║    • BACKEND_SETUP.md        - API documentation                   ║');
console.log('║    • QUICK_START.md          - 5-minute setup                      ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');
