// ==================== dashboard.js v10.2 - CLEANED UP ====================
// TRUSTCORE FINANCE - USER DASHBOARD
// FEATURES: Daily ROI | Location Tracking | Promo Banner | Fixed Crypto Ticker | Clean Analytics | Onboarding Banner

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    updateDoc,
    setDoc,
    collection, 
    addDoc, 
    query,
    where,
    onSnapshot,
    serverTimestamp,
    getDocs,
    writeBatch,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ==================== FIREBASE CONFIG ====================
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== ADMIN BLOCK ====================
const ADMIN_EMAIL = "info@trustfinvest.com";

// ==================== GLOBAL STATE ====================
let currentUser = null;
let userData = null;
let isDataLoaded = false;
let unsubscribeUser = null;
let unsubscribeTransactions = null;
let unsubscribeDeposits = null;
let unsubscribeWithdrawals = null;
let currentTransactionFilter = 'all';
let taskEarnings = 0;
let hasShownWelcomeBack = false;
let portfolioChart = null;
let earningsChart = null;
let locationTrackingInterval = null;

// ==================== QUIZ DATA ====================
const QUIZ_QUESTIONS = [
    {
        question: "What is the primary purpose of diversification in investment?",
        options: [
            "To maximize returns on a single asset",
            "To reduce risk by spreading investments",
            "To focus on high-risk investments only",
            "To avoid all types of investments"
        ],
        correctAnswer: 1
    },
    {
        question: "Which investment typically offers the highest potential returns?",
        options: [
            "Savings account",
            "Government bonds",
            "Stock market",
            "Certificates of deposit"
        ],
        correctAnswer: 2
    },
    {
        question: "What does ROI stand for in investment terms?",
        options: [
            "Return on Investment",
            "Rate of Interest",
            "Risk of Inflation",
            "Revenue on Income"
        ],
        correctAnswer: 0
    },
    {
        question: "What is compound interest?",
        options: [
            "Interest calculated only on the principal amount",
            "Interest calculated on both principal and accumulated interest",
            "A fixed interest rate that never changes",
            "Interest paid only at the end of the investment period"
        ],
        correctAnswer: 1
    },
    {
        question: "Which factor is most important for long-term investment success?",
        options: [
            "Timing the market perfectly",
            "Consistent investing over time",
            "Investing only in popular stocks",
            "Following daily market trends"
        ],
        correctAnswer: 1
    }
];

let currentQuizQuestion = 0;
let quizScore = 0;
let userAnswers = [];

// ==================== PLANS WITH DAILY ROI ====================
const PLANS = {
    starter: { 
        name: "Starter", 
        roi: "5.00% - 5.09%", 
        dailyROI: 0.0509, 
        displayPrice: "$50 – $150", 
        min: 50, 
        max: 150 
    },
    pro: { 
        name: "Pro", 
        roi: "8.00% - 8.45%", 
        dailyROI: 0.0845, 
        displayPrice: "$300 – $500", 
        min: 300, 
        max: 500 
    },
    elite: { 
        name: "Elite", 
        roi: "10.00% - 12.00%", 
        dailyROI: 0.12, 
        displayPrice: "$600 – $1M+", 
        min: 600, 
        max: 1000000 
    }
};

// ==================== WALLET ADDRESSES ====================
const WALLET_ADDRESSES = {
    BTC: "bc1qnj40dkwp0kla7af7hpktg4l24ckd5r3dj78vtm",
    ETH: "0x2617B9664ce6f22C4E230Ff74754e9c0ae14e14A",
    USDT: "TVxToirFGuJ3QWWAWUQkztyxWf6WksezT3",
    TRX: "TVxToirFGuJ3QWWAWUQkztyxWf6WksezT3",
    DOGE: "DJritCr49eoHRTXcK9ZuRffNkaqqhJCvfg",
    LTC: "ltc1qdmslgsyx5l6wfxhdpxp78zkked75mh23m0jqws",
    BNB: "0x2617B9664ce6f22C4E230Ff74754e9c0ae14e14A"
};

// ==================== CRYPTO DATA ====================
const CRYPTO_DATA = {
    BTC: { name: "Bitcoin", symbol: "BTC", icon: "fa-brands fa-bitcoin", color: "#F7931A" },
    ETH: { name: "Ethereum", symbol: "ETH", icon: "fa-brands fa-ethereum", color: "#627EEA" },
    USDT: { name: "Tether", symbol: "USDT", icon: "fa-solid fa-dollar-sign", color: "#26A17B" },
    TRX: { name: "TRON", symbol: "TRX", icon: "fa-solid fa-coins", color: "#FF060A" },
    DOGE: { name: "Dogecoin", symbol: "DOGE", icon: "fa-brands fa-dogecoin", color: "#C2A633" },
    LTC: { name: "Litecoin", symbol: "LTC", icon: "fa-solid fa-bolt", color: "#345D9D" },
    BNB: { name: "Binance Coin", symbol: "BNB", icon: "fa-brands fa-btc", color: "#F3BA2F" }
};

// ==================== PROMO BANNER MANAGEMENT ====================
function initializePromoBanner() {
    const promoBanner = document.getElementById('promoBanner');
    const cancelBtn = document.getElementById('promoCancelBtn');
    
    // Check if user has previously dismissed the banner
    const isBannerDismissed = localStorage.getItem('promoBannerDismissed');
    
    if (isBannerDismissed === 'true') {
        promoBanner.classList.add('hidden');
    }
    
    // Add click event to cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', dismissPromoBanner);
    }
    
    // Fix the Invest Now button navigation
    const promoBtn = document.querySelector('.promo-btn');
    if (promoBtn) {
        promoBtn.onclick = function(e) {
            e.preventDefault();
            navigateToPage('invest');
        };
    }
}

function dismissPromoBanner(silent = false) {
    const promoBanner = document.getElementById('promoBanner');
    
    if (!promoBanner) return;
    
    // Completely remove the banner from DOM immediately
    promoBanner.remove();
    
    // Immediately adjust all layout elements
    const dashboardContainer = document.querySelector('.dashboard-container');
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    
    // Apply immediate layout fixes
    if (dashboardContainer) {
        dashboardContainer.style.marginTop = '40px'; // ticker height only
    }
    if (sidebar) {
        sidebar.style.top = '40px'; // ticker height only
    }
    if (topbar) {
        topbar.style.top = '40px'; // ticker height only
    }
    
    // Store dismissal
    localStorage.setItem('promoBannerDismissed', 'true');
    
    if (!silent) {
        playSound('notification');
        showNotification('Promo banner dismissed', 'info');
    }
}

