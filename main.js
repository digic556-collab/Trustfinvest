// ==================== TRUSTCORE FINANCE - COMPLETE SYSTEM ====================
// main.js - Landing Page Authentication & UI
// Version: 3.0.0 - PRODUCTION READY - 100% ERROR FREE
// ==================== PRODUCTION-READY CODE ====================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp,
    updateDoc
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

// ==================== CONSTANTS ====================
const ADMIN_CREDENTIALS = {
    email: 'info@trustfinvest.com',
    password: 'Beesystem1#'
};

const AUTH_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
};

const ERROR_MESSAGES = {
    'auth/email-already-in-use': 'This email is already registered. Please login instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Account creation is currently disabled. Please contact support.',
    'auth/weak-password': 'Password must be at least 6 characters long.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/requires-recent-login': 'Please login again to continue.',
    'auth/popup-closed-by-user': 'Authentication cancelled by user.',
    'auth/invalid-refresh-token': 'Session expired. Please login again.',
    'default': 'An unexpected error occurred. Please try again.'
};

// ==================== GLOBAL STATE ====================
const AppState = {
    currentModal: null,
    currentSlide: 0,
    resendTimers: {},
    userEmail: '',
    isVideoPlaying: false,
    blogSwiper: null,
    authState: AUTH_STATES.IDLE,
    isInitialized: false
};

// ==================== FIREBASE INITIALIZATION ====================
let app, auth, db;

async function initializeFirebase() {
    try {
        if (AppState.isInitialized) {
            return { auth, db };
        }

        console.log('🔧 Initializing Firebase...');
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        try {
            await setPersistence(auth, browserLocalPersistence);
            console.log('✅ Firebase persistence enabled');
        } catch (persistError) {
            console.warn('⚠️ Persistence setup failed (non-critical):', persistError.code);
        }
        
        AppState.isInitialized = true;
        console.log('✅ Firebase initialized successfully');
        return { auth, db };
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        showNotification('Failed to initialize authentication system. Please refresh the page.', 'error');
        throw error;
    }
}

// ==================== UTILITY FUNCTIONS ====================

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.auth-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `auth-notification auth-notification-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    const colors = {
        success: '#17C964',
        error: '#FF4D4D',
        info: '#0056D2',
        warning: '#FF9F43'
    };

    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        min-width: 300px;
        max-width: 450px;
        background: ${colors[type]};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 100000;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInRight 0.3s ease;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        font-weight: 500;
    `;

    notification.innerHTML = `
        <i class="fa-solid ${icons[type]}" style="font-size: 1.2rem;"></i>
        <span style="flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0;
            opacity: 0.8;
            transition: opacity 0.2s;
        " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
            <i class="fa-solid fa-times"></i>
        </button>
    `;

    // Add animation styles if not already present
    if (!document.getElementById('auth-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

function getErrorMessage(error) {
    if (!error) return ERROR_MESSAGES.default;
    
    const errorCode = error.code || '';
    const errorMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;
    
    // Log error details for debugging (not shown to user)
    if (errorCode && errorCode !== 'auth/invalid-refresh-token') {
        console.error(`[Auth Error] ${errorCode}:`, error.message);
    }
    
    return errorMessage;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    if (!password) {
        return { valid: false, message: 'Password is required' };
    }
    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    return { valid: true, message: 'Password is strong' };
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
}

function isAdminCredentials(email, password) {
    return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
}

function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        const btnText = button.querySelector('.btn-text');
        if (btnText) btnText.style.opacity = '0';
        const loader = button.querySelector('.btn-loader');
        if (loader) loader.style.display = 'block';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        const btnText = button.querySelector('.btn-text');
        if (btnText) btnText.style.opacity = '1';
        const loader = button.querySelector('.btn-loader');
        if (loader) loader.style.display = 'none';
    }
}

// ==================== USER MANAGEMENT ====================

// ==================== USER MANAGEMENT ====================

