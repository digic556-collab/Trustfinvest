
const express = require('express');
const router = express.Router();
const validator = require('validator');
const { v4: uuidv4 } = require('uuid');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { db, collections, FieldValue } = require('../firebase-admin');

// ==================== NEWSLETTER ROUTES ====================

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
    try {
        const { email, firstName, lastName } = req.body;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        const lowerCaseEmail = email.toLowerCase();
        const snapshot = await collections.newsletter.where('email', '==', lowerCaseEmail).limit(1).get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            if (doc.data().subscribed) {
                return res.status(200).json({ success: false, message: 'Email already subscribed' });
            } else {
                // Resubscribe
                await doc.ref.update({
                    subscribed: true,
                    unsubscriptionDate: null,
                    subscriptionDate: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
            }
        } else {
            // Create new subscriber
            const newSubscriber = {
                email: lowerCaseEmail,
                firstName: firstName || '',
                lastName: lastName || '',
                subscribed: true,
                subscriptionDate: FieldValue.serverTimestamp(),
                unsubscriptionDate: null,
                preferences: { newsletter: true, activities: true, investments: true, promotions: true },
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            };
            await collections.newsletter.add(newSubscriber);
        }

        await sendEmail(email, emailTemplates.welcome, { userName: firstName || 'Investor' });

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            subscriber: { email: lowerCaseEmail }
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

        const snapshot = await collections.newsletter.where('email', '==', email.toLowerCase()).limit(1).get();

        if (snapshot.empty || !snapshot.docs[0].data().subscribed) {
            return res.status(200).json({ success: false, message: 'Email not found or already unsubscribed' });
        }

        const doc = snapshot.docs[0];
        await doc.ref.update({
            subscribed: false,
            unsubscriptionDate: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });

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

        const snapshot = await collections.newsletter.where('email', '==', email.toLowerCase()).limit(1).get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: 'Subscriber not found' });
        }

        res.status(200).json({ success: true, preferences: snapshot.docs[0].data().preferences });
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

        const snapshot = await collections.newsletter.where('email', '==', email.toLowerCase()).limit(1).get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: 'Subscriber not found' });
        }

        const doc = snapshot.docs[0];
        const currentPreferences = doc.data().preferences || {};
        const updatedPreferences = { ...currentPreferences, ...preferences };

        await doc.ref.update({ 
            preferences: updatedPreferences,
            updatedAt: FieldValue.serverTimestamp()
        });

        res.status(200).json({ success: true, message: 'Preferences updated', preferences: updatedPreferences });
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

        if (!userId || !userEmail || !userName || !type) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        if (!validator.isEmail(userEmail)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        const activityData = {
            userId,
            userEmail,
            userName,
            type,
            description,
            amount: amount || 0,
            status: status || 'completed',
            metadata: metadata || {},
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            emailSent: false,
            emailSentAt: null
        };
        const activityRef = await collections.activities.add(activityData);

        const subscriberSnapshot = await collections.newsletter.where('email', '==', userEmail.toLowerCase()).limit(1).get();
        const shouldEmail = !subscriberSnapshot.empty && subscriberSnapshot.docs[0].data().subscribed && subscriberSnapshot.docs[0].data().preferences.activities;

        if (shouldEmail) {
            const result = await sendEmail(userEmail, emailTemplates.activityNotification, {
                userName,
                activity: { type, description, amount, status, date: new Date() }
            });

            if (result.success) {
                await activityRef.update({ emailSent: true, emailSentAt: FieldValue.serverTimestamp() });
                await collections.emailLogs.add({
                    to: userEmail,
                    subject: `Activity Alert - ${type}`,
                    type: 'activity',
                    status: 'sent',
                    messageId: result.messageId,
                    relatedActivityId: activityRef.id,
                    relatedUserId: userId,
                    sentAt: FieldValue.serverTimestamp()
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Activity logged successfully',
            activity: { id: activityRef.id }
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

        const query = collections.activities.where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(parseInt(limit))
            .offset(parseInt(skip));
            
        const snapshot = await query.get();
        const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const totalSnapshot = await collections.activities.where('userId', '==', userId).get();
        const total = totalSnapshot.size;

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

// ==================== NOTIFICATION ROUTES ====================

// Send investment confirmation
router.post('/notification/investment', async (req, res) => {
    try {
        const { userEmail, userName, userId, investment } = req.body;

        if (!userEmail || !validator.isEmail(userEmail)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        const activityData = {
            userId,
            userEmail,
            userName,
            type: 'investment',
            description: `Investment of $${investment.amount} in ${investment.plan} plan`,
            amount: investment.amount,
            status: 'completed',
            metadata: investment,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            emailSent: false,
            emailSentAt: null
        };
        const activityRef = await collections.activities.add(activityData);

        const result = await sendEmail(userEmail, emailTemplates.investmentAlert, {
            userName,
            investment: { ...investment, id: investment.id || uuidv4() }
        });

        if (result.success) {
            await activityRef.update({ emailSent: true, emailSentAt: FieldValue.serverTimestamp() });
            await collections.emailLogs.add({
                to: userEmail,
                subject: 'Investment Confirmation',
                type: 'investment',
                status: 'sent',
                messageId: result.messageId,
                relatedActivityId: activityRef.id,
                relatedUserId: userId,
                sentAt: FieldValue.serverTimestamp()
            });
        }

        res.status(200).json({ success: true, message: 'Investment notification sent' });
    } catch (error) {
        console.error('[Investment Notification] Error:', error);
        res.status(500).json({ success: false, message: 'Error sending notification', error: error.message });
    }
});

// Send withdrawal confirmation
router.post('/notification/withdrawal', async (req, res) => {
    try {
        const { userEmail, userName, userId, withdrawal } = req.body;

        if (!userEmail || !validator.isEmail(userEmail)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        const activityData = {
            userId,
            userEmail,
            userName,
            type: 'withdrawal',
            description: `Withdrawal request of $${withdrawal.amount} via ${withdrawal.method}`,
            amount: withdrawal.amount,
            status: withdrawal.status || 'pending',
            metadata: withdrawal,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            emailSent: false,
            emailSentAt: null
        };
        const activityRef = await collections.activities.add(activityData);

        const result = await sendEmail(userEmail, emailTemplates.withdrawalAlert, {
            userName,
            withdrawal: { ...withdrawal, id: withdrawal.id || uuidv4() }
        });

        if (result.success) {
            await activityRef.update({ emailSent: true, emailSentAt: FieldValue.serverTimestamp() });
            await collections.emailLogs.add({
                to: userEmail,
                subject: 'Withdrawal Confirmation',
                type: 'withdrawal',
                status: 'sent',
                messageId: result.messageId,
                relatedActivityId: activityRef.id,
                relatedUserId: userId,
                sentAt: FieldValue.serverTimestamp()
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

        const adminActivityData = {
            adminId,
            adminEmail,
            adminName,
            action,
            description,
            targetUserId: targetUserId || null,
            targetUserEmail: targetUserEmail || null,
            details: details || {},
            affectedUsers: affectedUsers || 1,
            emailSent: false,
            createdAt: FieldValue.serverTimestamp()
        };
        const adminActivityRef = await collections.adminActions.add(adminActivityData);

        if (targetUserEmail && validator.isEmail(targetUserEmail)) {
            const result = await sendEmail(targetUserEmail, emailTemplates.activityNotification, {
                userName: targetUserEmail.split('@')[0],
                activity: { type: action, description, amount: 0, status: 'admin_action', date: new Date() }
            });
            if (result.success) {
                await adminActivityRef.update({ emailSent: true });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Admin action logged',
            adminActivity: { id: adminActivityRef.id }
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

        let query = collections.newsletter.where('subscribed', '==', true);
        if (targetGroup === 'active') { // Example of a target group
            query = query.where('preferences.newsletter', '==', true);
        }
        
        const snapshot = await query.get();
        if (snapshot.empty) {
            return res.status(200).json({ success: true, message: 'No subscribers to send to.' });
        }

        let sentCount = 0;
        let failedCount = 0;

        for (const doc of snapshot.docs) {
            const subscriber = doc.data();
            const result = await sendEmail(subscriber.email, emailTemplates.newsletter, { content });

            const logData = {
                to: subscriber.email,
                subject,
                type: 'newsletter',
                sentAt: FieldValue.serverTimestamp(),
            };

            if (result.success) {
                sentCount++;
                logData.status = 'sent';
                logData.messageId = result.messageId;
            } else {
                failedCount++;
                logData.status = 'failed';
                logData.error = result.error;
            }
            await collections.emailLogs.add(logData);
        }

        res.status(200).json({
            success: true,
            message: `Newsletter sent to ${sentCount} subscribers`,
            results: { sent: sentCount, failed: failedCount, total: snapshot.size }
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
        let query = collections.emailLogs;

        if (status) query = query.where('status', '==', status);
        if (type) query = query.where('type', '==', type);

        const totalSnapshot = await query.get();
        const total = totalSnapshot.size;

        const snapshot = await query.orderBy('sentAt', 'desc').limit(parseInt(limit)).offset(parseInt(skip)).get();
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
        const totalSnapshot = await collections.newsletter.get();
        const activeSnapshot = await collections.newsletter.where('subscribed', '==', true).get();
        
        const totalSubscribers = totalSnapshot.size;
        const activeSubscribers = activeSnapshot.size;
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
