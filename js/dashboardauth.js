// ==================== TRUSTCORE FINANCE - DASHBOARD BACKEND ====================
// dashboardauth.js - Firebase Authentication & Firestore Integration

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    getDoc, 
    updateDoc, 
    collection, 
    addDoc, 
    onSnapshot,
    serverTimestamp,
    increment 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ==================== FIREBASE CONFIGURATION ====================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA4WyMCUe4LoNtx3twnwDkOqjrjPPhGB80",
  authDomain: "trustfin-8e4d1.firebaseapp.com",
  projectId: "trustfin-8e4d1",
  storageBucket: "trustfin-8e4d1.firebasestorage.app",
  messagingSenderId: "747695116520",
  appId: "1:747695116520:web:32c2d0428f48e51eca795d",
  measurementId: "G-K0B1534NMD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== GLOBAL STATE ====================
let currentUser = null;
let userData = null;
let isDataLoaded = false;
let isOffline = false;
let unsubscribeUser = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// Plan configurations
const PLANS = {
    starter: { 
        name: "Starter", 
        roi: "5.00% - 5.09%", 
        price: "$50 - $150",
        nextPlan: "pro"
    },
    pro: { 
        name: "Pro", 
        roi: "8.00% - 8.45%", 
        price: "$300 - $500",
        nextPlan: "premium"
    },
    premium: { 
        name: "Premium", 
        roi: "10.00% - 12.00%", 
        price: "$600 - $1M+",
        nextPlan: null
    }
};

// Crypto wallet addresses
const WALLET_ADDRESSES = {
    BTC: "Message Admin",
    ETH: "Message Admin",
    TRX: "Message Admin",
    DOGE: "Message Admin",
    LTC: "Mesaage Admin"
};

// Minimum withdrawal amount
const MIN_WITHDRAWAL = 10;

// Last withdrawal timestamp per user (24hr cooldown)
let lastWithdrawalTime = 0;

// ==================== UTILITY FUNCTIONS ====================

// Show loading state
function showLoading(element, placeholder = "Loading...") {
    if (element) {
        element.textContent = placeholder;
        element.classList.add('loading-shimmer');
    }
}

// Hide loading state
function hideLoading(element, content) {
    if (element) {
        element.textContent = content;
        element.classList.remove('loading-shimmer');
    }
}

// Format currency
function formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Global error handler
function handleError(error, userMessage = "An error occurred") {
    console.error('Error:', error);
    
    if (error.code === 'permission-denied') {
        showNotification('Access denied. Please log in again.', 'error');
        setTimeout(() => logout(), 2000);
    } else if (error.code === 'unavailable') {
        showOfflineMode();
    } else {
        showNotification(userMessage, 'error');
    }
}

// Show offline mode banner
function showOfflineMode() {
    isOffline = true;
    let offlineBanner = document.getElementById('offline-banner');
    
    if (!offlineBanner) {
        offlineBanner = document.createElement('div');
        offlineBanner.id = 'offline-banner';
        offlineBanner.className = 'offline-banner';
        offlineBanner.innerHTML = `
            <i class="fa-solid fa-wifi-slash"></i>
            <span>You're offline. Trying to reconnect...</span>
        `;
        document.body.insertBefore(offlineBanner, document.body.firstChild);
    }
    
    offlineBanner.classList.add('show');
    
    // Disable interactive buttons
    const buttons = document.querySelectorAll('.crypto-btn, .plan-btn, .submit-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.title = 'Unavailable while offline';
    });
    
    // Attempt reconnection
    attemptReconnection();
}

// Hide offline mode banner
function hideOfflineMode() {
    isOffline = false;
    const offlineBanner = document.getElementById('offline-banner');
    
    if (offlineBanner) {
        offlineBanner.classList.remove('show');
        setTimeout(() => offlineBanner.remove(), 300);
    }
    
    // Re-enable buttons
    const buttons = document.querySelectorAll('.crypto-btn, .plan-btn, .submit-btn');
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.title = '';
    });
    
    showNotification('Connection restored', 'success');
    reconnectAttempts = 0;
}

// Attempt reconnection
async function attemptReconnection() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        showNotification('Unable to reconnect. Please check your internet connection.', 'error');
        return;
    }
    
    reconnectAttempts++;
    
    setTimeout(async () => {
        if (navigator.onLine && currentUser) {
            try {
                await loadUserData(currentUser.uid);
                hideOfflineMode();
            } catch (error) {
                attemptReconnection();
            }
        } else {
            attemptReconnection();
        }
    }, 5000 * reconnectAttempts); // Exponential backoff
}

