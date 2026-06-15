const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import Firebase and Firestore
const { verifyConnection } = require('./backend/firebase-admin');

// Import routes
const emailRoutes = require('./backend/routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// ==================== FIREBASE CONNECTION ====================

let firestoreReady = false;

// Verify Firestore connection on startup
verifyConnection().then(isConnected => {
    firestoreReady = isConnected;
    if (isConnected) {
        console.log('[Firebase] Firestore database connected and verified');
    } else {
        console.warn('[Firebase] Firestore connection verification failed');
    }
}).catch(error => {
    console.error('[Firebase] Connection error:', error.message);
});

// ==================== LOGGING MIDDLEWARE ====================

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ==================== HEALTH CHECK ENDPOINT ====================

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'TrustFinvest Backend is running',
        timestamp: new Date().toISOString(),
        database: firestoreReady ? 'connected' : 'connecting',
        uptime: process.uptime()
    });
});

// ==================== API ROUTES ====================

// Mount email/newsletter routes
app.use('/api/email', emailRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.status(200).json({
        service: 'TrustFinvest Newsletter & Notification Service',
        version: '1.0.0',
        database: 'Firebase Firestore',
        endpoints: {
            newsletter: {
                'POST /api/email/subscribe': 'Subscribe to newsletter',
                'POST /api/email/unsubscribe': 'Unsubscribe from newsletter',
                'GET /api/email/preferences/:email': 'Get email preferences',
                'PUT /api/email/preferences/:email': 'Update email preferences',
                'POST /api/email/admin/newsletter/send': 'Send bulk newsletter (admin)'
            },
            activity: {
                'POST /api/email/activity/log': 'Log user activity',
                'GET /api/email/activity/user/:userId': 'Get user activities',
                'POST /api/email/notification/investment': 'Send investment notification',
                'POST /api/email/notification/withdrawal': 'Send withdrawal notification'
            },
            admin: {
                'POST /api/email/admin/action': 'Log admin action',
                'GET /api/email/admin/logs/emails': 'Get email logs',
                'GET /api/email/admin/subscribers/count': 'Get subscriber statistics'
            }
        },
        config: {
            smtp: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                fromEmail: process.env.SMTP_FROM_EMAIL,
                fromName: process.env.SMTP_FROM_NAME
            },
            firebase: {
                projectId: process.env.FIREBASE_PROJECT_ID,
                authDomain: process.env.FIREBASE_AUTH_DOMAIN,
                database: 'Firestore'
            }
        }
    });
});

// ==================== 404 HANDLER ====================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path
    });
});

// ==================== ERROR HANDLER ====================

app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     TrustFinvest Newsletter & Notification Service      ║');
    console.log('║              Firebase Firestore Edition                 ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Environment] ${process.env.NODE_ENV}`);
    console.log(`[SMTP] ${process.env.SMTP_USER} @ ${process.env.SMTP_HOST}`);
    console.log(`[Firebase] Project: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`[Firestore] Status: ${firestoreReady ? 'Connected' : 'Connecting'}`);
    console.log('');
    console.log('[API] Documentation: GET /api/docs');
    console.log('[Health] Check: GET /health');
    console.log('');
});

module.exports = app;