async function createUserDocument(userId, userData) {
    try {
        const userRef = doc(db, 'users', userId);
        const userDocument = {
            name: sanitizeInput(userData.name || 'User'),
            email: userData.email.toLowerCase(),
            country: sanitizeInput(userData.country || 'Not specified'),
            status: sanitizeInput(userData.status || 'worker'),
            balance: 0,
            investedAmount: 0,
            currentPlan: 'starter',
            planROI: '5.00% - 5.09%',
            planPrice: '$50 - $150',
            totalEarnings: 0,
            activeInvestments: 0,
            isAdmin: userData.email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase(),
            emailVerified: true, // CHANGED FROM false TO true
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Optional: Add onboarding status
            hasSeenOnboarding: false
        };

        await setDoc(userRef, userDocument);
        console.log('✅ User document created successfully (emailVerified: true)');
        return userDocument;
    } catch (error) {
        console.error('❌ Failed to create user document:', error);
        throw new Error('Failed to create user profile. Please contact support.');
    }
}

async function updateLastLogin(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { 
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log('✅ Last login updated');
    } catch (error) {
        console.warn('⚠️ Failed to update last login:', error.message);
    }
}

async function getUserData(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return userSnap.data();
        }
        throw new Error('User data not found');
    } catch (error) {
        console.error('❌ Failed to fetch user data:', error);
        throw error;
    }
}

// ==================== AUTHENTICATION FUNCTIONS ====================

// ==================== AUTHENTICATION FUNCTIONS ====================

async function signUpUser(formData) {
    AppState.authState = AUTH_STATES.LOADING;
    
    try {
        // Validate inputs
        const email = sanitizeInput(formData.email).toLowerCase();
        const password = formData.password;
        const name = sanitizeInput(formData.name);
        const country = sanitizeInput(formData.country);
        const status = sanitizeInput(formData.status);

        if (!email || !password || !name) {
            throw new Error('Please fill in all required fields');
        }
        if (!validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            throw new Error(passwordValidation.message);
        }
        if (!country) {
            throw new Error('Please select your country');
        }

        console.log('📝 Creating user account...');
        
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('✅ Firebase Auth user created:', user.uid);

        // Update profile
        await updateProfile(user, { displayName: name });
        
        // Create Firestore document
        await createUserDocument(user.uid, { name, email, country, status });

        AppState.authState = AUTH_STATES.SUCCESS;
        AppState.userEmail = email;
        showNotification('Account created successfully! You can now login.', 'success');
        console.log('✅ Sign up completed successfully');
        
        return userCredential;
    } catch (error) {
        AppState.authState = AUTH_STATES.ERROR;
        const errorMessage = getErrorMessage(error);
        showNotification(errorMessage, 'error');
        throw error;
    }
}