// Monitor online/offline status
window.addEventListener('online', () => {
    if (isOffline && currentUser) {
        loadUserData(currentUser.uid);
    }
});

window.addEventListener('offline', () => {
    showOfflineMode();
});

// ==================== AUTHENTICATION ====================

// Check authentication state
// onAuthStateChanged(auth, async (user) => {
//     if (user) {
//         currentUser = user;
//         console.log('User authenticated:', user.uid);
        
//         // Show loading states
//         showAllLoadingStates();
        
//         // Load user data
//         await loadUserData(user.uid);
//     } else {
//         console.log('No user authenticated, redirecting to login...');
//         window.location.href = 'index.html';
//     }
// });

// Show all loading states
function showAllLoadingStates() {
    const loadingElements = {
        'sidebarUserName': 'Loading...',
        'sidebarUserEmail': 'Loading...',
        'topbarUserName': 'Loading...',
        'welcomeUserName': 'Loading...',
        'totalBalance': '$0.00',
        'activeInvestments': '0',
        'totalEarnings': '$0.00',
        'currentPlan': 'Loading...',
        'withdrawBalance': '$0.00',
        'settingsName': 'Loading...',
        'settingsEmail': 'Loading...',
        'settingsCountry': 'Loading...',
        'settingsMemberSince': 'Loading...'
    };
    
    Object.keys(loadingElements).forEach(id => {
        showLoading(document.getElementById(id), loadingElements[id]);
    });
}

// Load user data from Firestore
async function loadUserData(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        
        // Set up real-time listener
        unsubscribeUser = onSnapshot(userRef, 
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    userData = docSnapshot.data();
                    console.log('User data loaded:', userData);
                    updateDashboardUI();
                    isDataLoaded = true;
                    
                    if (isOffline) {
                        hideOfflineMode();
                    }
                } else {
                    // User document doesn't exist - create default one
                    console.log('User document not found, creating default...');
                    createDefaultUserDocument(userId);
                }
            },
            (error) => {
                handleError(error, 'Failed to load user data');
                
                // Retry after delay
                setTimeout(() => {
                    if (currentUser) {
                        loadUserData(currentUser.uid);
                    }
                }, 5000);
            }
        );
    } catch (error) {
        handleError(error, 'Failed to connect to database');
    }
}

// Create default user document
async function createDefaultUserDocument(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const defaultData = {
            name: currentUser.displayName || 'User',
            email: currentUser.email,
            balance: 0,
            investedAmount: 0,
            currentPlan: 'starter',
            planROI: PLANS.starter.roi,
            planPrice: PLANS.starter.price,
            totalEarnings: 0,
            activeInvestments: 0,
            country: 'Not specified',
            joinedAt: serverTimestamp()
        };
        
        await updateDoc(userRef, defaultData).catch(async () => {
            // If update fails, document doesn't exist, so create it
            await setDoc(userRef, defaultData);
        });
        
        showNotification('Account initialized successfully', 'success');
    } catch (error) {
        handleError(error, 'Failed to initialize account');
    }
}

// Update dashboard UI with user data
function updateDashboardUI() {
    if (!userData) return;
    
    // Update user info
    const firstName = userData.name ? userData.name.split(' ')[0] : 'User';
    hideLoading(document.getElementById('sidebarUserName'), userData.name || 'User');
    hideLoading(document.getElementById('sidebarUserEmail'), userData.email || '');
    hideLoading(document.getElementById('topbarUserName'), userData.name || 'User');
    hideLoading(document.getElementById('welcomeUserName'), firstName);
    
    // Update balance and stats
    hideLoading(document.getElementById('totalBalance'), formatCurrency(userData.balance));
    hideLoading(document.getElementById('activeInvestments'), userData.activeInvestments || 0);
    hideLoading(document.getElementById('totalEarnings'), formatCurrency(userData.totalEarnings));
    hideLoading(document.getElementById('currentPlan'), PLANS[userData.currentPlan]?.name || 'Starter');
    hideLoading(document.getElementById('withdrawBalance'), formatCurrency(userData.balance));
    
    // Update settings
    hideLoading(document.getElementById('settingsName'), userData.name || 'User');
    hideLoading(document.getElementById('settingsEmail'), userData.email || '');
    hideLoading(document.getElementById('settingsCountry'), userData.country || 'Not specified');
    
    // Format join date
    if (userData.joinedAt) {
        const joinDate = userData.joinedAt.toDate ? userData.joinedAt.toDate() : new Date(userData.joinedAt);
        const formattedDate = joinDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        hideLoading(document.getElementById('settingsMemberSince'), formattedDate);
    } else {
        hideLoading(document.getElementById('settingsMemberSince'), 'Recently joined');
    }
    
    // Update plan display and disable buttons
    updatePlanDisplay();
}

