const express = require('express');
const router = express.Router();
const validator = require('validator');
const { v4: uuidv4 } = require('uuid');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { NewsletterSubscriber, UserActivity, AdminActivity, EmailLog } = require('../models');

// ==================== NEWSLETTER ROUTES ====================

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
    try {
        const { email, firstName, lastName } = req.body;

        // Validate email
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        // Check if already subscribed
        let subscriber = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });
        
        if (subscriber) {
            if (subscriber.subscribed) {
                return res.status(200).json({ success: false, message: 'Email already subscribed' });
            } else {
                // Resubscribe
                subscriber.subscribed = true;
                subscriber.unsubscriptionDate = null;
                subscriber.subscriptionDate = new Date();
                await subscriber.save();
            }
        } else {
            // Create new subscriber
            subscriber = new NewsletterSubscriber({
                email: email.toLowerCase(),
                firstName: firstName || '',
                lastName: lastName || '',
                subscribed: true
            });
            await subscriber.save();
        }

        // Send welcome email
        await sendEmail(email, emailTemplates.welcome, { userName: firstName || 'Investor' });

        res.status(201).json({ 
            success: true, 
            message: 'Successfully subscribed to newsletter',
            subscriber: { email: subscriber.email }
        });
    } catch (error) {
        console.error('[Newsletter] Subscription error:', error);
        res.status(500).json({ success: false, message: 'Subscription failed', error: error.message });
    }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        const subscriber = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });

        if (!subscriber || !subscriber.subscribed) {
            return res.status(200).json({ success: false, message: 'Email not found or already unsubscribed' });
        }

        subscriber.subscribed = false;
        subscriber.unsubscriptionDate = new Date();
        await subscriber.save();

        res.status(200).json({ success: true, message: 'Successfully unsubscribed' });
    } catch (error) {
        console.error('[Newsletter] Unsubscription error:', error);
        res.status(500).json({ success: false, message: 'Unsubscription failed', error: error.message });
    }
});

// Get newsletter preferences
router.get('/preferences/:email', async (req, res) => {
    try {
        const { email } = req.params;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        const subscriber = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });

        if (!subscriber) {
            return res.status(404).json({ success: false, message: 'Subscriber not found' });
        }

        res.status(200).json({ success: true, preferences: subscriber.preferences });
    } catch (error) {
        console.error('[Newsletter] Preferences error:', error);
        res.status(500).json({ success: false, message: 'Error fetching preferences', error: error.message });
    }
});

// Update preferences
router.put('/preferences/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { preferences } = req.body;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        const subscriber = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });

        if (!subscriber) {
            return res.status(404).json({ success: false, message: 'Subscriber not found' });
        }

        subscriber.preferences = { ...subscriber.preferences, ...preferences };
        await subscriber.save();

        res.status(200).json({ success: true, message: 'Preferences updated', preferences: subscriber.preferences });
    } catch (error) {
        console.error('[Newsletter] Update preferences error:', error);
        res.status(500).json({ success: false, message: 'Error updating preferences', error: error.message });
    }
});

// ==================== USER ACTIVITY ROUTES ====================

// Log user activity
router.post('/activity/log', async (req, res) => {
    try {
        const { userId, userEmail, userName, type, description, amount, status, metadata } = req.body;

        // Validate required fields
        if (!userId || !userEmail || !userName || !type) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!validator.isEmail(userEmail)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        // Create activity record
        const activity = new UserActivity({
            userId,
            userEmail,
            userName,
            type,
            description,
            amount: amount || 0,
            status: status || 'completed',
            metadata: metadata || {}
        });

        await activity.save();

        // Check if user is subscribed and prefers activity notifications
        const subscriber = await NewsletterSubscriber.findOne({ email: userEmail.toLowerCase() });
        const shouldEmail = subscriber && subscriber.subscribed && subscriber.preferences.activities;

        // Send notification email if user prefers
        if (shouldEmail) {
            const result = await sendEmail(userEmail, emailTemplates.activityNotification, {
                userName,
                activity: {
                    type,
                    description,
                    amount,
                    status,
                    date: new Date()
                }
            });

            if (result.success) {
                activity.emailSent = true;
                activity.emailSentAt = new Date();
                await activity.save();

                // Log email
                await EmailLog.create({
                    to: userEmail,
                    subject: `Activity Alert - ${type}`,
                    type: 'activity',
                    status: 'sent',
                    messageId: result.messageId,
                    relatedActivityId: activity._id,
                    relatedUserId: userId
                });
            }
        }

        res.status(201).json({ 
            success: true, 
            message: 'Activity logged successfully',
            activity: { id: activity._id }
        });
    } catch (error) {
        console.error('[Activity] Logging error:', error);
        res.status(500).json({ success: false, message: 'Error logging activity', error: error.message });
    }
});