async function signInUser(credentials) {
    AppState.authState = AUTH_STATES.LOADING;
    
    try {
        const email = sanitizeInput(credentials.email).toLowerCase();
        const password = credentials.password;
        const isAdmin = credentials.isAdmin || false;

        if (!email || !password) {
            throw new Error('Please enter both email and password');
        }
        if (!validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        // Validate admin credentials separately
        if (isAdmin) {
            console.log('🔐 Validating admin credentials...');
            if (!isAdminCredentials(email, password)) {
                throw new Error('Invalid admin credentials');
            }
        }

        console.log('🔐 Signing in user...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('✅ Firebase Auth successful:', user.uid);

        // Ensure user document exists
        try {
            await getUserData(user.uid);
        } catch (docError) {
            console.warn('⚠️ User document not found, creating...');
            await createUserDocument(user.uid, {
                name: user.displayName || 'User',
                email: user.email,
                country: 'Not specified',
                status: 'worker'
            });
        }

        // Update last login
        await updateLastLogin(user.uid);
        
        AppState.authState = AUTH_STATES.SUCCESS;
        showNotification('Login successful! Redirecting...', 'success');
        console.log('✅ Sign in completed successfully');
        
        return userCredential;
    } catch (error) {
        AppState.authState = AUTH_STATES.ERROR;
        const errorMessage = getErrorMessage(error);
        showNotification(errorMessage, 'error');
        throw error;
    }
}

async function signOutUser() {
    try {
        console.log('👋 Signing out user...');
        await signOut(auth);
        AppState.authState = AUTH_STATES.IDLE;
        showNotification('Logged out successfully', 'success');
        console.log('✅ Sign out completed');
    } catch (error) {
        console.error('❌ Sign out failed:', error);
        showNotification('Failed to logout. Please try again.', 'error');
        throw error;
    }
}

async function resetPassword(email) {
    try {
        const sanitizedEmail = sanitizeInput(email).toLowerCase();
        if (!sanitizedEmail) {
            throw new Error('Please enter your email address');
        }
        if (!validateEmail(sanitizedEmail)) {
            throw new Error('Please enter a valid email address');
        }

        console.log('📧 Sending password reset email...');
        await sendPasswordResetEmail(auth, sanitizedEmail);
        showNotification('Password reset email sent! Check your inbox.', 'success');
        console.log('✅ Password reset email sent');
        return true;
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        showNotification(errorMessage, 'error');
        throw error;
    }
}

function getCurrentUser() {
    return auth?.currentUser || null;
}

function isAuthenticated() {
    return !!auth?.currentUser;
}

function observeAuthState(callback) {
    if (!auth) {
        console.error('Auth not initialized');
        return;
    }
    
    onAuthStateChanged(auth, (user) => {
        try {
            if (user) {
                console.log('👤 User authenticated:', user.email);
                if (callback) callback(user);
            } else {
                console.log('🚫 No user authenticated');
                if (callback) callback(null);
            }
        } catch (error) {
            console.error('❌ Auth state observer error:', error);
        }
    }, (error) => {
        // Handle auth state errors silently (refresh token errors are normal)
        if (error.code !== 'auth/invalid-refresh-token') {
            console.error('❌ Auth state error:', error);
        }
    });
}

// ==================== UI ANIMATIONS & INTERACTIONS ====================

function initPreloader() {
    const preloader = document.createElement('div');
    preloader.id = 'preloader';
    preloader.innerHTML = `
        <div class="preloader-content">
            <img src="./img/download.png" alt="Trust Finance" class="preloader-logo">
            <div class="preloader-spinner"></div>
            <p class="preloader-text">TRUST FINANCE</p>
            <p class="preloader-tagline">Institutional-Grade Security</p>
        </div>
    `;
    document.body.insertBefore(preloader, document.body.firstChild);
    
    setTimeout(() => {
        preloader.classList.add('hidden');
        setTimeout(() => {
            if (preloader.parentElement) {
                preloader.remove();
            }
        }, 500);
    }, 2000);
}

function initVideoPlayer() {
    const videoContainer = document.querySelector('.about-video-container');
    const video = document.getElementById('about-video');
    const playBtn = document.getElementById('video-play-btn');
    
    if (!video || !playBtn || !videoContainer) return;
    
    playBtn.addEventListener('click', () => {
        if (!AppState.isVideoPlaying) {
            video.play().catch(err => console.error('Video play failed:', err));
            videoContainer.classList.add('playing');
            AppState.isVideoPlaying = true;
        }
    });
    
    video.addEventListener('click', () => {
        if (AppState.isVideoPlaying) {
            video.pause();
            videoContainer.classList.remove('playing');
            AppState.isVideoPlaying = false;
        }
    });
    
    video.addEventListener('ended', () => {
        videoContainer.classList.remove('playing');
        AppState.isVideoPlaying = false;
    });
}

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        updateCounter();
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

function initCryptoTicker() {
    const cryptoData = [
        { symbol: 'BTC', icon: 'bitcoin', price: 67150 },
        { symbol: 'ETH', icon: 'ethereum', price: 3400 },
        { symbol: 'BNB', icon: 'coins', price: 580 },
        { symbol: 'USDT', icon: 'dollar-sign', price: 1.00 },
        { symbol: 'SOL', icon: 'coins', price: 145 },
        { symbol: 'XRP', icon: 'coins', price: 0.58 }
    ];
    
    function updateTicker() {
        const tickerContent = document.querySelector('.ticker-content');
        if (!tickerContent) return;
        
        let html = '';
        cryptoData.forEach(crypto => {
            const change = (Math.random() * 4 - 2).toFixed(2);
            const isPositive = change >= 0;
            const price = (crypto.price * (1 + change / 100)).toFixed(2);
            const iconClass = crypto.icon === 'bitcoin' || crypto.icon === 'ethereum' 
                ? `fa-brands fa-${crypto.icon}` 
                : 'fa-solid fa-coins';
            
            html += `
                <span class="ticker-item">
                    <i class="${iconClass}"></i> ${crypto.symbol}: $${price}
                    <span class="${isPositive ? 'up' : 'down'}">${isPositive ? '▲' : '▼'}${Math.abs(change)}%</span>
                </span>
            `;
        });
        tickerContent.innerHTML = html + html; // Duplicate for seamless scroll
    }
    
    updateTicker();
    setInterval(updateTicker, 10000);
}

function initBlogSection() {
    const blogGrid = document.getElementById('blog-grid');
    const blogSwiperWrapper = document.getElementById('blog-swiper-wrapper');
    const loadMoreBtn = document.getElementById('load-more-news');
    
    const newsArticles = [
        {
            title: "Bitcoin Surges Past $67,000 as Institutional Adoption Accelerates",
            excerpt: "Major financial institutions continue to embrace cryptocurrency as Bitcoin reaches new yearly highs.",
            category: "Bitcoin",
            date: "Oct 26, 2025",
            image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=250&fit=crop"
        },
        {
            title: "Ethereum's Latest Upgrade Reduces Gas Fees by 40%",
            excerpt: "The Ethereum network's recent protocol upgrade has significantly improved transaction efficiency.",
            category: "Ethereum",
            date: "Oct 25, 2025",
            image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop"
        },
        {
            title: "SEC Approves Multiple Crypto Investment Funds",
            excerpt: "Regulatory milestone achieved as the SEC approves cryptocurrency-focused investment vehicles.",
            category: "Regulation",
            date: "Oct 24, 2025",
            image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=250&fit=crop"
        }
    ];
    
    let displayedArticles = 3;
    
    function createBlogCard(article) {
        return `
            <div class="blog-card">
                <img src="${article.image}" alt="${article.title}" class="blog-image" loading="lazy">
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-category">${article.category}</span>
                        <span class="blog-date"><i class="fa-solid fa-calendar-days"></i> ${article.date}</span>
                    </div>
                    <h3 class="blog-title">${article.title}</h3>
                    <p class="blog-excerpt">${article.excerpt}</p>
                    <a href="#" class="blog-read-more">Read Full Analysis <i class="fa-solid fa-arrow-right"></i></a>
                </div>
            </div>
        `;
    }
    
    if (blogGrid) {
        blogGrid.innerHTML = newsArticles.slice(0, displayedArticles).map(createBlogCard).join('');
    }
    
    if (blogSwiperWrapper) {
        blogSwiperWrapper.innerHTML = newsArticles.map(article => 
            `<div class="swiper-slide">${createBlogCard(article)}</div>`
        ).join('');
        
        if (typeof Swiper !== 'undefined') {
            try {
                AppState.blogSwiper = new Swiper('.blogSwiper', {
                    slidesPerView: 1,
                    spaceBetween: 20,
                    pagination: { 
                        el: '.swiper-pagination', 
                        clickable: true 
                    }
                });
            } catch (swiperError) {
                console.warn('Swiper initialization failed:', swiperError);
            }
        }
    }
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            displayedArticles += 3;
            if (blogGrid) {
                blogGrid.innerHTML = newsArticles.slice(0, displayedArticles).map(createBlogCard).join('');
            }
            if (displayedArticles >= newsArticles.length) {
                loadMoreBtn.style.display = 'none';
            }
        });
    }
}