// Update plan display and button states
function updatePlanDisplay() {
    if (!userData) return;
    
    const currentPlanKey = userData.currentPlan || 'starter';
    const planCards = document.querySelectorAll('.plan-card');
    
    planCards.forEach(card => {
        const upgradeBtn = card.querySelector('[data-upgrade]');
        if (!upgradeBtn) return;
        
        const targetPlan = upgradeBtn.getAttribute('data-upgrade');
        
        // Determine button state
        if (targetPlan === currentPlanKey) {
            // Current plan
            upgradeBtn.disabled = true;
            upgradeBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Current Plan';
            upgradeBtn.classList.add('disabled');
            card.classList.add('current-plan');
        } else if (getPlanOrder(targetPlan) < getPlanOrder(currentPlanKey)) {
            // Lower plan
            upgradeBtn.disabled = true;
            upgradeBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Completed';
            upgradeBtn.classList.add('disabled');
        } else {
            // Available upgrade
            upgradeBtn.disabled = false;
            upgradeBtn.innerHTML = `Upgrade to ${PLANS[targetPlan].name}`;
            upgradeBtn.classList.remove('disabled');
        }
    });
}

// Get plan order for comparison
function getPlanOrder(planKey) {
    const order = { starter: 1, pro: 2, premium: 3 };
    return order[planKey] || 0;
}

// ==================== INVESTMENT MODAL ====================

// Open investment modal
window.openInvestmentModal = function(coinType) {
    if (isOffline) {
        showNotification('Investment unavailable while offline', 'error');
        return;
    }
    
    if (!isDataLoaded) {
        showNotification('Please wait, loading your account data...', 'info');
        return;
    }
    
    const modal = document.getElementById('investModal');
    const crypto = {
        BTC: { name: "Bitcoin", symbol: "BTC", icon: "fa-brands fa-bitcoin" },
        ETH: { name: "Ethereum", symbol: "ETH", icon: "fa-brands fa-ethereum" },
        TRX: { name: "TRON", symbol: "TRX", icon: "fa-solid fa-coins" },
        DOGE: { name: "Dogecoin", symbol: "DOGE", icon: "fa-brands fa-dogecoin" },
        LTC: { name: "Litecoin", symbol: "LTC", icon: "fa-solid fa-bolt" }
    }[coinType];
    
    if (!crypto || !modal) return;
    
    // Get current plan info
    const planInfo = PLANS[userData.currentPlan || 'starter'];
    
    // Update modal content
    document.getElementById('modalTitle').textContent = `Invest in ${crypto.name}`;
    document.getElementById('modalCoinIcon').innerHTML = `<i class="${crypto.icon}"></i>`;
    document.getElementById('modalCoinName').textContent = `${crypto.name} (${crypto.symbol})`;
    document.getElementById('modalAmount').textContent = planInfo.price;
    document.getElementById('modalROI').textContent = planInfo.roi;
    document.getElementById('modalWallet').value = WALLET_ADDRESSES[coinType];
    document.getElementById('instructionAmount').textContent = planInfo.price;
    document.getElementById('instructionCoin').textContent = crypto.symbol;
    
    // Store current coin
    modal.setAttribute('data-coin', coinType);
    
    // Show modal
    modal.classList.add('active');
};

// Confirm deposit
window.confirmDeposit = async function() {
    const modal = document.getElementById('investModal');
    const coinType = modal.getAttribute('data-coin');
    
    try {
        // Record deposit request (for tracking purposes)
        const depositRef = collection(db, 'deposits');
        await addDoc(depositRef, {
            userId: currentUser.uid,
            userEmail: userData.email,
            userName: userData.name,
            coinType: coinType,
            amount: PLANS[userData.currentPlan].price,
            status: 'pending',
            requestedAt: serverTimestamp()
        });
        
        modal.classList.remove('active');
        
        setTimeout(() => {
            showNotification(
                'Deposit submitted! Admin will verify your transaction within 24 hours.',
                'success'
            );
        }, 300);
    } catch (error) {
        handleError(error, 'Failed to submit deposit');
    }
};

// Copy wallet address
window.copyWalletAddress = function() {
    const walletInput = document.getElementById('modalWallet');
    const copyBtn = document.getElementById('copyWalletBtn');
    
    walletInput.select();
    walletInput.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        copyBtn.style.background = '#17C964';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.background = '';
        }, 2000);
    } catch (err) {
        // Fallback for modern browsers
        navigator.clipboard.writeText(walletInput.value).then(() => {
            showNotification('Wallet address copied!', 'success');
        }).catch(() => {
            showNotification('Failed to copy address', 'error');
        });
    }
};