// ==================== PROMO COUNTDOWN ====================
function initializePromoCountdown() {
    const targetDate = new Date('January 15, 2026 23:59:59').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        if (distance < 0) {
            document.getElementById('promoCountdown').textContent = "Offer Expired";
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('promoCountdown').textContent = 
            `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ==================== FIXED LOCATION TRACKING ====================
async function trackUserLocation(userId) {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn('Geo-location is not supported by this browser.');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    const locationName = await getLocationName(latitude, longitude);
                    
                    await safeFirebaseOperation(async () => {
                        await updateDoc(doc(db, 'users', userId), {
                            lastLocation: {
                                latitude: latitude,
                                longitude: longitude,
                                address: locationName,
                                lastUpdated: serverTimestamp()
                            },
                            updatedAt: serverTimestamp()
                        });
                    });
                    
                    console.log('Location updated successfully');
                    resolve({ latitude, longitude, address: locationName });
                } catch (error) {
                    console.error("Location save failed:", error);
                    // Don't show error to user for location permissions
                    resolve(null);
                }
            },
            (error) => {
                console.log("Geolocation not available:", error.message);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
}

async function getLocationName(lat, lng) {
    try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await response.json();
        
        if (data.city && data.countryName) {
            return `${data.city}, ${data.countryName}`;
        } else if (data.locality) {
            return data.locality;
        } else {
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    } catch (error) {
        console.warn('Reverse geocoding failed:', error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

function initializeLocationTracking() {
    setTimeout(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    await updateUserLocation();
                    
                    locationTrackingInterval = setInterval(async () => {
                        await updateUserLocation();
                    }, 300000);
                },
                (error) => {
                    console.log('Location permission not granted:', error.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        }
    }, 2000);
}

async function updateUserLocation() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const location = await trackUserLocation(user.uid);
        return location;
    } catch (error) {
        console.error('Location update failed:', error);
    }
    return null;
}

function stopLocationTracking() {
    if (locationTrackingInterval) {
        clearInterval(locationTrackingInterval);
        locationTrackingInterval = null;
    }
}

// ==================== UTILITY FUNCTIONS ====================
function formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
}

function formatTaskEarnings(amount) {
    return `${parseFloat(amount || 0).toFixed(3)} tf`;
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed; top: 140px; right: 20px; min-width: 300px; max-width: 450px;
        padding: 16px 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 100000; display: flex; align-items: center; gap: 12px; font-family: 'Poppins', sans-serif;
        font-size: 0.9rem; font-weight: 500; animation: slideIn 0.3s ease; color: white;
        background: ${type === 'success' ? '#17C964' : type === 'error' ? '#FF4D4D' : type === 'warning' ? '#FF9F43' : '#0056D2'};
    `;
    notification.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        <span style="flex:1">${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;font-size:1.2rem;opacity:0.8">
            <i class="fa-solid fa-times"></i>
        </button>
    `;

    if (!document.getElementById('notif-style')) {
        const style = document.createElement('style');
        style.id = 'notif-style';
        style.textContent = `@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    setTimeout(() => { notification.style.opacity = '0'; setTimeout(() => notification.remove(), 300); }, 5000);
}

function safeGet(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`#${id} not found`);
    return el;
}

function safeSetText(id, text) {
    const el = safeGet(id);
    if (el) el.textContent = text || '';
}

function safeSetHTML(id, html) {
    const el = safeGet(id);
    if (el) el.innerHTML = html || '';
}

function setLoading(btn, loading = true) {
    if (!btn) return;
    if (loading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ==================== NETWORK ERROR HANDLING ====================
function handleNetworkError(error) {
    console.warn('Network error:', error);
    
    if (error.message.includes('ERR_SOCKET_NOT_CONNECTED') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('net::ERR')) {
        showNotification('Network connection issue. Please check your internet connection.', 'warning');
        return true;
    }
    return false;
}

async function safeFirebaseOperation(operation) {
    try {
        return await operation();
    } catch (error) {
        if (!handleNetworkError(error)) {
            throw error;
        }
    }
}

// ==================== SOUND NOTIFICATIONS ====================
class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.init();
    }
    
    init() {
        const soundToggle = safeGet('soundToggle');
        if (soundToggle) {
            this.enabled = soundToggle.checked;
            soundToggle.addEventListener('change', (e) => {
                this.enabled = e.target.checked;
            });
        }
        
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }
    
    play(type) {
        if (!this.enabled || !this.audioContext) return;
        
        try {
            switch(type) {
                case 'success':
                    this.playSuccess();
                    break;
                case 'error':
                    this.playError();
                    break;
                case 'notification':
                    this.playNotification();
                    break;
                case 'welcome':
                    this.playWelcome();
                    break;
                case 'task':
                    this.playTask();
                    break;
                case 'investment':
                    this.playInvestment();
                    break;
            }
        } catch (error) {
            console.warn('Sound playback failed:', error);
        }
    }
    
    playSuccess() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    playError() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(196, this.audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(174.61, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }
    
    playNotification() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(698.46, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    playWelcome() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + (index * 0.15));
        });
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.8);
    }
    
    playTask() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const notes = [392, 523.25, 659.25];
        notes.forEach((freq, index) => {
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + (index * 0.1));
        });
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    playInvestment() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const notes = [261.63, 329.63, 392, 523.25];
        notes.forEach((freq, index) => {
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + (index * 0.08));
        });
        
        gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
}

// Initialize sound manager
const soundManager = new SoundManager();

function playSound(type) {
    soundManager.play(type);
}

// ==================== RECENT ACTIVITY ====================
function addRecentActivity(message, type = 'info') {
    const activityList = safeGet('activityList');
    if (!activityList) return;
    
    const activityId = 'activity_' + Date.now();
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.setAttribute('data-id', activityId);
    
    const iconClass = type === 'earning' ? 'fa-coins' : 
                     type === 'investment' ? 'fa-chart-line' : 
                     type === 'withdrawal' ? 'fa-wallet' : 'fa-info-circle';
    
    activityItem.innerHTML = `
        <div class="activity-icon">
            <i class="fa-solid ${iconClass}"></i>
        </div>
        <div class="activity-content">
            <div class="activity-title">${message}</div>
            <div class="activity-time">Just now</div>
        </div>
        <button class="delete-activity-btn" onclick="deleteActivity('${activityId}')">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    
    const emptyState = activityList.querySelector('.activity-item:first-child');
    if (emptyState && emptyState.querySelector('.fa-info-circle')) {
        emptyState.remove();
    }
    
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    const activities = activityList.querySelectorAll('.activity-item');
    if (activities.length > 10) {
        activities[activities.length - 1].remove();
    }
    
    playSound('notification');
}

function deleteActivity(activityId) {
    const activityItem = document.querySelector(`[data-id="${activityId}"]`);
    if (activityItem) {
        activityItem.remove();
    }
    
    const activityList = safeGet('activityList');
    if (activityList && activityList.children.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fa-solid fa-info-circle"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">No recent activity</div>
                    <div class="activity-time">Start investing to see your activity here</div>
                </div>
            </div>
        `;
    }
}

// ==================== WELCOME MODALS ====================
function showWelcomeBackModal() {
    if (hasShownWelcomeBack) return;
    
    const modal = safeGet('welcomeBackModal');
    if (!modal) return;
    
    const userName = userData?.name?.split(' ')[0] || 'Investor';
    safeSetText('welcomeBackUserName', userName);
    
    modal.classList.add('active');
    hasShownWelcomeBack = true;
    
    playSound('welcome');
}

function showTaskWelcomeModal() {
    const modal = safeGet('taskWelcomeModal');
    if (!modal) return;
    
    const userName = userData?.name?.split(' ')[0] || 'User';
    safeSetText('taskWelcomeUserName', userName);
    
    modal.classList.add('active');
    playSound('task');
}

// ==================== TASK EARNINGS DISPLAY ====================
function updateTaskEarningsDisplay() {
    if (!userData) return;
    
    const taskEarnings = userData.taskEarnings || 0;
    safeSetText('taskEarningsDisplay', formatTaskEarnings(taskEarnings));
    safeSetText('totalTaskEarnings', formatTaskEarnings(taskEarnings));
    
    const withdrawalProgress = safeGet('withdrawalProgressFill');
    const currentWithdrawalAmount = safeGet('currentWithdrawal');
    const remainingWithdrawalAmount = safeGet('remainingWithdrawal');
    
    if (withdrawalProgress && currentWithdrawalAmount && remainingWithdrawalAmount) {
        const progressPercent = Math.min((taskEarnings / 5) * 100, 100);
        withdrawalProgress.style.width = `${progressPercent}%`;
        currentWithdrawalAmount.textContent = formatCurrency(taskEarnings);
        remainingWithdrawalAmount.textContent = formatCurrency(Math.max(0, 5 - taskEarnings));
    }
}

// ==================== DAILY ROI CALCULATION ====================
async function checkAndApplyDailyROI() {
    if (!userData || !userData.investedAmount || userData.investedAmount <= 0) return;

    const lastEarned = userData.lastEarningAt?.toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (lastEarned && lastEarned >= today) return;

    const annualROI = PLANS[userData.currentPlan]?.dailyROI || 0.0509;
    const dailyROI = annualROI / 365;
    const earn = Number((userData.investedAmount * dailyROI).toFixed(2));

    if (earn <= 0) return;

    try {
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', currentUser.uid);
        const txRef = doc(collection(db, 'transactions'));

        batch.set(txRef, {
            userId: currentUser.uid,
            userName: userData.name,
            userEmail: userData.email,
            type: 'earning',
            amount: earn,
            status: 'paid',
            description: `Daily ROI (${(annualROI * 100).toFixed(2)}% annual)`,
            timestamp: serverTimestamp()
        });

        batch.update(userRef, {
            balance: (userData.balance || 0) + earn,
            totalEarnings: (userData.totalEarnings || 0) + earn,
            lastEarningAt: serverTimestamp()
        });

        await safeFirebaseOperation(async () => {
            await batch.commit();
        });
        
        showNotification(`You earned ${formatCurrency(earn)} today from daily ROI!`, 'success');
        playSound('success');
        addRecentActivity(`You earned ${formatCurrency(earn)} from daily ROI`, 'earning');
    } catch (err) {
        console.error("Daily ROI failed:", err);
        playSound('error');
    }
}

