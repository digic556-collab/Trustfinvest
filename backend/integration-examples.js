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
            showNotification('✅ Successfully subscribed to newsletter!', 'success');
            clearNewsletterForm();
            return true;
        } else {
            showNotification(result.message, 'warning');
            return false;
        }
    } catch (error) {
        showNotification('❌ Subscription failed: ' + error.message, 'error');
        console.error('[Newsletter]', error);
        return false;
    }
}

/**
 * Handle newsletter unsubscription
 */
async function handleNewsletterUnsubscription(email) {
    try {
        if (!confirm('Are you sure you want to unsubscribe from our newsletter?')) {
            return false;
        }

        const result = await emailAPI.unsubscribeNewsletter(email);
        if (result.success) {
            showNotification('✅ Successfully unsubscribed from newsletter', 'success');
            return true;
        } else {
            showNotification(result.message, 'warning');
            return false;
        }
    } catch (error) {
        showNotification('❌ Error: ' + error.message, 'error');
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
            displayPreferences(result.preferences);
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
            showNotification('✅ Preferences updated successfully', 'success');
            return result.preferences;
        }
    } catch (error) {
        showNotification('❌ Error updating preferences: ' + error.message, 'error');
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

        showNotification('✅ Investment confirmed! Check your email.', 'success');
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

        showNotification('✅ Withdrawal request submitted! Check your email.', 'success');
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
        showNotification(`✅ Task completed! Earned $${reward}`, 'success');
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
            displayActivityHistory(result.activities);
            return result.activities;
        }
    } catch (error) {
        console.error('[Activity History]', error);
    }
}

// ==================== NOTIFICATION HELPERS ====================

/**
 * Display notification message to user
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.innerHTML = message;
    
    // Add to page
    document.body.appendChild(notif);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 5000);
}

/**
 * Display email preferences in UI
 */
function displayPreferences(preferences) {
    // Update checkbox states or similar UI elements
    if (document.getElementById('pref-newsletter')) {
        document.getElementById('pref-newsletter').checked = preferences.newsletter;
    }
    if (document.getElementById('pref-activities')) {
        document.getElementById('pref-activities').checked = preferences.activities;
    }
    if (document.getElementById('pref-investments')) {
        document.getElementById('pref-investments').checked = preferences.investments;
    }
    if (document.getElementById('pref-promotions')) {
        document.getElementById('pref-promotions').checked = preferences.promotions;
    }
}

/**
 * Display activity history in dashboard
 */
function displayActivityHistory(activities) {
    const container = document.getElementById('activity-container');
    if (!container) return;

    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                ${getActivityIcon(activity.type)}
            </div>
            <div class="activity-details">
                <strong>${activity.description}</strong>
                <small>${new Date(activity.createdAt).toLocaleString()}</small>
            </div>
            <div class="activity-amount">
                ${activity.amount > 0 ? '+' : ''}$${activity.amount}
            </div>
        </div>
    `).join('');
}

/**
 * Get icon for activity type
 */
function getActivityIcon(type) {
    const icons = {
        deposit: '💰',
        investment: '📈',
        withdrawal: '💳',
        earning: '💵',
        task_completed: '✅',
        referral: '👥',
        login: '🔑',
        profile_update: '👤',
        plan_change: '📊',
        admin_action: '⚙️'
    };
    return icons[type] || '📌';
}

/**
 * Clear newsletter form
 */
function clearNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (form) {
        form.reset();
    }
}

// ==================== EVENT LISTENERS ====================

// Newsletter subscription form
document.addEventListener('DOMContentLoaded', () => {
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletter-email')?.value;
            const firstName = document.getElementById('newsletter-firstName')?.value;
            const lastName = document.getElementById('newsletter-lastName')?.value;
            
            if (email) {
                await handleNewsletterSubscription(email, firstName, lastName);
            }
        });
    }

    // Email preferences form (if in settings)
    const prefsForm = document.getElementById('email-preferences-form');
    if (prefsForm) {
        prefsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = userEmail; // Get from logged-in user data
            const preferences = {
                newsletter: document.getElementById('pref-newsletter')?.checked,
                activities: document.getElementById('pref-activities')?.checked,
                investments: document.getElementById('pref-investments')?.checked,
                promotions: document.getElementById('pref-promotions')?.checked
            };
            
            await updateEmailPreferences(email, preferences);
        });
    }

    // Load activities on dashboard
    if (document.getElementById('activity-container')) {
        const userId = getCurrentUserId(); // Get from session
        if (userId) {
            loadUserActivities(userId, 20);
        }
    }

    // Load preferences on settings page
    if (document.getElementById('email-preferences-form')) {
        const email = userEmail; // Get from logged-in user data
        if (email) {
            loadEmailPreferences(email);
        }
    }
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get current user ID from session
 */
function getCurrentUserId() {
    // Get from localStorage, session, or user object
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
}

/**
 * Get current user email
 */
function getCurrentUserEmail() {
    return localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
}

/**
 * Get current user name
 */
function getCurrentUserName() {
    return localStorage.getItem('userName') || sessionStorage.getItem('userName');
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
        loadUserActivities,
        showNotification
    };
}
