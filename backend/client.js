/**
 * TrustFinvest Backend API Client
 * Frontend integration for newsletter and notification services
 */

class TrustFinvestAPI {
    constructor(baseURL = 'http://localhost:5000') {
        this.baseURL = baseURL;
        this.api = `${baseURL}/api/email`;
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.api}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('[API Error]', error);
            throw error;
        }
    }

    // ==================== NEWSLETTER METHODS ====================

    /**
     * Subscribe to newsletter
     */
    async subscribeNewsletter(email, firstName = '', lastName = '') {
        return this.request('/subscribe', {
            method: 'POST',
            body: JSON.stringify({ email, firstName, lastName })
        });
    }

    /**
     * Unsubscribe from newsletter
     */
    async unsubscribeNewsletter(email) {
        return this.request('/unsubscribe', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    /**
     * Get email preferences
     */
    async getPreferences(email) {
        return this.request(`/preferences/${encodeURIComponent(email)}`, {
            method: 'GET'
        });
    }

    /**
     * Update email preferences
     */
    async updatePreferences(email, preferences) {
        return this.request(`/preferences/${encodeURIComponent(email)}`, {
            method: 'PUT',
            body: JSON.stringify({ preferences })
        });
    }

    // ==================== USER ACTIVITY METHODS ====================

    /**
     * Log user activity
     */
    async logActivity(userId, userEmail, userName, type, description, amount = 0, status = 'completed', metadata = {}) {
        return this.request('/activity/log', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                userEmail,
                userName,
                type,
                description,
                amount,
                status,
                metadata
            })
        });
    }

    /**
     * Get user activities
     */
    async getUserActivities(userId, limit = 10, skip = 0) {
        return this.request(`/activity/user/${userId}?limit=${limit}&skip=${skip}`, {
            method: 'GET'
        });
    }

    /**
     * Log deposit activity
     */
    async logDeposit(userId, userEmail, userName, amount) {
        return this.logActivity(
            userId,
            userEmail,
            userName,
            'deposit',
            `Deposit of $${amount}`,
            amount,
            'completed',
            { depositAmount: amount }
        );
    }

    /**
     * Log investment activity
     */
    async logInvestment(userId, userEmail, userName, amount, plan, roi) {
        return this.logActivity(
            userId,
            userEmail,
            userName,
            'investment',
            `Investment of $${amount} in ${plan} plan`,
            amount,
            'completed',
            { plan, roi, amount }
        );
    }

    /**
     * Log withdrawal activity
     */
    async logWithdrawal(userId, userEmail, userName, amount, status = 'pending') {
        return this.logActivity(
            userId,
            userEmail,
            userName,
            'withdrawal',
            `Withdrawal request of $${amount}`,
            amount,
            status,
            { withdrawAmount: amount, status }
        );
    }

    /**
     * Log earning activity
     */
    async logEarning(userId, userEmail, userName, amount, type = 'daily_return') {
        return this.logActivity(
            userId,
            userEmail,
            userName,
            'earning',
            `Daily earning of $${amount}`,
            amount,
            'completed',
            { earningType: type }
        );
    }

    /**
     * Log task completion
     */
    async logTaskCompletion(userId, userEmail, userName, taskName, reward) {
        return this.logActivity(
            userId,
            userEmail,
            userName,
            'task_completed',
            `Completed task: ${taskName} - Earned $${reward}`,
            reward,
            'completed',
            { taskName, reward }
        );
    }

    // ==================== NOTIFICATION METHODS ====================

    /**
     * Send investment notification
     */
    async sendInvestmentNotification(userEmail, userName, userId, investment) {
        return this.request('/notification/investment', {
            method: 'POST',
            body: JSON.stringify({
                userEmail,
                userName,
                userId,
                investment
            })
        });
    }

    /**
     * Send withdrawal notification
     */
    async sendWithdrawalNotification(userEmail, userName, userId, withdrawal) {
        return this.request('/notification/withdrawal', {
            method: 'POST',
            body: JSON.stringify({
                userEmail,
                userName,
                userId,
                withdrawal
            })
        });
    }

    // ==================== ADMIN METHODS ====================

    /**
     * Log admin action
     */
    async logAdminAction(adminId, adminEmail, adminName, action, description, targetUserId = null, targetUserEmail = null, details = {}, affectedUsers = 1) {
        return this.request('/admin/action', {
            method: 'POST',
            body: JSON.stringify({
                adminId,
                adminEmail,
                adminName,
                action,
                description,
                targetUserId,
                targetUserEmail,
                details,
                affectedUsers
            })
        });
    }

    /**
     * Send bulk newsletter campaign
     */
    async sendNewsletter(content, subject, targetGroup = 'all') {
        return this.request('/admin/newsletter/send', {
            method: 'POST',
            body: JSON.stringify({
                content,
                subject,
                targetGroup
            })
        });
    }

    /**
     * Get email logs
     */
    async getEmailLogs(limit = 50, skip = 0, status = null, type = null) {
        let query = `?limit=${limit}&skip=${skip}`;
        if (status) query += `&status=${status}`;
        if (type) query += `&type=${type}`;

        return this.request(`/admin/logs/emails${query}`, {
            method: 'GET'
        });
    }

    /**
     * Get subscriber statistics
     */
    async getSubscriberStats() {
        return this.request('/admin/subscribers/count', {
            method: 'GET'
        });
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Send welcome email manually
     */
    async sendWelcomeEmail(email, firstName = 'Investor') {
        return this.subscribeNewsletter(email, firstName);
    }

    /**
     * Verify API connection
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            const data = await response.json();
            return data.status === 'ok';
        } catch (error) {
            console.error('[API Connection] Failed:', error);
            return false;
        }
    }

    /**
     * Get API documentation
     */
    async getDocumentation() {
        return fetch(`${this.baseURL}/api/docs`).then(r => r.json());
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.TrustFinvestAPI = TrustFinvestAPI;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrustFinvestAPI;
}