// Get user activities
router.get('/activity/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10, skip = 0 } = req.query;

        const activities = await UserActivity.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await UserActivity.countDocuments({ userId });

        res.status(200).json({ 
            success: true, 
            activities,
            pagination: { total, limit: parseInt(limit), skip: parseInt(skip) }
        });
    } catch (error) {
        console.error('[Activity] Fetch error:', error);
        res.status(500).json({ success: false, message: 'Error fetching activities', error: error.message });
    }
});

// ==================== INVESTMENT NOTIFICATION ROUTES ====================

// Send investment confirmation email
router.post('/notification/investment', async (req, res) => {
    try {
        const { userEmail, userName, userId, investment } = req.body;

        if (!userEmail || !validator.isEmail(userEmail)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        // Log activity
        const activity = new UserActivity({
            userId,
            userEmail,
            userName,
            type: 'investment',
            description: `Investment of $${investment.amount} in ${investment.plan} plan`,
            amount: investment.amount,
            status: 'completed',
            metadata: investment
        });
        await activity.save();

        // Send email
        const result = await sendEmail(userEmail, emailTemplates.investmentAlert, {
            userName,
            investment: {
                plan: investment.plan,
                amount: investment.amount,
                roi: investment.roi,
                duration: investment.duration,
                maturityDate: investment.maturityDate,
                id: investment.id || uuidv4()
            }
        });

        if (result.success) {
            activity.emailSent = true;
            activity.emailSentAt = new Date();
            await activity.save();

            await EmailLog.create({
                to: userEmail,
                subject: 'Investment Confirmation',
                type: 'investment',
                status: 'sent',
                messageId: result.messageId,
                relatedActivityId: activity._id,
                relatedUserId: userId
            });
        }

        res.status(200).json({ success: true, message: 'Investment notification sent' });
    } catch (error) {
        console.error('[Investment Notification] Error:', error);
        res.status(500).json({ success: false, message: 'Error sending notification', error: error.message });
    }
});

// ==================== WITHDRAWAL NOTIFICATION ROUTES ====================

// Send withdrawal confirmation email
router.post('/notification/withdrawal', async (req, res) => {
    try {
        const { userEmail, userName, userId, withdrawal } = req.body;

        if (!userEmail || !validator.isEmail(userEmail)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        // Log activity
        const activity = new UserActivity({
            userId,
            userEmail,
            userName,
            type: 'withdrawal',
            description: `Withdrawal request of $${withdrawal.amount} via ${withdrawal.method}`,
            amount: withdrawal.amount,
            status: withdrawal.status || 'pending',
            metadata: withdrawal
        });
        await activity.save();

        // Send email
        const result = await sendEmail(userEmail, emailTemplates.withdrawalAlert, {
            userName,
            withdrawal: {
                amount: withdrawal.amount,
                method: withdrawal.method,
                status: withdrawal.status,
                estimatedTime: withdrawal.estimatedTime,
                id: withdrawal.id || uuidv4()
            }
        });

        if (result.success) {
            activity.emailSent = true;
            activity.emailSentAt = new Date();
            await activity.save();

            await EmailLog.create({
                to: userEmail,
                subject: 'Withdrawal Confirmation',
                type: 'withdrawal',
                status: 'sent',
                messageId: result.messageId,
                relatedActivityId: activity._id,
                relatedUserId: userId
            });
        }

        res.status(200).json({ success: true, message: 'Withdrawal notification sent' });
    } catch (error) {
        console.error('[Withdrawal Notification] Error:', error);
        res.status(500).json({ success: false, message: 'Error sending notification', error: error.message });
    }
});

// ==================== ADMIN ROUTES ====================

// Log admin action
router.post('/admin/action', async (req, res) => {
    try {
        const { adminId, adminEmail, adminName, action, description, targetUserId, targetUserEmail, details, affectedUsers } = req.body;

        if (!adminEmail || !validator.isEmail(adminEmail)) {
            return res.status(400).json({ success: false, message: 'Invalid admin email' });
        }

        const adminActivity = new AdminActivity({
            adminId,
            adminEmail,
            adminName,
            action,
            description,
            targetUserId: targetUserId || null,
            targetUserEmail: targetUserEmail || null,
            details: details || {},
            affectedUsers: affectedUsers || 1
        });

        await adminActivity.save();

        // If action affects a specific user, send them notification
        if (targetUserEmail && validator.isEmail(targetUserEmail)) {
            const result = await sendEmail(targetUserEmail, emailTemplates.activityNotification, {
                userName: targetUserEmail.split('@')[0],
                activity: {
                    type: action,
                    description,
                    amount: 0,
                    status: 'admin_action',
                    date: new Date()
                }
            });

            if (result.success) {
                adminActivity.emailSent = true;
                await adminActivity.save();
            }
        }

        res.status(201).json({ 
            success: true, 
            message: 'Admin action logged',
            adminActivity: { id: adminActivity._id }
        });
    } catch (error) {
        console.error('[Admin Action] Error:', error);
        res.status(500).json({ success: false, message: 'Error logging admin action', error: error.message });
    }
});

// Send bulk newsletter
router.post('/admin/newsletter/send', async (req, res) => {
    try {
        const { content, subject, targetGroup = 'all' } = req.body;

        if (!content || !subject) {
            return res.status(400).json({ success: false, message: 'Content and subject are required' });
        }

        // Get subscribers based on target group
        const query = { subscribed: true };
        if (targetGroup === 'active') {
            query['preferences.newsletter'] = true;
        }

        const subscribers = await NewsletterSubscriber.find(query);
        let sentCount = 0;
        let failedCount = 0;

        // Send to all subscribers
        for (const subscriber of subscribers) {
            const result = await sendEmail(subscriber.email, emailTemplates.newsletter, {
                content
            });

            if (result.success) {
                sentCount++;
                await EmailLog.create({
                    to: subscriber.email,
                    subject,
                    type: 'newsletter',
                    status: 'sent',
                    messageId: result.messageId
                });
            } else {
                failedCount++;
                await EmailLog.create({
                    to: subscriber.email,
                    subject,
                    type: 'newsletter',
                    status: 'failed',
                    error: result.error
                });
            }
        }

        res.status(200).json({ 
            success: true, 
            message: `Newsletter sent to ${sentCount} subscribers`,
            results: { sent: sentCount, failed: failedCount, total: subscribers.length }
        });
    } catch (error) {
        console.error('[Newsletter Campaign] Error:', error);
        res.status(500).json({ success: false, message: 'Error sending newsletter', error: error.message });
    }
});

// Get email logs
router.get('/admin/logs/emails', async (req, res) => {
    try {
        const { limit = 50, skip = 0, status, type } = req.query;
        const query = {};

        if (status) query.status = status;
        if (type) query.type = type;

        const logs = await EmailLog.find(query)
            .sort({ sentAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await EmailLog.countDocuments(query);

        res.status(200).json({ 
            success: true, 
            logs,
            pagination: { total, limit: parseInt(limit), skip: parseInt(skip) }
        });
    } catch (error) {
        console.error('[Email Logs] Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching logs', error: error.message });
    }
});

// Get subscriber count
router.get('/admin/subscribers/count', async (req, res) => {
    try {
        const totalSubscribers = await NewsletterSubscriber.countDocuments();
        const activeSubscribers = await NewsletterSubscriber.countDocuments({ subscribed: true });
        const unsubscribed = totalSubscribers - activeSubscribers;

        res.status(200).json({ 
            success: true, 
            stats: {
                total: totalSubscribers,
                active: activeSubscribers,
                unsubscribed: unsubscribed
            }
        });
    } catch (error) {
        console.error('[Subscriber Stats] Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
    }
});

module.exports = router;