// ==================== TOTAL EARNINGS CALCULATION ====================
function updateTotalEarningsDisplay() {
    if (!userData) return;
    
    const accountBalance = userData.balance || 0;
    const totalEarnings = userData.totalEarnings || 0;
    
    // Total Earnings = Account Balance + Accumulated Daily ROI
    const displayEarnings = accountBalance + totalEarnings;
    
    safeSetText('totalEarnings', formatCurrency(displayEarnings));
    safeSetText('withdrawBalance', formatCurrency(accountBalance));
    safeSetText('investFormBalance', formatCurrency(accountBalance));
    
    // Update analytics
    safeSetText('portfolioValue', formatCurrency(displayEarnings));
    
    const dailyProfit = calculateDailyProfit();
    safeSetText('dailyProfit', formatCurrency(dailyProfit));
    
    const monthlyReturn = (dailyProfit * 30 / (userData.investedAmount || 1) * 100).toFixed(2);
    safeSetText('monthlyReturn', `${monthlyReturn}%`);
}

function calculateDailyProfit() {
    if (!userData || !userData.investedAmount) return 0;
    const plan = PLANS[userData.currentPlan] || PLANS.starter;
    return (userData.investedAmount * plan.dailyROI / 365);
}

// ==================== ANALYTICS FUNCTIONS ====================
function initializeAnalytics() {
    const analyticsSection = safeGet('analytics');
    if (analyticsSection) {
        // Clean up any referral-related elements
        const referralElements = analyticsSection.querySelectorAll('*');
        referralElements.forEach(el => {
            if (el.textContent.toLowerCase().includes('referral')) {
                el.remove();
            }
        });
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (analyticsSection.classList.contains('active')) {
                        loadAnalyticsData();
                    }
                }
            });
        });
        
        observer.observe(analyticsSection, { attributes: true });
    }
}

function loadAnalyticsData() {
    updateAnalyticsStats();
    updateWithdrawalProgress();
    safeChartInit();
}

function updateAnalyticsStats() {
    if (!userData) return;
    
    const portfolioValue = (userData.balance || 0) + (userData.totalEarnings || 0);
    safeSetText('portfolioValue', formatCurrency(portfolioValue));
    
    const dailyProfit = calculateDailyProfit();
    safeSetText('dailyProfit', formatCurrency(dailyProfit));
    
    const monthlyReturn = (dailyProfit * 30 / (userData.investedAmount || 1) * 100).toFixed(2);
    safeSetText('monthlyReturn', `${monthlyReturn}%`);
    
    const currentPlan = PLANS[userData.currentPlan] || PLANS.starter;
    safeSetText('roiRate', currentPlan.roi);
    
    const activeDays = calculateActiveDays();
    safeSetText('activeDays', activeDays);
    
    const avgDaily = userData.totalEarnings ? (userData.totalEarnings / Math.max(activeDays, 1)).toFixed(2) : '0.00';
    safeSetText('avgDaily', formatCurrency(avgDaily));
}

function calculateActiveDays() {
    if (!userData || !userData.createdAt) return 0;
    const created = userData.createdAt.toDate();
    const now = new Date();
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function updateWithdrawalProgress() {
    if (!userData) return;
    
    const taskEarnings = userData.taskEarnings || 0;
    const progressPercent = Math.min((taskEarnings / 5) * 100, 100);
    
    const progressFill = safeGet('withdrawalProgressFill');
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }
    
    safeSetText('withdrawalPercent', `${progressPercent.toFixed(1)}%`);
    safeSetText('currentWithdrawal', formatCurrency(taskEarnings));
    safeSetText('remainingWithdrawal', formatCurrency(Math.max(0, 5 - taskEarnings)));
    
    const completionEstimate = calculateCompletionEstimate(taskEarnings);
    safeSetText('completionEstimate', completionEstimate);
}

function calculateCompletionEstimate(currentEarnings) {
    if (currentEarnings >= 5) return 'Goal Achieved!';
    
    const dailyEarning = 0.01;
    const remaining = 5 - currentEarnings;
    const daysNeeded = Math.ceil(remaining / dailyEarning);
    
    if (daysNeeded === 1) return 'Tomorrow';
    if (daysNeeded <= 7) return `${daysNeeded} days`;
    if (daysNeeded <= 30) return `${Math.ceil(daysNeeded / 7)} weeks`;
    return `${Math.ceil(daysNeeded / 30)} months`;
}

function safeChartInit() {
    try {
        initializeCharts();
    } catch (error) {
        console.error('Chart initialization error:', error);
    }
}

function initializeCharts() {
    if (portfolioChart) {
        portfolioChart.destroy();
    }
    if (earningsChart) {
        earningsChart.destroy();
    }
    
    const portfolioCtx = safeGet('portfolioChart');
    if (portfolioCtx) {
        portfolioChart = createPortfolioChart(portfolioCtx);
    }
    
    const earningsCtx = safeGet('earningsChart');
    if (earningsCtx) {
        earningsChart = createEarningsChart(earningsCtx);
    }
}

function createPortfolioChart(ctx) {
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [{
            label: 'Portfolio Value',
            data: [500, 800, 1200, 1500, 1800, 2200, 2500],
            borderColor: '#0056D2',
            backgroundColor: 'rgba(0, 86, 210, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#0056D2',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 4
        }]
    };
    
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: { grid: { display: false } }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    };
    
    return new Chart(ctx, config);
}

function createEarningsChart(ctx) {
    const data = {
        labels: ['ROI', 'Tasks'],
        datasets: [{
            data: [65, 25, 10],
            backgroundColor: ['#0056D2', '#FF7A00', '#17C964'],
            borderWidth: 0,
            hoverOffset: 15
        }]
    };
    
    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 12 }
                    }
                }
            }
        }
    };
    
    return new Chart(ctx, config);
}

// ==================== FIXED CRYPTO TICKER ====================
function initializeCryptoTicker() {
    const ticker = document.querySelector('.ticker-content');
    if (ticker) {
        // Clone content for seamless looping
        ticker.innerHTML += ticker.innerHTML;
    }
}

// ==================== DAILY TASKS FUNCTIONALITY ====================
function initializeTasks() {
    console.log('Initializing tasks...', { currentUser, userData });
    
    const dailyCheckinBtn = safeGet('dailyCheckinBtn');
    const quizBtn = safeGet('quizBtn');
    
    if (dailyCheckinBtn) {
        dailyCheckinBtn.addEventListener('click', handleDailyCheckin);
    }
    
    if (quizBtn) {
        quizBtn.addEventListener('click', startQuiz);
    }
    
    checkTaskStatus();
}

