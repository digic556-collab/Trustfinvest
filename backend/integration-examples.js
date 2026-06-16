/**
 * Newsletter & Notifications Integration Examples
 * Add these functions to your dashboard.js or relevant files
 */

// ==================== INITIALIZE API ====================

const emailAPI = new TrustFinvestAPI(
    process.env.REACT_APP_API_URL || 'http://localhost:5000'
);

// Verify API connection on page load
emailAPI.checkConnection().then(connected => {
    if (connected) {
        console.log('[Email API] Connected and ready');
    } else {
        console.warn('[Email API] Connection failed - features may be limited');
    }
});

// ==================== NEWSLETTER INTEGRATION ====================

/**
 * Handle newsletter subscription from homepage
 */
async function handleNewsletterSubscription(email, firstName = '', lastName = '') {
    try {
        const result = await emailAPI.subscribeNewsletter(email, firstName, lastName);
        if (result.success) {
            console.log('[Newsletter] Successfully subscribed!');
            return true;
        } else {
            console.warn('[Newsletter] Subscription failed:', result.message);
            return false;
        }
    } catch (error) {
        console.error('[Newsletter]', error);
        return false;
    }
}

/**
 * Handle newsletter unsubscription
 */
async function handleNewsletterUnsubscription(email) {
    try {
        const result = await emailAPI.unsubscribeNewsletter(email);
        if (result.success) {
            console.log('[Newsletter] Successfully unsubscribed!');
            return true;
        } else {
            console.warn('[Newsletter] Unsubscription failed:', result.message);
            return false;
        }
    } catch (error) {
        console.error('[Unsubscribe]', error);
        return false;
    }
}

/**
 * Fetch and display email preferences
 */
async function loadEmailPreferences(email) {
    try {
        const result = await emailAPI.getPreferences(email);
        if (result.success) {
            return result.preferences;
        }
    } catch (error) {
        console.error('[Preferences Load]', error);
    }
}

/**
 * Update email preferences
 */
async function updateEmailPreferences(email, preferences) {
    try {
        const result = await emailAPI.updatePreferences(email, preferences);
        if (result.success) {
            console.log('[Preferences] Updated successfully');
            return result.preferences;
        }
    } catch (error) {
        console.error('[Update Preferences]', error);
    }
}

// ==================== USER ACTIVITY LOGGING ====================

/**
 * Log deposit activity
 * Call this after successful deposit
 */
async function logDepositActivity(userId, userEmail, userName, amount) {
    try {
        await emailAPI.logDeposit(userId, userEmail, userName, amount);
        console.log('[Activity] Deposit logged');
    } catch (error) {
        console.warn('[Activity] Failed to log deposit:', error);
    }
}

/**
 * Log investment activity and send notification
 * Call this after investment creation
 */
async function handleInvestmentCreated(userId, userEmail, userName, investmentData) {
    try {
        // Log the activity
        await emailAPI.logInvestment(
            userId,
            userEmail,
            userName,
            investmentData.amount,
            investmentData.plan,
            investmentData.roi
        );

        // Send notification email
        await emailAPI.sendInvestmentNotification(
            userEmail,
            userName,
            userId,
            {
                plan: investmentData.plan,
                amount: investmentData.amount,
                roi: investmentData.roi,
                duration: investmentData.duration,
                maturityDate: investmentData.maturityDate,
                id: investmentData.investmentId
            }
        );
        console.log('[Investment] Activity logged and notification sent');
    } catch (error) {
        console.warn('[Investment]', error);
    }
}

/**
 * Log withdrawal activity and send notification
 * Call this after withdrawal request
 */
async function handleWithdrawalRequest(userId, userEmail, userName, withdrawalData) {
    try {
        // Log the activity
        await emailAPI.logWithdrawal(
            userId,
            userEmail,
            userName,
            withdrawalData.amount,
            withdrawalData.status || 'pending'
        );

        // Send notification email
        await emailAPI.sendWithdrawalNotification(
            userEmail,
            userName,
            userId,
            {
                amount: withdrawalData.amount,
                method: withdrawalData.method,
                status: withdrawalData.status,
                estimatedTime: withdrawalData.estimatedTime,
                id: withdrawalData.withdrawalId
            }
        );
        console.log('[Withdrawal] Activity logged and notification sent');
    } catch (error) {
        console.warn('[Withdrawal]', error);
    }
}

/**
 * Log earning activity
 * Call this when user earns daily returns
 */
async function logEarningActivity(userId, userEmail, userName, amount, type = 'daily_return') {
    try {
        await emailAPI.logEarning(userId, userEmail, userName, amount, type);
        console.log('[Activity] Earning logged:', amount);
    } catch (error) {
        console.warn('[Activity] Failed to log earning:', error);
    }
}

/**
 * Log task completion
 * Call this when user completes a daily task
 */
async function logTaskCompletion(userId, userEmail, userName, taskName, reward) {
    try {
        await emailAPI.logTaskCompletion(userId, userEmail, userName, taskName, reward);
        console.log('[Activity] Task logged:', taskName);
    } catch (error) {
        console.warn('[Activity] Failed to log task:', error);
    }
}

/**
 * Get user activity history
 * Display in dashboard activity section
 */
async function loadUserActivities(userId, limit = 10) {
    try {
        const result = await emailAPI.getUserActivities(userId, limit, 0);
        if (result.success) {
            return result.activities;
        }
    } catch (error) {
        console.error('[Activity History]', error);
    }
}


// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleNewsletterSubscription,
        handleNewsletterUnsubscription,
        loadEmailPreferences,
        updateEmailPreferences,
        logDepositActivity,
        handleInvestmentCreated,
        handleWithdrawalRequest,
        logEarningActivity,
        logTaskCompletion,
        loadUserActivities
    };
}