// ==================== PLAN UPGRADE ====================

// Open upgrade modal
window.openUpgradeModal = function(targetPlan) {
    if (isOffline) {
        showNotification('Upgrade unavailable while offline', 'error');
        return;
    }
    
    if (!isDataLoaded) {
        showNotification('Please wait, loading your account data...', 'info');
        return;
    }
    
    const currentPlanKey = userData.currentPlan || 'starter';
    
    if (getPlanOrder(targetPlan) <= getPlanOrder(currentPlanKey)) {
        showNotification('You cannot downgrade or upgrade to your current plan', 'error');
        return;
    }
    
    const modal = document.getElementById('upgradeModal');
    const targetPlanInfo = PLANS[targetPlan];
    const currentPlanInfo = PLANS[currentPlanKey];
    
    document.getElementById('upgradeCurrentPlan').textContent = currentPlanInfo.name;
    document.getElementById('upgradeNewPlan').textContent = targetPlanInfo.name;
    document.getElementById('upgradeNewROI').textContent = targetPlanInfo.roi;
    
    modal.setAttribute('data-target-plan', targetPlan);
    modal.classList.add('active');
};

// Confirm upgrade
window.confirmUpgrade = async function() {
    const modal = document.getElementById('upgradeModal');
    const targetPlan = modal.getAttribute('data-target-plan');
    const confirmBtn = document.getElementById('confirmUpgradeBtn');
    
    // Prevent double clicks
    if (confirmBtn.disabled) return;
    confirmBtn.disabled = true;
    
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        const targetPlanInfo = PLANS[targetPlan];
        
        await updateDoc(userRef, {
            currentPlan: targetPlan,
            planROI: targetPlanInfo.roi,
            planPrice: targetPlanInfo.price
        });
        
        modal.classList.remove('active');
        
        setTimeout(() => {
            showNotification(`Successfully upgraded to ${targetPlanInfo.name} Plan!`, 'success');
        }, 300);
    } catch (error) {
        handleError(error, 'Failed to upgrade plan');
        confirmBtn.disabled = false;
    }
};

// ==================== WITHDRAWAL ====================

// Submit withdrawal request
window.submitWithdrawal = async function(event) {
    event.preventDefault();
    
    if (isOffline) {
        showNotification('Withdrawal unavailable while offline', 'error');
        return;
    }
    
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const currency = document.getElementById('withdrawCurrency').value;
    const wallet = document.getElementById('withdrawWallet').value.trim();
    
    // Validation
    if (!amount || !currency || !wallet) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (amount < MIN_WITHDRAWAL) {
        showNotification(`Minimum withdrawal amount is $${MIN_WITHDRAWAL}`, 'error');
        return;
    }
    
    if (amount > (userData.balance || 0)) {
        showNotification('Insufficient balance', 'error');
        return;
    }
    
    // Check 24hr cooldown
    const now = Date.now();
    if (now - lastWithdrawalTime < 24 * 60 * 60 * 1000) {
        const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - (now - lastWithdrawalTime)) / (60 * 60 * 1000));
        showNotification(`Please wait ${hoursLeft} more hours before your next withdrawal request`, 'error');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    
    try {
        const withdrawalRef = collection(db, 'withdrawals');
        await addDoc(withdrawalRef, {
            userId: currentUser.uid,
            userEmail: userData.email,
            userName: userData.name,
            amount: amount,
            currency: currency,
            wallet: wallet,
            status: 'pending',
            requestedAt: serverTimestamp()
        });
        
        lastWithdrawalTime = now;
        
        // Clear form
        document.getElementById('withdrawForm').reset();
        
        showNotification('Withdrawal request submitted! Admin will process it within 24 hours.', 'success');
    } catch (error) {
        handleError(error, 'Failed to submit withdrawal request');
    } finally {
        submitBtn.disabled = false;
    }
};

// ==================== LOGOUT ====================

// Logout function
window.logout = async function() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    try {
        // Unsubscribe from listeners
        if (unsubscribeUser) {
            unsubscribeUser();
        }
        
        // Clear state
        currentUser = null;
        userData = null;
        isDataLoaded = false;
        
        // Sign out
        await signOut(auth);
        
        showNotification('Logged out successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        handleError(error, 'Failed to logout');
    }
};

// ==================== EXPORT FUNCTIONS FOR DASHBOARD.JS ====================
window.dashboardAuth = {
    getCurrentUser: () => currentUser,
    getUserData: () => userData,
    isDataLoaded: () => isDataLoaded,
    isOffline: () => isOffline,
    formatCurrency,
    showNotification
};

console.log('Dashboard Auth initialized');