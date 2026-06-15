const mongoose = require('mongoose');

// Newsletter Subscriber Schema
const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    subscribed: {
        type: Boolean,
        default: true
    },
    subscriptionDate: {
        type: Date,
        default: Date.now
    },
    unsubscriptionDate: {
        type: Date,
        default: null
    },
    preferences: {
        newsletter: { type: Boolean, default: true },
        activities: { type: Boolean, default: true },
        investments: { type: Boolean, default: true },
        promotions: { type: Boolean, default: true }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// User Activity Schema
const activitySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['deposit', 'investment', 'withdrawal', 'earning', 'task_completed', 'referral', 'login', 'profile_update', 'plan_change', 'admin_action'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    metadata: {
        type: Object,
        default: {}
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Admin Activity Schema
const adminActivitySchema = new mongoose.Schema({
    adminId: {
        type: String,
        required: true
    },
    adminEmail: {
        type: String,
        required: true
    },
    adminName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['user_verified', 'user_blocked', 'withdrawal_approved', 'withdrawal_rejected', 'system_update', 'payment_processed', 'report_generated', 'settings_changed', 'email_campaign'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    targetUserId: {
        type: String,
        default: null
    },
    targetUserEmail: {
        type: String,
        default: null
    },
    details: {
        type: Object,
        default: {}
    },
    affectedUsers: {
        type: Number,
        default: 0
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Email Log Schema
const emailLogSchema = new mongoose.Schema({
    to: {
        type: String,
        required: true
    },
    from: {
        type: String,
        default: process.env.SMTP_FROM_EMAIL
    },
    subject: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['welcome', 'newsletter', 'activity', 'investment', 'withdrawal', 'admin', 'campaign'],
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'failed', 'bounced'],
        default: 'sent'
    },
    messageId: {
        type: String,
        default: null
    },
    error: {
        type: String,
        default: null
    },
    relatedActivityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    relatedUserId: {
        type: String,
        default: null
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
});

// Create models
const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSchema);
const UserActivity = mongoose.model('UserActivity', activitySchema);
const AdminActivity = mongoose.model('AdminActivity', adminActivitySchema);
const EmailLog = mongoose.model('EmailLog', emailLogSchema);

module.exports = {
    NewsletterSubscriber,
    UserActivity,
    AdminActivity,
    EmailLog
};