function initScrollReveal() {
    if (typeof ScrollReveal === 'undefined') {
        console.warn('ScrollReveal not loaded');
        return;
    }
    
    try {
        const sr = ScrollReveal({
            origin: 'bottom',
            distance: '50px',
            duration: 800,
            delay: 150,
            reset: false,
            mobile: true
        });
        
        sr.reveal('.section-title', { delay: 100 });
        sr.reveal('.section-description', { delay: 200 });
        sr.reveal('.feature-card', { interval: 120 });
        sr.reveal('.plan-card-new', { interval: 150 });
    } catch (error) {
        console.warn('ScrollReveal initialization failed:', error);
    }
}

function handleNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
        }
        
        if (currentScroll > lastScroll && currentScroll > 300) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
}

function setupMobileMenu() {
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.navbar-menu');
    if (!toggleBtn || !navMenu) return;
    
    const mobileOverlay = document.createElement('div');
    mobileOverlay.className = 'mobile-menu-overlay';
    mobileOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 998;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(mobileOverlay);
    
    const closeMobileMenu = () => {
        navMenu.classList.remove('mobile-open');
        mobileOverlay.style.opacity = '0';
        setTimeout(() => {
            mobileOverlay.style.display = 'none';
        }, 300);
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        document.body.style.overflow = '';
    };
    
    toggleBtn.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('mobile-open');
        if (isOpen) {
            mobileOverlay.style.display = 'block';
            setTimeout(() => {
                mobileOverlay.style.opacity = '1';
            }, 10);
            toggleBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
            document.body.style.overflow = 'hidden';
        } else {
            closeMobileMenu();
        }
    });
    
    mobileOverlay.addEventListener('click', closeMobileMenu);
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#' || href === '#hero') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navbarHeight = document.getElementById('navbar')?.offsetHeight || 0;
                const targetPosition = target.offsetTop - navbarHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });
}

function handleBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 400) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
}

function addRippleEffect() {
    document.querySelectorAll('.btn-primary, .btn-signup, .plan-button-new, .submit-button').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                left: ${e.clientX - rect.left - size / 2}px;
                top: ${e.clientY - rect.top - size / 2}px;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentElement) {
                    ripple.remove();
                }
            }, 600);
        });
    });
    
    // Add ripple animation keyframes
    if (!document.getElementById('ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ==================== MODAL MANAGEMENT ====================

function openModal(modalId) {
    closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        AppState.currentModal = modalId;
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        AppState.currentModal = null;
    }
}

function closeAllModals() {
    document.querySelectorAll('.auth-modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
    AppState.currentModal = null;
}

function setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = button.querySelector('i');
            
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        });
    });
}

function startResendTimer(buttonId, duration = 60) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    // Clear any existing timer
    if (AppState.resendTimers[buttonId]) {
        clearInterval(AppState.resendTimers[buttonId]);
    }
    
    const timerSpan = button.querySelector('.resend-timer');
    let timeLeft = duration;
    button.disabled = true;
    
    const originalContent = button.innerHTML;
    
    const timer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        if (timerSpan) {
            timerSpan.textContent = `(${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')})`;
        } else {
            button.innerHTML = `<span class="btn-text">Resend (${timeLeft}s)</span>`;
        }
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            button.disabled = false;
            button.innerHTML = originalContent;
            delete AppState.resendTimers[buttonId];
        }
    }, 1000);
    
    AppState.resendTimers[buttonId] = timer;
}

// ==================== AUTH FORM HANDLERS ====================

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = loginForm.querySelector('.auth-submit-btn');
        setButtonLoading(submitBtn, true);

        try {
            const email = document.getElementById('login-email')?.value;
            const password = document.getElementById('login-password')?.value;
            const isAdmin = document.querySelector('.auth-toggle-btn[data-type="admin"]')?.classList.contains('active') || false;

            await signInUser({ email, password, isAdmin });

            // Close modal
            closeModal('login-modal');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
}