function checkTaskStatus() {
    if (!userData) {
        console.log('No user data available for task status check');
        return;
    }
    
    const today = new Date().toDateString();
    const lastTaskCompletion = userData.lastTaskCompletion || {};
    
    console.log('Checking task status:', { today, lastTaskCompletion });
    
    const checkinStatus = safeGet('checkinStatus');
    const dailyCheckinBtn = safeGet('dailyCheckinBtn');
    
    if (lastTaskCompletion.checkin === today) {
        if (checkinStatus) checkinStatus.textContent = "Completed today";
        if (dailyCheckinBtn) {
            dailyCheckinBtn.disabled = true;
            dailyCheckinBtn.innerHTML = '<i class="fa-solid fa-check"></i><span>Completed</span>';
        }
    } else {
        if (checkinStatus) checkinStatus.textContent = "";
        if (dailyCheckinBtn) {
            dailyCheckinBtn.disabled = false;
            dailyCheckinBtn.innerHTML = '<i class="fa-solid fa-calendar-check"></i><span>Check In</span>';
        }
    }
    
    const quizStatus = safeGet('quizStatus');
    const quizBtn = safeGet('quizBtn');
    
    if (lastTaskCompletion.quiz === today) {
        if (quizStatus) quizStatus.textContent = "Completed today";
        if (quizBtn) {
            quizBtn.disabled = true;
            quizBtn.innerHTML = '<i class="fa-solid fa-check"></i><span>Completed</span>';
        }
    } else {
        if (quizStatus) quizStatus.textContent = "";
        if (quizBtn) {
            quizBtn.disabled = false;
            quizBtn.innerHTML = '<i class="fa-solid fa-question-circle"></i><span>Start Now</span>';
        }
    }
}

async function handleDailyCheckin() {
    console.log('Daily check-in clicked', { currentUser, userData });
    
    if (!currentUser || !userData) {
        showNotification('Please log in to complete tasks', 'error');
        playSound('error');
        return;
    }
    
    const today = new Date().toDateString();
    const lastTaskCompletion = userData.lastTaskCompletion || {};
    
    if (lastTaskCompletion.checkin === today) {
        showNotification('You have already checked in today! try again tomorrow', 'info');
        playSound('notification');
        return;
    }
    
    const btn = safeGet('dailyCheckinBtn');
    setLoading(btn, true);
    
    try {
        const earnings = 0.005;
        const newTaskEarnings = (userData.taskEarnings || 0) + earnings;
        
        console.log('Updating user data with check-in');
        
        await safeFirebaseOperation(async () => {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                taskEarnings: newTaskEarnings,
                lastTaskCompletion: {
                    ...lastTaskCompletion,
                    checkin: today
                },
                updatedAt: serverTimestamp()
            });
        });
        
        await safeFirebaseOperation(async () => {
            await addDoc(collection(db, 'transactions'), {
                userId: currentUser.uid,
                userName: userData.name,
                userEmail: userData.email,
                type: 'earning',
                amount: earnings,
                status: 'paid',
                description: 'Daily check-in reward',
                timestamp: serverTimestamp()
            });
        });
        
        updateTaskEarningsDisplay();
        checkTaskStatus();
        
        showNotification(`You earned ${formatTaskEarnings(earnings)} from daily check-in!`, 'success');
        playSound('success');
        addRecentActivity(`You earned ${formatTaskEarnings(earnings)} from daily check-in`, 'earning');
        
    } catch (error) {
        console.error('Error completing daily check-in:', error);
        showNotification('Failed to complete check-in. Please try again.', 'error');
        playSound('error');
    } finally {
        setLoading(btn, false);
    }
}

function startQuiz() {
    console.log('Quiz started', { currentUser, userData });
    
    if (!currentUser || !userData) {
        showNotification('Please log in to complete tasks', 'error');
        playSound('error');
        return;
    }
    
    const today = new Date().toDateString();
    const lastTaskCompletion = userData.lastTaskCompletion || {};
    
    if (lastTaskCompletion.quiz === today) {
        showNotification('You have already completed the quiz today! try again tomorrow', 'info');
        playSound('notification');
        return;
    }
    
    currentQuizQuestion = 0;
    quizScore = 0;
    userAnswers = [];
    
    const quizModal = safeGet('quizModal');
    if (quizModal) {
        quizModal.classList.add('active');
        loadQuizQuestion();
    }
}

function loadQuizQuestion() {
    if (!QUIZ_QUESTIONS || QUIZ_QUESTIONS.length === 0) {
        console.error('No quiz questions available');
        return;
    }
    
    if (currentQuizQuestion >= QUIZ_QUESTIONS.length) {
        console.error('Current question index out of bounds:', currentQuizQuestion);
        return;
    }
    
    const question = QUIZ_QUESTIONS[currentQuizQuestion];
    if (!question) {
        console.error('Question not found at index:', currentQuizQuestion);
        return;
    }
    
    console.log('Loading quiz question:', currentQuizQuestion, question);
    
    const progress = ((currentQuizQuestion + 1) / QUIZ_QUESTIONS.length) * 100;
    const progressBar = safeGet('quizProgress');
    const currentQuestionSpan = safeGet('currentQuestion');
    
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (currentQuestionSpan) currentQuestionSpan.textContent = currentQuizQuestion + 1;
    
    const questionElement = safeGet('quizQuestion');
    const optionsElement = safeGet('quizOptions');
    
    if (questionElement) questionElement.textContent = question.question;
    
    if (optionsElement) {
        optionsElement.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'quiz-option';
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => selectAnswer(index));
            optionsElement.appendChild(optionElement);
        });
    }
    
    const prevBtn = safeGet('prevQuestionBtn');
    const nextBtn = safeGet('nextQuestionBtn');
    
    if (prevBtn) {
        prevBtn.style.display = currentQuizQuestion > 0 ? 'flex' : 'none';
    }
    
    if (nextBtn) {
        nextBtn.textContent = currentQuizQuestion === QUIZ_QUESTIONS.length - 1 ? 'Finish Quiz' : 'Next Question';
    }
}

function selectAnswer(answerIndex) {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => option.classList.remove('selected'));
    options[answerIndex].classList.add('selected');
    
    userAnswers[currentQuizQuestion] = answerIndex;
}

function nextQuestion() {
    if (currentQuizQuestion >= QUIZ_QUESTIONS.length) {
        console.error('Current question index out of bounds in nextQuestion:', currentQuizQuestion);
        return;
    }
    
    if (userAnswers[currentQuizQuestion] === undefined) {
        showNotification('Please select an answer', 'warning');
        playSound('error');
        return;
    }
    
    const currentQuestion = QUIZ_QUESTIONS[currentQuizQuestion];
    if (currentQuestion && userAnswers[currentQuizQuestion] === currentQuestion.correctAnswer) {
        quizScore++;
        console.log('Correct answer! Score:', quizScore);
    }
    
    currentQuizQuestion++;
    
    if (currentQuizQuestion < QUIZ_QUESTIONS.length) {
        loadQuizQuestion();
    } else {
        finishQuiz();
    }
}

function previousQuestion() {
    if (currentQuizQuestion > 0) {
        currentQuizQuestion--;
        loadQuizQuestion();
    }
}

async function finishQuiz() {
    console.log('Finishing quiz with score:', quizScore, 'out of', QUIZ_QUESTIONS.length);
    
    let earnings = 0;
    let resultType = '';
    
    if (quizScore >= 4) {
        earnings = 0.005;
        resultType = 'gold';
    } else if (quizScore >= 2) {
        earnings = 0.003;
        resultType = 'silver';
    } else if (quizScore >= 1) {
        earnings = 0.001;
        resultType = 'bronze';
    } else {
        showQuizResult(0, resultType);
        return;
    }
    
    const today = new Date().toDateString();
    const lastTaskCompletion = userData.lastTaskCompletion || {};
    
    try {
        const newTaskEarnings = (userData.taskEarnings || 0) + earnings;
        
        console.log('Updating user data with quiz results');
        
        await safeFirebaseOperation(async () => {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                taskEarnings: newTaskEarnings,
                lastTaskCompletion: {
                    ...lastTaskCompletion,
                    quiz: today
                },
                updatedAt: serverTimestamp()
            });
        });
        
        await safeFirebaseOperation(async () => {
            await addDoc(collection(db, 'transactions'), {
                userId: currentUser.uid,
                userName: userData.name,
                userEmail: userData.email,
                type: 'earning',
                amount: earnings,
                status: 'paid',
                description: `Investment quiz reward (${quizScore}/5 correct)`,
                timestamp: serverTimestamp()
            });
        });
        
        updateTaskEarningsDisplay();
        checkTaskStatus();
        showQuizResult(earnings, resultType);
        
    } catch (error) {
        console.error('Error completing quiz:', error);
        showNotification('Failed to save quiz results. Please try again.', 'error');
        playSound('error');
    }
}

