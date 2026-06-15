// Firestore Database Service
// Handles all database operations for TrustFinvest backend

const { db, collections, FieldValue, Timestamp, verifyConnection } = require('./firebase-admin');

// Initialize verification on startup
verifyConnection().then(isConnected => {
  if (isConnected) {
    console.log('[Firestore] Database service initialized successfully');
  } else {
    console.warn('[Firestore] Database service initialized with warnings');
  }
});

// Newsletter Subscriber Operations
const newsletterService = {
  // Add new subscriber
  subscribe: async (email, firstName, lastName, preferences = {}) => {
    try {
      const subscriberId = email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      const subscriber = {
        email,
        firstName,
        lastName,
        subscribedAt: Timestamp.now(),
        isActive: true,
        preferences: {
          newsletter: preferences.newsletter !== false,
          activities: preferences.activities !== false,
          investments: preferences.investments !== false,
          withdrawals: preferences.withdrawals !== false,
          promotions: preferences.promotions !== false,
          ...preferences
        },
        tags: ['subscriber'],
        unsubscribeToken: Math.random().toString(36).substring(7)
      };

      await collections.newsletter.doc(subscriberId).set(subscriber);
      console.log(`[Firestore] Subscriber added: ${email}`);
      return { success: true, subscriberId, ...subscriber };
    } catch (error) {
      console.error('[Firestore] Error subscribing:', error);
      throw error;
    }
  },

  // Get subscriber by email
  getSubscriber: async (email) => {
    try {
      const subscriberId = email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const doc = await collections.newsletter.doc(subscriberId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('[Firestore] Error getting subscriber:', error);
      throw error;
    }
  },

  // Update subscriber preferences
  updatePreferences: async (email, preferences) => {
    try {
      const subscriberId = email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      await collections.newsletter.doc(subscriberId).update({
        preferences: {
          FieldValue.arrayUnion: preferences
        },
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error) {
      console.error('[Firestore] Error updating preferences:', error);
      throw error;
    }
  },

  // Unsubscribe
  unsubscribe: async (email) => {
    try {
      const subscriberId = email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      await collections.newsletter.doc(subscriberId).update({
        isActive: false,
        unsubscribedAt: Timestamp.now()
      });
      console.log(`[Firestore] Subscriber unsubscribed: ${email}`);
      return { success: true };
    } catch (error) {
      console.error('[Firestore] Error unsubscribing:', error);
      throw error;
    }
  },

  // Get all active subscribers
  getActiveSubscribers: async (limit = 1000) => {
    try {
      const query = collections.newsletter
        .where('isActive', '==', true)
        .limit(limit);
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('[Firestore] Error getting active subscribers:', error);
      throw error;
    }
  },

  // Get subscriber count
  getSubscriberCount: async () => {
    try {
      const snapshot = await collections.newsletter
        .where('isActive', '==', true)
        .get();
      return snapshot.size;
    } catch (error) {
      console.error('[Firestore] Error getting subscriber count:', error);
      return 0;
    }
  }
};

// User Activity Operations
const activityService = {
  // Log activity
  logActivity: async (userId, userEmail, userName, activityType, details = {}) => {
    try {
      const activityId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const activity = {
        userId,
        userEmail,
        userName,
        activityType, // 'deposit', 'investment', 'withdrawal', 'earning', 'login', 'logout', 'task_completed', etc.
        details,
        timestamp: Timestamp.now(),
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        notificationSent: false
      };

      await collections.activities.doc(activityId).set(activity);
      console.log(`[Firestore] Activity logged: ${userId} - ${activityType}`);
      return { success: true, activityId, ...activity };
    } catch (error) {
      console.error('[Firestore] Error logging activity:', error);
      throw error;
    }
  },

  // Get user activities
  getUserActivities: async (userId, limit = 50) => {
    try {
      const query = collections.activities
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit);
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('[Firestore] Error getting user activities:', error);
      throw error;
    }
  },

  // Get activities by type
  getActivitiesByType: async (activityType, limit = 100) => {
    try {
      const query = collections.activities
        .where('activityType', '==', activityType)
        .orderBy('timestamp', 'desc')
        .limit(limit);
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('[Firestore] Error getting activities by type:', error);
      throw error;
    }
  },

  // Mark activity notification as sent
  markNotificationSent: async (activityId) => {
    try {
      await collections.activities.doc(activityId).update({
        notificationSent: true,
        notificationSentAt: Timestamp.now()
      });
      return { success: true };
    } catch (error) {
      console.error('[Firestore] Error marking notification:', error);
      throw error;
    }
  }
};

// Email Log Operations
const emailLogService = {
  // Log email send
  logEmail: async (toEmail, toName, subject, activityId = null, status = 'sent') => {
    try {
      const logId = `${toEmail}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const log = {
        toEmail,
        toName,
        subject,
        fromEmail: process.env.SMTP_FROM_EMAIL,
        fromName: process.env.SMTP_FROM_NAME,
        activityId,
        status, // 'sent', 'failed', 'bounced', 'spam'
        timestamp: Timestamp.now(),
        date: new Date().toISOString().split('T')[0],
        attempts: 1,
        lastAttempt: Timestamp.now()
      };

      await collections.emailLogs.doc(logId).set(log);
      console.log(`[Firestore] Email logged: ${toEmail} - ${subject}`);
      return { success: true, logId, ...log };
    } catch (error) {
      console.error('[Firestore] Error logging email:', error);
      throw error;
    }
  },

  // Get email logs
  getEmailLogs: async (limit = 100, filters = {}) => {
    try {
      let query = collections.emailLogs;
      
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters.toEmail) {
        query = query.where('toEmail', '==', filters.toEmail);
      }
      
      query = query.orderBy('timestamp', 'desc').limit(limit);
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('[Firestore] Error getting email logs:', error);
      throw error;
    }
  },

  // Get email stats
  getEmailStats: async () => {
    try {
      const sentSnapshot = await collections.emailLogs
        .where('status', '==', 'sent')
        .get();
      const failedSnapshot = await collections.emailLogs
        .where('status', '==', 'failed')
        .get();

      return {
        sent: sentSnapshot.size,
        failed: failedSnapshot.size,
        total: sentSnapshot.size + failedSnapshot.size
      };
    } catch (error) {
      console.error('[Firestore] Error getting email stats:', error);
      return { sent: 0, failed: 0, total: 0 };
    }
  }
};

// Admin Action Operations
const adminActionService = {
  // Log admin action
  logAdminAction: async (adminId, adminEmail, adminName, actionType, targetId = null, details = {}) => {
    try {
      const actionId = `${adminId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const action = {
        adminId,
        adminEmail,
        adminName,
        actionType, // 'user_created', 'user_suspended', 'investment_verified', 'withdrawal_approved', etc.
        targetId,
        details,
        timestamp: Timestamp.now(),
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
      };

      await collections.adminActions.doc(actionId).set(action);
      console.log(`[Firestore] Admin action logged: ${adminName} - ${actionType}`);
      return { success: true, actionId, ...action };
    } catch (error) {
      console.error('[Firestore] Error logging admin action:', error);
      throw error;
    }
  },

  // Get admin actions
  getAdminActions: async (adminId = null, limit = 50) => {
    try {
      let query = collections.adminActions;
      
      if (adminId) {
        query = query.where('adminId', '==', adminId);
      }
      
      query = query.orderBy('timestamp', 'desc').limit(limit);
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('[Firestore] Error getting admin actions:', error);
      throw error;
    }
  }
};

// Batch operations
const batchService = {
  // Export subscribers to array
  exportSubscribers: async () => {
    try {
      const subscribers = await newsletterService.getActiveSubscribers(10000);
      return subscribers.map(sub => ({
        email: sub.email,
        name: `${sub.firstName} ${sub.lastName}`,
        subscribedDate: sub.subscribedAt?.toDate?.() || new Date()
      }));
    } catch (error) {
      console.error('[Firestore] Error exporting subscribers:', error);
      throw error;
    }
  }
};

module.exports = {
  newsletterService,
  activityService,
  emailLogService,
  adminActionService,
  batchService,
  verifyConnection
};
