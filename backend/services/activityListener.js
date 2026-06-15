const emailService = require('./emailService');
const { db } = require('../firebase-admin');

/**
 * Activity Listener Service
 * Listens to all user activities and sends automated emails
 * Activities monitored:
 * - User registration (new_user_registered)
 * - User login (user_login)
 * - Deposit (deposit)
 * - Investment (investment)
 * - Withdrawal (withdrawal_initiated, withdrawal_approved)
 * - Task completion (task_completed)
 * - Daily earnings (daily_earnings)
 * - Activities alert (activity_alert)
 */

const ActivityListener = {
    // Listen to new user registration
    onUserRegistration: async (userData) => {
        try {
            const { email, firstName, lastName, userId } = userData;
            
            console.log(`[ActivityListener] New user registered: ${email}`);
            
            // Send new user registration email
            const result = await emailService.sendNewUserRegistration(email, firstName, lastName);
            
            if (result.success) {
                // Log email activity to Firestore
                await db.collection(process.env.FIRESTORE_COLLECTION_EMAIL_LOGS).add({
                    userId,
                    email,
                    emailType: 'new_user_registration',
                    subject: 'Welcome to TrustFinvest',
                    sentAt: new Date(),
                    status: 'sent',
                    messageId: result.messageId
                });
            }
            
            return result;
        } catch (error) {
            console.error('[ActivityListener] New user registration error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to user login (welcome back)
    onUserLogin: async (userData) => {
        try {
            const { email, firstName, userId, lastLogin } = userData;
            
            console.log(`[ActivityListener] User login detected: ${email}`);
            
            // Check if this is a returning user (not their first login)
            const userActivitiesRef = db.collection(process.env.FIRESTORE_COLLECTION_ACTIVITIES);
            const previousLogin = await userActivitiesRef
                .where('userId', '==', userId)
                .where('activityType', '==', 'user_login')
                .orderBy('createdAt', 'desc')
                .limit(2)
                .get();
            
            // Only send welcome back if there are previous logins
            if (previousLogin.docs.length > 1) {
                const result = await emailService.sendWelcomeBack(email, firstName, lastLogin);
                
                if (result.success) {
                    await db.collection(process.env.FIRESTORE_COLLECTION_EMAIL_LOGS).add({
                        userId,
                        email,
                        emailType: 'welcome_back',
                        subject: 'Welcome back to TrustFinvest',
                        sentAt: new Date(),
                        status: 'sent',
                        messageId: result.messageId
                    });
                }
                
                return result;
            }
        } catch (error) {
            console.error('[ActivityListener] User login error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to deposit activity
    onDeposit: async (depositData) => {
        try {
            const { userId, email, userName, amount, reference } = depositData;
            
            console.log(`[ActivityListener] Deposit detected: ${email} - $${amount}`);
            
            // Get user preferences
            const userPrefs = await db.collection('newsletter_subscribers')
                .doc(email)
                .get();
            
            const preferences = userPrefs.data()?.preferences || {};
            
            // Send if user has enabled deposit notifications
            if (preferences.activities !== false) {
                const result = await emailService.sendDepositConfirmation(email, userName, amount, reference);
                
                if (result.success) {
                    await db.collection(process.env.FIRESTORE_COLLECTION_EMAIL_LOGS).add({
                        userId,
                        email,
                        emailType: 'deposit_confirmation',
                        subject: `Deposit Confirmed - $${amount}`,
                        amount,
                        sentAt: new Date(),
                        status: 'sent',
                        messageId: result.messageId
                    });
                }
                
                return result;
            }
        } catch (error) {
            console.error('[ActivityListener] Deposit error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to investment activity
    onInvestment: async (investmentData) => {
        try {
            const { userId, email, userName, plan, amount, roi, duration } = investmentData;
            
            console.log(`[ActivityListener] Investment created: ${email} - ${plan} - $${amount}`);
            
            // Get user preferences
            const userPrefs = await db.collection('newsletter_subscribers')
                .doc(email)
                .get();
            
            const preferences = userPrefs.data()?.preferences || {};
            
            // Send if user has enabled investment notifications
            if (preferences.investments !== false) {
                const result = await emailService.sendInvestmentConfirmation(email, userName, plan, amount, roi, duration);
                
                if (result.success) {
                    await db.collection(process.env.FIRESTORE_COLLECTION_EMAIL_LOGS).add({
                        userId,
                        email,
                        emailType: 'investment_confirmation',
                        subject: `Investment Confirmed - ${plan}`,
                        plan,
                        amount,
                        roi,
                        sentAt: new Date(),
                        status: 'sent',
                        messageId: result.messageId
                    });
                }
                
                return result;
            }
        } catch (error) {
            console.error('[ActivityListener] Investment error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to withdrawal initiated
    onWithdrawalInitiated: async (withdrawalData) => {
        try {
            const { userId, email, userName, amount, method } = withdrawalData;
            
            console.log(`[ActivityListener] Withdrawal initiated: ${email} - $${amount}`);
            
            // Get user preferences
            const userPrefs = await db.collection('newsletter_subscribers')
                .doc(email)
                .get();
            
            const preferences = userPrefs.data()?.preferences || {};
            
            // Send if user has enabled withdrawal notifications
            if (preferences.activities !== false) {
                const result = await emailService.sendWithdrawalInitiated(email, userName, amount, method);
                
                if (result.success) {
                    await db.collection(process.env.FIRESTORE_COLLECTION_EMAIL_LOGS).add({
                        userId,
                        email,
                        emailType: 'withdrawal_initiated',
                        subject: `Withdrawal Initiated - $${amount}`,
                        amount,
                        method,
                        sentAt: new Date(),
                        status: 'pending',
                        messageId: result.messageId
                    });
                }
                
                return result;
            }
        } catch (error) {
            console.error('[ActivityListener] Withdrawal initiated error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to withdrawal approved
    onWithdrawalApproved: async (withdrawalData) => {
        try {
            const { userId, email, userName, amount, method } = withdrawalData;
            
            console.log(`[ActivityListener] Withdrawal approved: ${email} - $${amount}`);
            
            // Get user preferences
            const userPrefs = await db.collection('newsletter_subscribers')
                .doc(email)
                .get();
            
            const preferences = userPrefs.data()?.preferences || {};
            
            // Send if user has enabled withdrawal notifications
            if (preferences.activities !== false) {
                const result = await emailService.sendWithdrawalApproved(email, userName, amount, method);
                
                if (result.success) {
                    await db.collection(process.env.FIRESTORE_COLLECTION_EMAIL_LOGS).add({
                        userId,
                        email,
                        emailType: 'withdrawal_approved',
                        subject: `Withdrawal Approved - $${amount}`,
                        amount,
                        method,
                        sentAt: new Date(),
                        status: 'sent',
                        messageId: result.messageId
                    });
                }
                
                return result;
            }
        } catch (error) {
            console.error('[ActivityListener] Withdrawal approved error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to task completion
    onTaskCompleted: async (taskData) => {
        try {
            const { userId, email, userName, taskTitle, reward } = taskData;
            
            console.log(`[ActivityListener] Task completed: ${email} - ${taskTitle}`);
            
            // Get user preferences
            const userPrefs = await db.collection('newsletter_subscribers')
                .doc(email)
                .get();
            
            const preferences = userPrefs.data()?.preferences || {};
            
            // Send if user has enabled activity notifications
            if (preferences.activities !== false) {
                const result = await emailService.sendTaskCompleted(email, userName, taskTitle, reward);
                
                if (result.success) {
                    await db.collection(process.env.FIRESTORE_COLLECTION_EMAIL_LOGS).add({
                        userId,
                        email,
                        emailType: 'task_completed',
                        subject: `Task Completed - Bonus Earned`,
                        taskTitle,
                        reward,
                        sentAt: new Date(),
                        status: 'sent',
                        messageId: result.messageId
                    });
                }
                
                return result;
            }
        } catch (error) {
            console.error('[ActivityListener] Task completed error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to daily earnings
    onDailyEarnings: async (earningsData) => {
        try {
            const { userId, email, userName, dailyEarnings, totalEarnings, investmentCount } = earningsData;
            
            console.log(`[ActivityListener] Daily earnings update: ${email} - $${dailyEarnings}`);
            
            // Get user preferences
            const userPrefs = await db.collection('newsletter_subscribers')
                .doc(email)
                .get();
            
            const preferences = userPrefs.data()?.preferences || {};
            
            // Send if user has enabled earnings notifications (default true)
            if (preferences.activities !== false) {
                const result = await emailService.sendEarningsUpdate(email, userName, dailyEarnings, totalEarnings, investmentCount);
                
                if (result.success) {
                    await db.collection(process.env.FIRESTORE_COLLECTION_EMAIL_LOGS).add({
                        userId,
                        email,
                        emailType: 'daily_earnings',
                        subject: `Daily Earnings Summary`,
                        dailyEarnings,
                        totalEarnings,
                        sentAt: new Date(),
                        status: 'sent',
                        messageId: result.messageId
                    });
                }
                
                return result;
            }
        } catch (error) {
            console.error('[ActivityListener] Daily earnings error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to activity alerts
    onActivityAlert: async (alertData) => {
        try {
            const { userId, email, userName, activityType, details } = alertData;
            
            console.log(`[ActivityListener] Activity alert: ${email} - ${activityType}`);
            
            // Get user preferences
            const userPrefs = await db.collection('newsletter_subscribers')
                .doc(email)
                .get();
            
            const preferences = userPrefs.data()?.preferences || {};
            
            // Send if user has enabled activity alerts
            if (preferences.activities !== false) {
                const result = await emailService.sendActivityAlert(email, userName, activityType, details);
                
                if (result.success) {
                    await db.collection(process.env.FIRESTORE_COLLECTION_EMAIL_LOGS).add({
                        userId,
                        email,
                        emailType: 'activity_alert',
                        subject: `Activity Alert - ${activityType}`,
                        activityType,
                        details,
                        sentAt: new Date(),
                        status: 'sent',
                        messageId: result.messageId
                    });
                }
                
                return result;
            }
        } catch (error) {
            console.error('[ActivityListener] Activity alert error:', error);
            return { success: false, error: error.message };
        }
    },

    // Auto-trigger email based on activity type
    autoSendEmail: async (activityType, data) => {
        switch (activityType) {
            case 'new_user_registered':
                return await ActivityListener.onUserRegistration(data);
            case 'user_login':
                return await ActivityListener.onUserLogin(data);
            case 'deposit':
                return await ActivityListener.onDeposit(data);
            case 'investment':
                return await ActivityListener.onInvestment(data);
            case 'withdrawal_initiated':
                return await ActivityListener.onWithdrawalInitiated(data);
            case 'withdrawal_approved':
                return await ActivityListener.onWithdrawalApproved(data);
            case 'task_completed':
                return await ActivityListener.onTaskCompleted(data);
            case 'daily_earnings':
                return await ActivityListener.onDailyEarnings(data);
            case 'activity_alert':
                return await ActivityListener.onActivityAlert(data);
            default:
                console.log(`[ActivityListener] Unknown activity type: ${activityType}`);
                return { success: false, error: 'Unknown activity type' };
        }
    }
};

module.exports = ActivityListener;