function showQuizResult(earnings, resultType) {
    const quizModal = safeGet('quizModal');
    const resultModal = safeGet('quizResultModal');
    
    if (quizModal) quizModal.classList.remove('active');
    
    if (resultModal) {
        const resultIcon = safeGet('quizResultIcon');
        const resultTitle = safeGet('quizResultTitle');
        const resultMessage = safeGet('quizResultMessage');
        const earningsAmount = safeGet('quizEarningsAmount');
        
        if (resultIcon) {
            resultIcon.className = 'quiz-result-icon ' + resultType;
        }
        
        if (earnings > 0) {
            if (resultTitle) resultTitle.textContent = 'Congratulations!';
            if (resultMessage) resultMessage.textContent = `HURRAY You've just won ${formatTaskEarnings(earnings)} today. You can earn more tomorrow when you play again.`;
            if (earningsAmount) {
                earningsAmount.textContent = formatTaskEarnings(earnings);
                earningsAmount.style.display = 'flex';
            }
            
            showNotification(`You earned ${formatTaskEarnings(earnings)} from the quiz!`, 'success');
            playSound('success');
            addRecentActivity(`You earned ${formatTaskEarnings(earnings)} from investment quiz (${quizScore}/5)`, 'earning');
        } else {
            if (resultTitle) resultTitle.textContent = 'Try Again';
            if (resultMessage) resultMessage.textContent = "You didn't win anything today. Try again later to earn tokens.";
            if (earningsAmount) earningsAmount.style.display = 'none';
            
            showNotification('Better luck next time! Complete the quiz tomorrow.', 'info');
            playSound('notification');
        }
        
        resultModal.classList.add('active');
    }
}

// ==================== TRANSACTION TAB SWITCHING ====================
function initializeTransactionFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            currentTransactionFilter = filter;
            filterTransactions(filter);
        });
    });
}

function filterTransactions(filterType) {
    const rows = document.querySelectorAll('#transactionsBody tr');
    let hasVisibleRows = false;
    
    rows.forEach(row => {
        if (row.classList.contains('empty-state')) {
            row.style.display = 'none';
            return;
        }
        
        const rowType = row.getAttribute('data-type');
        
        if (filterType === 'all' || rowType === filterType) {
            row.style.display = 'table-row';
            hasVisibleRows = true;
        } else {
            row.style.display = 'none';
        }
    });
    
    showEmptyStateIfNeeded(filterType, hasVisibleRows);
}

function showEmptyStateIfNeeded(filterType, hasVisibleRows) {
    const tbody = safeGet('transactionsBody');
    const existingEmptyState = tbody.querySelector('.empty-state');
    
    if (!hasVisibleRows) {
        if (!existingEmptyState) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="6">
                        <i class="fa-solid fa-inbox"></i>
                        <p>No ${filterType === 'all' ? 'transactions' : filterType + 's'} yet</p>
                        <small>Your ${filterType === 'all' ? 'transaction history' : filterType + ' history'} will appear here</small>
                    </td>
                </tr>
            `;
        } else {
            existingEmptyState.style.display = 'table-row';
        }
    } else if (existingEmptyState) {
        existingEmptyState.style.display = 'none';
    }
}

// ==================== DELETE TRANSACTION FUNCTION ====================
async function deleteTransaction(transactionId, source) {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        return;
    }

    try {
        let collectionName;
        let canDelete = false;
        
        switch(source) {
            case 'tx':
                collectionName = 'transactions';
                canDelete = true; // Users can delete their own transactions
                break;
            case 'dep':
                collectionName = 'deposits';
                canDelete = false; // Users cannot delete deposits
                break;
            case 'wd':
                collectionName = 'withdrawals';
                canDelete = false; // Users cannot delete withdrawals
                break;
            default:
                throw new Error('Invalid transaction source');
        }

        if (!canDelete) {
            showNotification('You do not have permission to delete this type of transaction. Please contact admin.', 'error');
            playSound('error');
            return;
        }

        await safeFirebaseOperation(async () => {
            await deleteDoc(doc(db, collectionName, transactionId));
        });
        
        showNotification('Transaction deleted successfully!', 'success');
        playSound('success');
    } catch (error) {
        console.error('Error deleting transaction:', error);
        
        if (error.code === 'permission-denied') {
            showNotification('Permission denied. You cannot delete this transaction.', 'error');
        } else {
            showNotification('Failed to delete transaction. Please try again.', 'error');
        }
        playSound('error');
    }
}

// ==================== BADGE UPDATE (PENDING COUNT) ====================
function updateTransactionBadge() {
    const badge = document.querySelector('.transactions-badge');
    if (!badge) return;

    const pendingRows = document.querySelectorAll('#transactionsBody tr[data-status="pending"]');
    const count = pendingRows.length;

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.add('active');
    } else {
        badge.textContent = '';
        badge.classList.remove('active');
    }
}

// ==================== LOAD & RENDER ALL TRANSACTIONS ====================
async function loadTransactions(uid) {
    [unsubscribeTransactions, unsubscribeDeposits, unsubscribeWithdrawals].forEach(fn => fn?.());

    const tbody = safeGet('transactionsBody');
    if (!tbody) return;

    const txQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
    const depQuery = query(collection(db, 'deposits'), where('userId', '==', uid));
    const wdQuery = query(collection(db, 'withdrawals'), where('userId', '==', uid));

    const render = async () => {
        try {
            const [txSnap, depSnap, wdSnap] = await Promise.all([
                getDocs(txQuery),
                getDocs(depQuery),
                getDocs(wdQuery)
            ]);

            const all = [];

            txSnap.forEach(d => all.push({ id: d.id, source: 'tx', ...d.data() }));
            depSnap.forEach(d => all.push({ id: d.id, source: 'dep', type: 'deposit', ...d.data() }));
            wdSnap.forEach(d => all.push({ id: d.id, source: 'wd', type: 'withdrawal', ...d.data() }));

            all.sort((a, b) => {
                const tsA = a.timestamp?.toMillis() || a.requestedAt?.toMillis() || 0;
                const tsB = b.timestamp?.toMillis() || b.requestedAt?.toMillis() || 0;
                return tsB - tsA;
            });

            if (all.length === 0) {
                tbody.innerHTML = `<tr class="empty-state"><td colspan="6">
                    <i class="fa-solid fa-inbox"></i><p>No transactions yet</p>
                    <small>Your transaction history will appear here</small>
                </td></tr>`;
                updateTransactionBadge();
                return;
            }

            tbody.innerHTML = all.slice(0, 50).map(t => {
                const date = (t.timestamp || t.requestedAt)
                    ? new Date((t.timestamp || t.requestedAt).toDate()).toLocaleDateString()
                    : '—';

                const status = t.status === 'approved' || t.status === 'paid' ? 'success'
                             : t.status === 'pending' ? 'warning'
                             : 'error';

                const statusText = t.status === 'approved' ? 'completed' : t.status;

                const typeLabel = t.type === 'deposit' ? 'Deposit' :
                                  t.type === 'withdrawal' ? 'Withdrawal' :
                                  t.type?.charAt(0).toUpperCase() + t.type?.slice(1);

                const desc = t.description ||
                             (t.type === 'deposit' ? `Investment via ${t.coinType}` :
                              t.type === 'withdrawal' ? `Withdrawal to ${t.currency?.toUpperCase()}` : '');

                return `<tr data-type="${t.type}" data-status="${t.status}">
                    <td>${date}</td>
                    <td><span class="badge badge-${t.type}">${typeLabel}</span></td>
                    <td><strong>${formatCurrency(t.amount)}</strong></td>
                    <td><span class="status-badge status-${status}">${statusText}</span></td>
                    <td>${desc}</td>
                    <td>
                        <button class="delete-transaction-btn" data-id="${t.id}" data-source="${t.source}" title="Delete Transaction">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
            }).join('');

            document.querySelectorAll('.delete-transaction-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const transactionId = btn.getAttribute('data-id');
                    const source = btn.getAttribute('data-source');
                    deleteTransaction(transactionId, source);
                });
            });

            updateTransactionBadge();
            filterTransactions(currentTransactionFilter);

            if (document.querySelector('.page-section.active')?.id === 'transactions') {
                const badge = document.querySelector('.transactions-badge');
                if (badge) badge.classList.remove('active');
            }

        } catch (err) {
            console.error("Render failed:", err);
            tbody.innerHTML = `<tr class="empty-state"><td colspan="6">
                <i class="fa-solid fa-exclamation-triangle"></i><p>Failed to load</p>
                <small>Check connection and try again</small>
            </td></tr>`;
        }
    };

    unsubscribeTransactions = onSnapshot(txQuery, render, err => console.error("TX listener:", err));
    unsubscribeDeposits = onSnapshot(depQuery, render, err => console.error("Dep listener:", err));
    unsubscribeWithdrawals = onSnapshot(wdQuery, render, err => console.error("WD listener:", err));

    await render();
}

