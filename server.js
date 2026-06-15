const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

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

// ==================== DATABASE CONNECTION ====================

// Connect to MongoDB (optional - for development)
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('[Database] Connected to MongoDB');
    })
    .catch(err => {
        console.warn('[Database] MongoDB connection warning (proceeding without DB):', err.message);
        console.log('[Database] Running in API-only mode without persistence');
    });
} else {
    console.log('[Database] MongoDB URI not configured - running in API-only mode');
}

// ==================== LOGGING MIDDLEWARE ====================

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ==================== HEALTH CHECK ENDPOINT ====================

app.get('/health', (req, res) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
        status: 'ok',
        message: 'TrustFinvest Backend is running',
        timestamp: new Date().toISOString(),
        database: mongoStatus,
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
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Environment] ${process.env.NODE_ENV}`);
    console.log(`[SMTP] ${process.env.SMTP_USER} @ ${process.env.SMTP_HOST}`);
    console.log(`[Database] ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log('');
    console.log('[API] Documentation: GET /api/docs');
    console.log('[Health] Check: GET /health');
    console.log('');
});

module.exports = app;