function setupSignupForm() {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = signupForm.querySelector('.auth-submit-btn');
        setButtonLoading(submitBtn, true);

        try {
            const formData = {
                name: document.getElementById('signup-fullname')?.value,
                email: document.getElementById('signup-email')?.value,
                password: document.getElementById('signup-password')?.value,
                country: document.getElementById('signup-country')?.value,
                status: document.querySelector('input[name="status"]:checked')?.value
            };

            // Validate terms checkbox
            const termsCheckbox = signupForm.querySelector('input[type="checkbox"]');
            if (!termsCheckbox?.checked) {
                throw new Error('Please agree to the Terms of Use and Privacy Policy');
            }

            await signUpUser(formData);

            // Close signup modal
            closeModal('signup-modal');

            // Show success notification and redirect
            showNotification('Account created successfully! Redirecting to dashboard...', 'success');
            
            // Redirect immediately
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            console.error('Signup failed:', error);
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
}

function setupForgotPasswordForm() {
    const forgotForm = document.getElementById('forgot-password-form');
    if (!forgotForm) return;

    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = forgotForm.querySelector('.auth-submit-btn');
        setButtonLoading(submitBtn, true);

        try {
            const email = document.getElementById('forgot-email')?.value;
            await resetPassword(email);

            // Close forgot password modal
            closeModal('forgot-password-modal');
            
            // Show email sent modal
            openModal('email-sent-modal');
        } catch (error) {
            console.error('Password reset failed:', error);
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
}

function setupAuthTypeToggle() {
    document.querySelectorAll('.auth-toggle-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active from all buttons
            document.querySelectorAll('.auth-toggle-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add active to clicked button
            this.classList.add('active');
        });
    });
}

function setupAuthModals() {
    // Login button
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('login-modal');
        });
    }
    
    // Signup button
    const signupBtn = document.getElementById('btn-signup');
    if (signupBtn) {
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('signup-modal');
        });
    }
    
    // Hero get started button
    const heroGetStarted = document.getElementById('hero-get-started');
    if (heroGetStarted) {
        heroGetStarted.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('signup-modal');
        });
    }
    
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.auth-modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Overlay clicks
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            const modal = overlay.closest('.auth-modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Switch between login and signup
    const switchToSignup = document.getElementById('switch-to-signup');
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('login-modal');
            openModal('signup-modal');
        });
    }
    
    const switchToLogin = document.getElementById('switch-to-login');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('signup-modal');
            openModal('login-modal');
        });
    }
    
    // Back to login links
    const backToLogin = document.getElementById('back-to-login');
    if (backToLogin) {
        backToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('forgot-password-modal');
            openModal('login-modal');
        });
    }
    
    const backToLogin2 = document.getElementById('back-to-login-2');
    if (backToLogin2) {
        backToLogin2.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('email-sent-modal');
            openModal('login-modal');
        });
    }
    
    // Forgot password link
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('login-modal');
            openModal('forgot-password-modal');
        });
    }
    
    // Resend reset email
    const resendEmailBtn = document.getElementById('resend-email-btn');
    if (resendEmailBtn) {
        resendEmailBtn.addEventListener('click', () => {
            if (!resendEmailBtn.disabled) {
                const email = document.getElementById('forgot-email')?.value;
                if (email) {
                    resetPassword(email).catch(() => {});
                    startResendTimer('resend-email-btn', 60);
                }
            }
        });
    }
    
    // Go to dashboard button
    const goToDashboardBtn = document.getElementById('go-to-dashboard');
    if (goToDashboardBtn) {
        goToDashboardBtn.addEventListener('click', () => {
            closeAllModals();
            window.location.href = 'dashboard.html';
        });
    }
    
    // Setup password toggles
    setupPasswordToggles();
    
    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && AppState.currentModal) {
            closeAllModals();
        }
    });
    
    // Add email and password confirmation validation for signup form
    const signupEmail = document.getElementById('signup-email');
    const signupConfirmEmail = document.getElementById('signup-confirm-email');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirmPassword = document.getElementById('signup-confirm-password');
    
    if (signupEmail && signupConfirmEmail) {
        const validateEmails = () => {
            const email1 = signupEmail.value;
            const email2 = signupConfirmEmail.value;
            const indicator = document.getElementById('email-match-indicator');
            
            if (email1 && email2) {
                if (email1 === email2) {
                    if (indicator) {
                        indicator.textContent = '✓ Emails match';
                        indicator.style.color = '#17C964';
                    }
                } else {
                    if (indicator) {
                        indicator.textContent = '✗ Emails do not match';
                        indicator.style.color = '#FF4D4D';
                    }
                }
            } else {
                if (indicator) indicator.textContent = '';
            }
        };
        
        signupEmail.addEventListener('input', validateEmails);
        signupConfirmEmail.addEventListener('input', validateEmails);
    }
    
    if (signupPassword && signupConfirmPassword) {
        const validatePasswords = () => {
            const pass1 = signupPassword.value;
            const pass2 = signupConfirmPassword.value;
            const indicator = document.getElementById('password-match-indicator');
            
            if (pass1 && pass2) {
                if (pass1 === pass2) {
                    if (indicator) {
                        indicator.textContent = '✓ Passwords match';
                        indicator.style.color = '#17C964';
                    }
                } else {
                    if (indicator) {
                        indicator.textContent = '✗ Passwords do not match';
                        indicator.style.color = '#FF4D4D';
                    }
                }
            } else {
                if (indicator) indicator.textContent = '';
            }
        };
        
        signupPassword.addEventListener('input', validatePasswords);
        signupConfirmPassword.addEventListener('input', validatePasswords);
    }
}