// ==================== AUTH & USER LOAD ====================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;

    if (user.email === ADMIN_EMAIL) {
        showNotification('We are redirecting you to the Admin Panel...', 'info');
        setTimeout(() => window.location.href = 'admin.html', 1500);
        return;
    }

    try {
        await loadUserData(user.uid);
        await checkAndApplyDailyROI();
        
        // Initialize location tracking after user data is loaded
        initializeLocationTracking();
        
        setTimeout(() => {
            showWelcomeBackModal();
        }, 1000);
        
    } catch (err) {
        showNotification("Failed to load dashboard.", "error");
        playSound('error');
    }
});

// ==================== USER DATA ====================
async function loadUserData(uid) {
    try {
        const ref = doc(db, 'users', uid);
        unsubscribeUser?.();

        unsubscribeUser = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                userData = snap.data();
                updateDashboardUI();
                updateInvestmentForm();
                updatePlanCards();
                loadWalletInfo();
                updateTaskEarningsDisplay();
                initializeTasks();
                isDataLoaded = true;
                
                // Update total earnings display whenever user data changes
                updateTotalEarningsDisplay();
                
                // Show onboarding banner for new users
                if (!userData.hasSeenOnboarding) {
                    setTimeout(() => {
                        showOnboardingBanner();
                    }, 1000);
                }
            } else {
                createDefaultUser(uid);
            }
        }, (err) => {
            console.error("User data load error:", err);
            showNotification('Failed to load profile. Check your network connection.', 'error');
            playSound('error');
        });
    } catch (e) {
        console.error("User data load exception:", e);
        showNotification('Database error.', 'error');
        playSound('error');
    }
}

async function createDefaultUser(uid) {
    const data = {
        name: currentUser.displayName || 'User',
        email: currentUser.email,
        balance: 0,
        investedAmount: 0,
        currentPlan: 'starter',
        totalEarnings: 0,
        activeInvestments: 0,
        lastEarningAt: null,
        country: 'Not specified',
        emailVerified: true,
        wallets: { btc: '', eth: '', usdt: '' },
        taskEarnings: 0,
        lastTaskCompletion: {},
        hasSeenOnboarding: false,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
    };
    try {
        await safeFirebaseOperation(async () => {
            await setDoc(doc(db, 'users', uid), data);
        });
        userData = data;
        updateDashboardUI();
        initializeTasks();
        
        // Show onboarding banner for new users
        setTimeout(() => {
            showOnboardingBanner();
        }, 1000);
    } catch (err) {
        showNotification("Failed to create your profile.", "error");
        playSound('error');
    }
}

// ==================== ENHANCED DASHBOARD UI UPDATES ====================
function updateDashboardUI() {
    if (!userData) return;
    const plan = PLANS[userData.currentPlan] || PLANS.starter;
    const name = userData.name?.split(' ')[0] || 'User';

    safeSetText('sidebarUserName', userData.name);
    safeSetText('sidebarUserEmail', userData.email);
    safeSetText('topbarUserName', userData.name);
    safeSetText('welcomeUserName', name);
    safeSetText('activeInvestments', userData.activeInvestments || 0);
    safeSetText('currentPlan', plan.name);

    // Update Total Earnings (Account Balance + Accumulated Daily ROI)
    updateTotalEarningsDisplay();

    const annualROI = PLANS[userData.currentPlan]?.dailyROI || 0.0509;
    const dailyROI = ((annualROI / 365) * 100).toFixed(4);
    const dailyEarn = ((userData.investedAmount || 0) * (annualROI / 365)).toFixed(2);

    const roiBadge = dailyEarn > 0
        ? `<span style="color:#17C964;font-size:0.8rem;margin-left:8px;font-weight:600">(+${dailyROI}%)</span>`
        : '';

    safeSetHTML('totalBalance', `${formatCurrency(userData.balance)}${roiBadge}`);

    const nameInput = safeGet('settingsNameInput');
    if (nameInput) nameInput.value = userData.name || '';
    safeSetText('settingsEmail', userData.email || 'N/A');
    safeSetText('settingsCountry', userData.country || 'Not specified');

    if (userData.createdAt?.toDate) {
        safeSetText('settingsMemberSince', userData.createdAt.toDate().toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        }));
    }

    const roiEl = document.querySelector('#home .stat-card:nth-child(4) .stat-info');
    if (roiEl) roiEl.textContent = plan.roi;
}

// ==================== INVESTMENT FORM ====================
function updateInvestmentForm() {
    if (!userData) return;
    const planSelect = safeGet('investmentPlan');
    if (!planSelect) return;

    const currentPlanLevel = { starter: 1, pro: 2, elite: 3 }[userData.currentPlan] || 1;

    planSelect.innerHTML = `
        <option value="">Select a plan...</option>
        <option value="starter">${currentPlanLevel >= 1 ? 'Active ' : ''}Starter Plan ($50 - $150)</option>
        <option value="pro" ${currentPlanLevel < 2 ? 'disabled' : ''}>${currentPlanLevel >= 2 ? 'Active ' : ''}Pro Plan ($300 - $500)${currentPlanLevel < 2 ? ' - Upgrade Required' : ''}</option>
        <option value="elite" ${currentPlanLevel < 3 ? 'disabled' : ''}>${currentPlanLevel >= 3 ? 'Active ' : ''}Elite Plan ($600 - $1M+)${currentPlanLevel < 3 ? ' - Upgrade Required' : ''}</option>
    `;
}

safeGet('investmentPlan')?.addEventListener('change', (e) => {
    const plan = e.target.value;
    if (!plan || !PLANS[plan]) {
        safeSetText('planRoiHint', 'Select a plan to see ROI details');
        safeSetText('amountRangeHint', 'Please select a plan first');
        safeGet('investmentAmount').min = 50;
        return;
    }

    const planData = PLANS[plan];
    safeSetText('planRoiHint', `Daily ROI: ${planData.roi} | Annual: ${(planData.dailyROI * 100).toFixed(2)}%`);
    safeSetText('amountRangeHint', `Enter amount between ${formatCurrency(planData.min)} and ${formatCurrency(planData.max)}`);
    
    const amountInput = safeGet('investmentAmount');
    if (amountInput) {
        amountInput.min = planData.min;
        amountInput.max = planData.max;
    }

    updateInvestmentSummary();
});

safeGet('investmentAmount')?.addEventListener('input', updateInvestmentSummary);
safeGet('paymentOption')?.addEventListener('change', updateInvestmentSummary);

function updateInvestmentSummary() {
    const plan = safeGet('investmentPlan')?.value;
    const amount = parseFloat(safeGet('investmentAmount')?.value);
    const crypto = safeGet('paymentOption')?.value;
    const summary = safeGet('investmentSummary');

    if (!plan || !amount || !crypto || !summary) {
        if (summary) summary.style.display = 'none';
        return;
    }

    const planData = PLANS[plan];
    const dailyROI = (amount * planData.dailyROI / 365).toFixed(2);

    summary.style.display = 'block';
    safeSetText('summaryPlan', planData.name);
    safeSetText('summaryAmount', formatCurrency(amount));
    safeSetText('summaryCrypto', CRYPTO_DATA[crypto]?.name || crypto);
    safeSetText('summaryROI', `${formatCurrency(dailyROI)} per day`);
}