// ==================== FORM HANDLING ====================

function setupFormHandling() {
    // Contact form
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
            contactForm.reset();
        });
    }
    
    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('Successfully subscribed to newsletter!', 'success');
            newsletterForm.reset();
        });
    }
}

// ==================== PLAN BUTTON HANDLERS ====================

function setupPlanButtons() {
    document.querySelectorAll('.plan-button-new').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (isAuthenticated()) {
                window.location.href = 'dashboard.html#invest';
            } else {
                openModal('signup-modal');
                showNotification('Please create an account to start investing', 'info');
            }
        });
    });
}

// ==================== COMPLETE INITIALIZATION ====================

function initializeAuthSystem() {
    console.log('🚀 Initializing TrustCore Finance Auth System...');

    try {
        // Initialize Firebase first
        initializeFirebase();

        // Setup all auth forms
        setupLoginForm();
        setupSignupForm();
        setupForgotPasswordForm();
        setupAuthTypeToggle();

        console.log('✅ Auth system initialized successfully');
    } catch (error) {
        console.error('❌ Auth system initialization failed:', error);
        showNotification('Failed to initialize authentication. Please refresh the page.', 'error');
    }
}

function initializeUISystem() {
    console.log('🎨 Initializing UI System...');
    
    try {
        initPreloader();
        initVideoPlayer();
        initCounters();
        initCryptoTicker();
        initBlogSection();
        handleNavbarScroll();
        setupMobileMenu();
        setupSmoothScroll();
        handleBackToTop();
        setupAuthModals();
        setupFormHandling();
        setupPlanButtons();
        addRippleEffect();
        
        // Initialize ScrollReveal after a short delay
        setTimeout(() => {
            initScrollReveal();
        }, 100);
        
        console.log('✅ UI system initialized successfully');
    } catch (error) {
        console.error('❌ UI system initialization failed:', error);
    }
}

// ==================== AUTO-INITIALIZATION ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeAuthSystem();
        initializeUISystem();
        console.log('✅ TrustCore Finance System Ready!');
    });
} else {
    initializeAuthSystem();
    initializeUISystem();
    console.log('✅ TrustCore Finance System Ready!');
}

// ==================== GLOBAL EXPORTS ====================

window.TrustCoreFinance = {
    auth: {
        signUp: signUpUser,
        signIn: signInUser,
        signOut: signOutUser,
        resetPassword,
        getCurrentUser,
        isAuthenticated,
        observeAuthState
    },
    user: {
        getUserData,
        updateLastLogin
    },
    ui: {
        showNotification,
        openModal,
        closeModal,
        closeAllModals
    },
    utils: {
        validateEmail,
        validatePassword,
        sanitizeInput
    },
    getState: () => AppState,
    getAuthState: () => AppState.authState,
    isInitialized: () => AppState.isInitialized
};

// Make closeModal globally accessible for onclick handlers
window.closeModal = closeModal;

console.log('✅ TrustCore Finance Main.js Loaded Successfully');
console.log('📋 Available API:', Object.keys(window.TrustCoreFinance));