// ==================== SUBMIT INVESTMENT ====================
safeGet('investmentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const plan = safeGet('investmentPlan')?.value;
    const amount = parseFloat(safeGet('investmentAmount')?.value);
    const crypto = safeGet('paymentOption')?.value;

    if (!plan || !amount || !crypto) {
        showNotification('Please fill all fields', 'error');
        playSound('error');
        return;
    }

    const planData = PLANS[plan];
    if (amount < planData.min || amount > planData.max) {
        showNotification(`Amount must be between ${formatCurrency(planData.min)} and ${formatCurrency(planData.max)}`, 'error');
        playSound('error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    setLoading(btn, true);

    try {
        await safeFirebaseOperation(async () => {
            await addDoc(collection(db, 'deposits'), {
                userId: currentUser.uid,
                userEmail: userData.email,
                userName: userData.name,
                coinType: crypto,
                amount: amount,
                plan: plan,
                status: 'pending',
                requestedAt: serverTimestamp()
            });
        });

        openPaymentModal(crypto, amount, planData);
        e.target.reset();
        safeGet('investmentSummary').style.display = 'none';
        showNotification('Investment request created! Please complete payment.', 'success');
        playSound('investment');
        addRecentActivity(`You invested ${formatCurrency(amount)} in ${planData.name} plan`, 'investment');
    } catch (err) {
        showNotification('Failed to create investment: ' + err.message, 'error');
        playSound('error');
    } finally {
        setLoading(btn, false);
    }
});

function openPaymentModal(crypto, amount, planData) {
    const modal = safeGet('investModal');
    const cryptoData = CRYPTO_DATA[crypto];

    safeSetText('modalTitle', `Invest in ${cryptoData.name}`);
    safeSetHTML('modalCoinIcon', `<i class="${cryptoData.icon}"></i>`);
    safeGet('modalCoinIcon').style.background = `linear-gradient(135deg, ${cryptoData.color}, ${cryptoData.color}dd)`;
    safeSetText('modalCoinName', `${cryptoData.name} (${cryptoData.symbol})`);
    safeSetText('modalAmount', formatCurrency(amount));
    safeSetText('modalROI', planData.roi);
    safeGet('modalWallet').value = WALLET_ADDRESSES[crypto] || '';
    safeSetText('instructionAmount', formatCurrency(amount));
    safeSetText('instructionCoin', cryptoData.symbol);

    modal.classList.add('active');
}

safeGet('confirmDepositBtn')?.addEventListener('click', () => {
    safeGet('investModal')?.classList.remove('active');
    showNotification('Deposit confirmed! Please wait for the admin approval.', 'success');
    playSound('success');
});

safeGet('copyWalletBtn')?.addEventListener('click', () => {
    const input = safeGet('modalWallet');
    const btn = safeGet('copyWalletBtn');
    if (!input || !btn) return;

    input.select();
    navigator.clipboard?.writeText(input.value).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        btn.style.background = '#17C964';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);
        showNotification('Wallet address copied!', 'success');
        playSound('success');
    }).catch(() => {
        showNotification('Copy failed', 'error');
        playSound('error');
    });
});

// ==================== PROFILE & WALLET ====================
safeGet('updateProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = safeGet('settingsNameInput')?.value.trim();
    if (!name) {
        showNotification('Name required', 'error');
        playSound('error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    setLoading(btn, true);

    try {
        await updateProfile(currentUser, { displayName: name });
        await safeFirebaseOperation(async () => {
            await updateDoc(doc(db, 'users', currentUser.uid), { name, updatedAt: serverTimestamp() });
        });
        showNotification('Your profile has been updated sucessfully!', 'success');
        playSound('success');
    } catch (err) {
        showNotification('Update failed', 'error');
        playSound('error');
    } finally {
        setLoading(btn, false);
    }
});

function loadWalletInfo() {
    if (!userData?.wallets) return;
    safeGet('btcWallet') && (safeGet('btcWallet').value = userData.wallets.btc || '');
    safeGet('ethWallet') && (safeGet('ethWallet').value = userData.wallets.eth || '');
    safeGet('usdtWallet') && (safeGet('usdtWallet').value = userData.wallets.usdt || '');
}

safeGet('walletInfoForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const wallets = {
        btc: safeGet('btcWallet')?.value.trim() || '',
        eth: safeGet('ethWallet')?.value.trim() || '',
        usdt: safeGet('usdtWallet')?.value.trim() || ''
    };

    const btn = e.target.querySelector('button[type="submit"]');
    setLoading(btn, true);

    try {
        await safeFirebaseOperation(async () => {
            await updateDoc(doc(db, 'users', currentUser.uid), { wallets, updatedAt: serverTimestamp() });
        });
        showNotification('Wallet address saved!', 'success');
        playSound('success');
    } catch (err) {
        showNotification('Save failed', 'error');
        playSound('error');
    } finally {
        setLoading(btn, false);
    }
});

// ==================== UPGRADE & WITHDRAWAL ====================
function openUpgradeModal(target) {
    if (!isDataLoaded) {
        showNotification('Loading...', 'info');
        return;
    }
    const current = userData.currentPlan;
    if (PLANS[target].min <= PLANS[current].min) {
        showNotification('Invalid upgrade.', 'error');
        playSound('error');
        return;
    }

    const modal = safeGet('upgradeModal');
    safeSetText('upgradeCurrentPlan', PLANS[current].name);
    safeSetText('upgradeNewPlan', PLANS[target].name);
    safeSetText('upgradeNewROI', PLANS[target].roi);
    modal.setAttribute('data-target-plan', target);
    modal.classList.add('active');
}

async function confirmUpgrade() {
    const modal = safeGet('upgradeModal');
    const target = modal.getAttribute('data-target-plan');
    const btn = safeGet('confirmUpgradeBtn');
    if (!btn || btn.disabled) return;

    setLoading(btn, true);

    try {
        await safeFirebaseOperation(async () => {
            await updateDoc(doc(db, 'users', currentUser.uid), { currentPlan: target, updatedAt: serverTimestamp() });
        });
        modal.classList.remove('active');
        showNotification(`Upgraded to ${PLANS[target].name}!`, 'success');
        playSound('success');
        setTimeout(() => { updateInvestmentForm(); updatePlanCards(); updateDashboardUI(); }, 500);
    } catch (e) {
        showNotification('Upgrade failed.', 'error');
        playSound('error');
    } finally {
        setLoading(btn, false);
    }
}

function updatePlanCards() {
    const current = userData?.currentPlan || 'starter';
    const order = { starter: 1, pro: 2, elite: 3 };

    document.querySelectorAll('.plan-card').forEach(card => {
        const btn = card.querySelector('[data-upgrade]');
        const priceEl = card.querySelector('.plan-price');
        if (!btn) return;

        const target = btn.getAttribute('data-upgrade');
        const info = PLANS[target];

        if (priceEl) priceEl.textContent = info.displayPrice;

        if (target === current) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Current Plan';
            btn.classList.add('disabled');
        } else if (order[target] < order[current]) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> Completed';
            btn.classList.add('disabled');
        } else {
            btn.disabled = false;
            btn.innerHTML = `Upgrade to ${info.name}`;
            btn.classList.remove('disabled');
        }
    });
}

async function submitWithdrawal(e) {
    e.preventDefault();

    const amount = parseFloat(safeGet('withdrawAmount')?.value);
    const currency = safeGet('withdrawCurrency')?.value;
    const wallet = safeGet('withdrawWallet')?.value?.trim();

    if (!amount || !currency || !wallet) {
        showNotification('Fill all fields.', 'error');
        playSound('error');
        return;
    }
    if (amount < 10) {
        showNotification('Minimum $10.', 'error');
        playSound('error');
        return;
    }
    if (amount > userData.balance) {
        showNotification('Insufficient balance.', 'error');
        playSound('error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    setLoading(btn, true);

    try {
        await safeFirebaseOperation(async () => {
            await addDoc(collection(db, 'withdrawals'), {
                userId: currentUser.uid,
                userEmail: userData.email,
                userName: userData.name,
                amount, currency, wallet,
                status: 'pending',
                requestedAt: serverTimestamp()
            });
        });
        e.target.reset();
        showNotification('Withdrawal request submitted!', 'success');
        playSound('success');
        addRecentActivity(`You requested a withdrawal of ${formatCurrency(amount)}`, 'withdrawal');
    } catch (e) {
        showNotification('Failed to submit.', 'error');
        playSound('error');
    } finally {
        setLoading(btn, false);
    }
}

// ==================== ONBOARDING BANNER ====================
function showOnboardingBanner() {
    // Check if user has already seen the onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    
    if (hasSeenOnboarding === 'true') {
        return; // Don't show if already seen
    }
    
    const userName = userData?.name?.split(' ')[0] || 'User';
    
    // Create onboarding banner
    const banner = document.createElement('div');
    banner.id = 'onboarding-banner';
    banner.style.cssText = `
        position: fixed;
        top: 40px;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #0056D2, #003399);
        color: white;
        padding: 20px;
        text-align: center;
        z-index: 9998;
        font-family: 'Poppins', sans-serif;
        animation: slideDown 0.5s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
        box-shadow: 0 4px 20px rgba(0, 86, 210, 0.3);
    `;
    
    banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px; max-width: 800px; width: 100%;">
            <div style="flex: 1; text-align: left;">
                <h3 style="margin: 0 0 5px 0; font-size: 1.2rem; font-weight: 600;">
                    Congratulations ${userName}! Your account has been created.
                </h3>
                <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">
                    Start trading like a professional. Click the button below to go to the dashboard.
                </p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button id="goToDashboardBtn" style="
                    background: white;
                    color: #0056D2;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'" 
                  onmouseout="this.style.transform='none'">
                    Go to Dashboard
                </button>
                <button id="closeOnboardingBtn" style="
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    cursor: pointer;
                    font-size: 1.2rem;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                  onmouseout="this.style.background='transparent'">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add animation style if not present
    if (!document.getElementById('banner-anim')) {
        const style = document.createElement('style');
        style.id = 'banner-anim';
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(-100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Add event listeners
    document.getElementById('goToDashboardBtn').addEventListener('click', () => {
        dismissOnboardingBanner();
        playSound('success');
    });
    
    document.getElementById('closeOnboardingBtn').addEventListener('click', dismissOnboardingBanner);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        if (document.getElementById('onboarding-banner')) {
            dismissOnboardingBanner();
        }
    }, 10000);
}

function dismissOnboardingBanner() {
    const banner = document.getElementById('onboarding-banner');
    if (!banner) return;
    
    banner.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => {
        if (banner.parentElement) {
            banner.remove();
        }
    }, 300);
    
    // Store that user has seen onboarding in localStorage
    localStorage.setItem('hasSeenOnboarding', 'true');
    
    // Also update Firestore to track this
    if (currentUser && userData) {
        safeFirebaseOperation(async () => {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                hasSeenOnboarding: true,
                updatedAt: serverTimestamp()
            });
        }).catch(console.error);
    }
    
    playSound('notification');
}

// ==================== LOGOUT ====================
async function logout() {
    if (!confirm('Logout?')) return;
    try {
        // Stop location tracking
        stopLocationTracking();
        
        [unsubscribeUser, unsubscribeTransactions, unsubscribeDeposits, unsubscribeWithdrawals].forEach(fn => fn?.());
        await signOut(auth);
        showNotification('Logged out.', 'success');
        playSound('success');
        setTimeout(() => location.href = 'index.html', 1000);
    } catch (e) {
        showNotification('Logout failed.', 'error');
        playSound('error');
    }
}

// ==================== DOM READY ====================
document.addEventListener('DOMContentLoaded', () => {
    initializePromoCountdown();
    initializeCryptoTicker();
    initializeAnalytics();
    initializePromoBanner();
    
    const transactionNav = document.querySelector('[data-page="transactions"] .nav-link');
    if (transactionNav && !transactionNav.querySelector('.transactions-badge')) {
        transactionNav.insertAdjacentHTML('beforeend', '<span class="transactions-badge"></span>');
    }

    initializeTransactionFilters();

    document.querySelectorAll('.nav-item, .action-card').forEach(el => {
        el.addEventListener('click', e => {
            const p = el.getAttribute('data-page') || el.getAttribute('data-action');
            if (p) { e.preventDefault(); navigateToPage(p); }
        });
    });

    safeGet('menuToggle')?.addEventListener('click', () => safeGet('sidebar')?.classList.toggle('active'));
    document.querySelector('.sidebar-close')?.addEventListener('click', () => safeGet('sidebar')?.classList.remove('active'));

    const profile = safeGet('userProfile');
    const dropdown = safeGet('userDropdown');
    if (profile && dropdown) {
        profile.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('active'); });
        document.addEventListener('click', e => { if (!dropdown.contains(e.target) && !profile.contains(e.target)) dropdown.classList.remove('active'); });
    }

    document.querySelectorAll('[data-upgrade]').forEach(b => b.addEventListener('click', () => openUpgradeModal(b.getAttribute('data-upgrade'))));
    safeGet('confirmUpgradeBtn')?.addEventListener('click', confirmUpgrade);
    safeGet('withdrawForm')?.addEventListener('submit', submitWithdrawal);
    document.querySelectorAll('#logoutBtn, #logoutDropdown').forEach(b => b.addEventListener('click', e => { e.preventDefault(); logout(); }));

    document.querySelectorAll('[data-close-modal], .modal-overlay, .modal-close').forEach(el => {
        el.addEventListener('click', e => { if (e.target === el) el.closest('.modal')?.classList.remove('active'); });
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelector('.modal.active')?.classList.remove('active'); });

    safeGet('startEarningBtn')?.addEventListener('click', () => {
        safeGet('taskWelcomeModal')?.classList.remove('active');
    });
    
    safeGet('howToStartBtn')?.addEventListener('click', () => {
        safeGet('taskWelcomeModal')?.classList.remove('active');
        showNotification('Complete daily check-in and investment quiz to earn tokens!', 'info');
    });

    safeGet('nextQuestionBtn')?.addEventListener('click', nextQuestion);
    safeGet('prevQuestionBtn')?.addEventListener('click', previousQuestion);

    const hash = () => { const h = location.hash.slice(1); if (h) navigateToPage(h); };
    hash();
    window.addEventListener('hashchange', hash);
});

// ==================== NAVIGATION FUNCTION ====================
function navigateToPage(page) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    safeGet(page)?.classList.add('active');
    
    const titles = { 
        home:'Dashboard', 
        invest:'Make Investment', 
        plans:'Investment Plans', 
        tasks:'Daily Tasks',
        analytics:'Analytics',
        transactions:'Transaction History', 
        withdraw:'Withdraw Funds', 
        settings:'Account Settings' 
    };
    safeSetText('pageTitle', titles[page] || 'Dashboard');
    
    safeGet('sidebar')?.classList.remove('active');
    safeGet('userDropdown')?.classList.remove('active');

    // Load transactions when navigating to transactions page
    if (page === 'transactions' && currentUser) {
        loadTransactions(currentUser.uid);
        const badge = document.querySelector('.transactions-badge');
        if (badge) badge.classList.remove('active');
    }
    
    if (page === 'tasks' && !userData?.hasSeenTaskWelcome) {
        setTimeout(() => {
            showTaskWelcomeModal();
            if (userData) {
                updateDoc(doc(db, 'users', currentUser.uid), { 
                    hasSeenTaskWelcome: true,
                    updatedAt: serverTimestamp() 
                });
            }
        }, 500);
    }
    
    // Scroll to top when navigating
    window.scrollTo(0, 0);
}

// ==================== GLOBAL API ====================
window.DashboardAPI = { 
    openUpgradeModal, 
    navigateToPage, 
    logout, 
    deleteActivity,
    playSound,
    addRecentActivity,
    handleDailyCheckin,
    startQuiz,
    nextQuestion,
    previousQuestion,
    updateUserLocation,
    trackUserLocation,
    dismissPromoBanner,
    showPromoBanner
};

console.log('TRUSTCORE DASHBOARD v10.2 — EMAIL VERIFICATION REMOVED & ONBOARDING BANNER ADDED');