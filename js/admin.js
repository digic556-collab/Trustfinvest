// ==================== admin.js v7.1 ====================
// TRUSTCORE FINANCE - ADMIN PANEL (FINAL v7.1)
// DELETE BUTTON ON DEPOSITS & WITHDRAWALS | FULLY SECURE | REAL-TIME | NO CLOUD

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==================== CONFIG ====================
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

// ==================== CONSTANTS ====================
const ADMIN_EMAIL = "info@trustfinvest.com";
const ADMIN_PASSWORD_MIN_LENGTH = 8;

// DOM Elements
const loginScreen = document.getElementById('adminLogin');
const dashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('adminLoginForm');
const loginBtn = document.getElementById('loginBtn');
const sidebarAdminName = document.getElementById('sidebarAdminName');
const sidebarAdminEmail = document.getElementById('sidebarAdminEmail');
const topbarAdminName = document.getElementById('topbarAdminName');
const logoutBtn = document.getElementById('adminLogout');
const menuToggle = document.getElementById('menuToggle');
const sidebarClose = document.getElementById('sidebarClose');
const refreshBtn = document.getElementById('refreshBtn');
const currentTimeEl = document.getElementById('currentTime');
const lastUpdateEl = document.getElementById('lastUpdate');

// Analytics Elements
const totalInvestmentsEl = document.getElementById('totalInvestments');
const totalWithdrawalsEl = document.getElementById('totalWithdrawals');
const activeInvestmentsEl = document.getElementById('activeInvestmentsCount');
const totalEarningsPaidEl = document.getElementById('totalEarningsPaid');

// Badges
const depositsBadge = document.getElementById('depositsBadge');
const withdrawalsBadge = document.getElementById('withdrawalsBadge');

// State
let currentPage = 'dashboard';
let currentAdmin = null;
let lastSeenDepositCount = 0;
let lastSeenWithdrawalCount = 0;

// ==================== UTILS ====================
function showError(message) {
  alert(`Error: ${message}`);
  console.error(message);
}

function showSuccess(message) {
  alert(message);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';
  const now = new Date();
  const date = timestamp.toDate();
  const diff = (now - date) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function setLoading(element, loading = true) {
  if (loading) {
    element.classList.add('loading');
    element.disabled = true;
  } else {
    element.classList.remove('loading');
    element.disabled = false;
  }
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return `$${num.toFixed(2)}`;
}

// ==================== LOCATION TRACKING ====================

// Function to get user's location (to be called from user dashboard)
async function trackUserLocation(userId) {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // Get location name from coordinates
                const locationName = await getLocationName(latitude, longitude);
                
                // Save to Firestore
                try {
                    await updateDoc(doc(db, 'users', userId), {
                        lastLocation: {
                            latitude,
                            longitude,
                            address: locationName,
                            lastUpdated: serverTimestamp()
                        },
                        updatedAt: serverTimestamp()
                    });
                    resolve({ latitude, longitude, address: locationName });
                } catch (error) {
                    console.error("Location save failed:", error);
                    resolve(null);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes cache
            }
        );
    });
}

// Function to get location name from coordinates
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
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// Function to display user location in admin panel
function formatUserLocation(userData) {
    if (!userData.lastLocation) {
        return '<span class="location-unknown">Unknown</span>';
    }
    
    const location = userData.lastLocation;
    const lastUpdated = location.lastUpdated ? 
        formatRelativeTime(location.lastUpdated) : 'Unknown time';
    
    return `
        <div class="user-location">
            <div class="location-address">
                <i class="fa-solid fa-location-dot"></i>
                ${escapeHtml(location.address || 'Unknown location')}
            </div>
            <div class="location-coords">
                <small>${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}</small>
            </div>
            <div class="location-time">
                <small>Updated: ${lastUpdated}</small>
            </div>
        </div>
    `;
}

// ==================== AUTO-CREATE ADMIN ====================
async function ensureAdminUserExists(user) {
  if (!user || user.email !== ADMIN_EMAIL) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef).catch(() => null);

  if (userSnap?.exists()) return;

  try {
    await setDoc(userRef, {
      email: user.email,
      name: "Administrator",
      balance: 0,
      currentPlan: "elite",
      isAdmin: true,
      activeInvestments: 0,
      investedAmount: 0,
      totalEarnings: 0,
      lastEarningAt: null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    showSuccess("Admin account created.");
  } catch (error) {
    showError("Failed to create admin: " + error.message);
  }
}

// ==================== AUTH STATE ====================
onAuthStateChanged(auth, async (user) => {
  if (user && user.email === ADMIN_EMAIL) {
    currentAdmin = user;
    await ensureAdminUserExists(user);
    showDashboard();
    loadAllData();
    setupRealtimeListeners();
  } else {
    showLogin();
  }
});

// ==================== LOGIN ====================
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;

  if (email !== ADMIN_EMAIL) {
    showError("Access denied. Admin email required.");
    return;
  }

  if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    showError(`Password must be at least ${ADMIN_PASSWORD_MIN_LENGTH} characters.`);
    return;
  }

  setLoading(loginBtn, true);
  loginBtn.querySelector('.btn-text').textContent = 'Authenticating...';

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    let msg = "Login failed. ";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      msg += "Invalid email or password.";
    } else if (error.code === 'auth/too-many-requests') {
      msg += "Too many attempts. Try again later.";
    } else {
      msg += error.message;
    }
    showError(msg);
  } finally {
    setLoading(loginBtn, false);
    loginBtn.querySelector('.btn-text').textContent = 'Access Dashboard';
  }
});

// ==================== LOGOUT ====================
logoutBtn.addEventListener('click', async () => {
  if (confirm("Logout from admin panel?")) {
    try {
      await signOut(auth);
    } catch (error) {
      showError("Logout failed: " + error.message);
    }
  }
});

// ==================== UI HELPERS ====================
function showLogin() {
  loginScreen.style.display = 'flex';
  dashboard.style.display = 'none';
  document.body.style.overflow = 'hidden';
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display = 'flex';
  document.body.style.overflow = '';
  updateAdminInfo();
  updateClock();
}

function updateAdminInfo() {
  sidebarAdminName.textContent = "Administrator";
  sidebarAdminEmail.textContent = ADMIN_EMAIL;
  topbarAdminName.textContent = "Administrator";
}

function updateClock() {
  const now = new Date();
  currentTimeEl.textContent = now.toLocaleTimeString([], { 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  });
}
setInterval(updateClock, 1000);

// ==================== NAVIGATION ====================
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.closest('.nav-item').dataset.page;
    switchPage(page);

    if (window.innerWidth <= 767) {
      document.querySelector('.admin-sidebar').classList.remove('active');
    }
  });
});

function switchPage(page) {
  document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`#${page}`).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = getPageTitle(page);
  currentPage = page;

  const badge = document.querySelector(`[data-page="${page}"] .badge`);
  if (badge) {
    badge.textContent = '';
    if (page === 'deposits') lastSeenDepositCount = parseInt(depositsBadge.textContent) || 0;
    if (page === 'withdrawals') lastSeenWithdrawalCount = parseInt(withdrawalsBadge.textContent) || 0;
  }

  if (page === 'users') loadUsers();
  if (page === 'deposits') loadDeposits();
  if (page === 'withdrawals') loadWithdrawals();
  if (page === 'transactions') loadTransactions();
  if (page === 'analytics') loadAnalytics();
}

function getPageTitle(page) {
  const titles = {
    dashboard: 'Dashboard',
    users: 'Users Management',
    deposits: 'Deposits',
    withdrawals: 'Withdrawals',
    transactions: 'All Transactions',
    analytics: 'Analytics'
  };
  return titles[page] || 'Admin';
}

// Mobile menu
menuToggle.addEventListener('click', () => {
  document.querySelector('.admin-sidebar').classList.add('active');
});
sidebarClose.addEventListener('click', () => {
  document.querySelector('.admin-sidebar').classList.remove('active');
});

// ==================== REAL-TIME LISTENERS ====================
function setupRealtimeListeners() {
  onSnapshot(query(collection(db, 'deposits'), where('status', '==', 'pending')), (snapshot) => {
    const count = snapshot.size;
    depositsBadge.textContent = count > 0 ? count : '';
    if (currentPage !== 'deposits' && count > lastSeenDepositCount) {
      depositsBadge.style.display = 'inline';
    } else if (currentPage === 'deposits') {
      lastSeenDepositCount = count;
    }
  });

  onSnapshot(query(collection(db, 'withdrawals'), where('status', '==', 'pending')), (snapshot) => {
    const count = snapshot.size;
    withdrawalsBadge.textContent = count > 0 ? count : '';
    if (currentPage !== 'withdrawals' && count > lastSeenWithdrawalCount) {
      withdrawalsBadge.style.display = 'inline';
    } else if (currentPage === 'withdrawals') {
      lastSeenWithdrawalCount = count;
    }
  });

  updateAnalyticsRealtime();
}

function updateAnalyticsRealtime() {
  onSnapshot(query(collection(db, 'deposits'), where('status', '==', 'approved')), (snapshot) => {
    let total = 0;
    snapshot.forEach(doc => {
      total += Number(doc.data().amount) || 0;
    });
    totalInvestmentsEl.textContent = formatCurrency(total);
  });

  onSnapshot(query(collection(db, 'withdrawals'), where('status', '==', 'approved')), (snapshot) => {
    let total = 0;
    snapshot.forEach(doc => {
      total += Number(doc.data().amount) || 0;
    });
    totalWithdrawalsEl.textContent = formatCurrency(total);
  });

  onSnapshot(collection(db, 'users'), (snapshot) => {
    let active = 0;
    snapshot.forEach(doc => {
      if (!doc.data().isAdmin && (doc.data().activeInvestments || 0) > 0) active++;
    });
    activeInvestmentsEl.textContent = active;
  });

  onSnapshot(collection(db, 'transactions'), (snapshot) => {
    let total = 0;
    snapshot.forEach(doc => {
      const t = doc.data();
      if (t.type === 'earning' && t.status === 'paid') {
        total += Number(t.amount) || 0;
      }
    });
    totalEarningsPaidEl.textContent = formatCurrency(total);
  });
}

// ==================== DATA LOADING ====================
async function loadAllData() {
  try {
    await Promise.all([
      loadDashboardStats(),
      loadRecentActivity(),
      loadPlanDistribution(),
      loadAnalytics()
    ]);
    lastUpdateEl.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    showError("Failed to load data: " + error.message);
  }
}

refreshBtn.addEventListener('click', () => {
  refreshBtn.classList.add('rotating');
  loadAllData().finally(() => {
    setTimeout(() => refreshBtn.classList.remove('rotating'), 1000);
  });
});

// ==================== ANALYTICS ====================
async function loadAnalytics() {
  try {
    const [depositsSnap, withdrawalsSnap, usersSnap, transactionsSnap] = await Promise.all([
      getDocs(query(collection(db, 'deposits'), where('status', '==', 'approved'))),
      getDocs(query(collection(db, 'withdrawals'), where('status', '==', 'approved'))),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'transactions'))
    ]);

    let totalInvestments = 0;
    depositsSnap.forEach(d => totalInvestments += Number(d.data().amount) || 0);
    totalInvestmentsEl.textContent = formatCurrency(totalInvestments);

    let totalWithdrawals = 0;
    withdrawalsSnap.forEach(w => totalWithdrawals += Number(w.data().amount) || 0);
    totalWithdrawalsEl.textContent = formatCurrency(totalWithdrawals);

    let activeInvestments = 0;
    usersSnap.forEach(u => {
      if (!u.data().isAdmin && (u.data().activeInvestments || 0) > 0) activeInvestments++;
    });
    activeInvestmentsEl.textContent = activeInvestments;

    let totalEarnings = 0;
    transactionsSnap.forEach(t => {
      if (t.data().type === 'earning' && t.data().status === 'paid') {
        totalEarnings += Number(t.data().amount) || 0;
      }
    });
    totalEarningsPaidEl.textContent = formatCurrency(totalEarnings);
  } catch (error) {
    showError("Analytics failed: " + error.message);
  }
}

// ==================== DASHBOARD STATS ====================
async function loadDashboardStats() {
  try {
    const [usersSnap, depositsSnap, withdrawalsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'deposits')),
      getDocs(collection(db, 'withdrawals'))
    ]);

    let totalUsers = 0;
    let totalBalance = 0;
    let pendingDeposits = 0;
    let pendingWithdrawals = 0;

    usersSnap.forEach(doc => {
      if (!doc.data().isAdmin) {
        totalUsers++;
        totalBalance += Number(doc.data().balance) || 0;
      }
    });

    depositsSnap.forEach(doc => {
      if (doc.data().status === 'pending') pendingDeposits++;
    });

    withdrawalsSnap.forEach(doc => {
      if (doc.data().status === 'pending') pendingWithdrawals++;
    });

    document.getElementById('dashTotalUsers').textContent = totalUsers;
    document.getElementById('dashTotalBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('dashPendingDeposits').textContent = pendingDeposits;
    document.getElementById('dashPendingWithdrawals').textContent = pendingWithdrawals;
  } catch (error) {
    showError("Stats load failed: " + error.message);
  }
}

// ==================== RECENT ACTIVITY ====================
async function loadRecentActivity() {
  const container = document.getElementById('recentActivityList');
  container.innerHTML = '<div class="activity-item"><div class="activity-icon"><i class="fa-solid fa-spinner fa-spin"></i></div><div class="activity-content"><div class="activity-title">Loading...</div></div></div>';

  try {
    const [deposits, withdrawals] = await Promise.all([
      getDocs(query(collection(db, 'deposits'), orderBy('requestedAt', 'desc'), limit(5))),
      getDocs(query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc'), limit(5)))
    ]);

    const activities = [];
    deposits.forEach(d => activities.push({ ...d.data(), type: 'deposit', id: d.id }));
    withdrawals.forEach(w => activities.push({ ...w.data(), type: 'withdrawal', id: w.id }));

    activities.sort((a, b) => (b.requestedAt?.toMillis() || 0) - (a.requestedAt?.toMillis() || 0));

    const items = activities.slice(0, 5).map(a => `
      <div class="activity-item">
        <div class="activity-icon">
          <i class="fa-solid fa-${a.type === 'deposit' ? 'arrow-trend-up' : 'arrow-trend-down'}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">${escapeHtml(a.userName)} requested ${a.type}</div>
          <div class="activity-time">${formatRelativeTime(a.requestedAt)}</div>
        </div>
      </div>
    `).join('');

    container.innerHTML = items || '<div class="activity-item"><div class="activity-content"><div class="activity-title">No recent activity</div></div></div>';
  } catch (error) {
    container.innerHTML = `<div class="activity-item"><div class="activity-content"><div class="activity-title">Error: ${error.message}</div></div></div>`;
  }
}

// ==================== PLAN DISTRIBUTION ====================
async function loadPlanDistribution() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const counts = { starter: 0, pro: 0, elite: 0 };
    let total = 0;

    usersSnap.forEach(doc => {
      if (doc.data().isAdmin) return;
      const plan = doc.data().currentPlan;
      if (plan in counts) {
        counts[plan]++;
        total++;
      }
    });

    const updateBar = (plan) => {
      const percentage = total ? (counts[plan] / total * 100).toFixed(1) : 0;
      document.getElementById(`${plan}Count`).textContent = `${counts[plan]} users`;
      document.getElementById(`${plan}Bar`).style.width = `${percentage}%`;
      document.getElementById(`${plan}Percentage`).textContent = `${percentage}%`;
    };

    updateBar('starter');
    updateBar('pro');
    updateBar('elite');
  } catch (error) {
    showError("Plan stats failed: " + error.message);
  }
}

// ==================== USERS ====================
async function loadUsers(filter = 'all') {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="9"><div class="loader"></div><p>Loading users...</p></td></tr>';

  try {
    const snapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
    const rows = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.isAdmin) return;
      if (filter !== 'all' && data.currentPlan !== filter) return;

      rows.push(`
        <tr>
          <td data-label="User"><strong>${escapeHtml(data.name || 'N/A')}</strong></td>
          <td data-label="Email">${escapeHtml(data.email)}</td>
          <td data-label="Location">${formatUserLocation(data)}</td>
          <td data-label="Balance">${formatCurrency(data.balance)}</td>
          <td data-label="Plan"><span class="plan-badge ${data.currentPlan}">${data.currentPlan}</span></td>
          <td data-label="Investments">${data.activeInvestments || 0}</td>
          <td data-label="Status"><span class="status-badge ${data.status || 'active'}">${data.status || 'active'}</span></td>
          <td data-label="Joined">${formatDate(data.createdAt)}</td>
          <td data-label="Actions" class="table-actions">
            <button class="action-btn edit" onclick="openEditUser('${doc.id}')">Edit</button>
          </td>
        </tr>`);
    });

    tbody.innerHTML = rows.length ? rows.join('') : '<tr class="empty-row"><td colspan="9"><i class="fa-solid fa-users-slash"></i><p>No users found</p></td></tr>';
  } catch (error) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">Error: ${error.message}</td></tr>`;
  }
}

// ==================== DEPOSITS — WITH DELETE BUTTON ====================
async function loadDeposits(filter = 'all') {
  const tbody = document.getElementById('depositsTableBody');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="8"><div class="loader"></div><p>Loading deposits...</p></td></tr>';

  try {
    const snapshot = await getDocs(query(collection(db, 'deposits'), orderBy('requestedAt', 'desc')));
    const rows = [];

    snapshot.forEach(doc => {
      const d = doc.data();
      if (filter !== 'all' && d.status !== filter) return;

      const amount = Number(d.amount) || 0;

      rows.push(`
        <tr>
          <td data-label="User"><strong>${escapeHtml(d.userName)}</strong></td>
          <td data-label="Email">${escapeHtml(d.userEmail)}</td>
          <td data-label="Crypto"><span class="crypto-badge ${d.coinType?.toLowerCase()}">${d.coinType}</span></td>
          <td data-label="Amount"><strong>${formatCurrency(amount)}</strong></td>
          <td data-label="Plan"><span class="plan-badge ${d.plan?.toLowerCase()}">${d.plan || 'N/A'}</span></td>
          <td data-label="Status"><span class="status-badge ${d.status}">${d.status}</span></td>
          <td data-label="Date">${formatDate(d.requestedAt)}</td>
          <td data-label="Actions" class="table-actions">
            ${d.status === 'pending' ? `
              <button class="action-btn approve" onclick="approveDeposit('${doc.id}')">
                <i class="fa-solid fa-check"></i> Approve
              </button>
              <button class="action-btn reject" onclick="rejectDeposit('${doc.id}')">
                <i class="fa-solid fa-times"></i> Reject
              </button>
            ` : `
              <button class="action-btn view" onclick="viewDeposit('${doc.id}')">
                <i class="fa-solid fa-eye"></i> View
              </button>
            `}
            <button class="action-btn delete" onclick="deleteDeposit('${doc.id}')">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </td>
        </tr>`);
    });

    tbody.innerHTML = rows.length ? rows.join('') : '<tr class="empty-row"><td colspan="8"><i class="fa-solid fa-inbox"></i><p>No deposits</p></td></tr>';
  } catch (error) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Error: ${error.message}</td></tr>`;
  }
}

// ==================== DELETE DEPOSIT ====================
window.deleteDeposit = async (id) => {
  if (!confirm("Permanently delete this deposit? This cannot be undone.")) return;

  try {
    await deleteDoc(doc(db, 'deposits', id));
    showSuccess("Deposit deleted.");
    loadDeposits();
    loadDashboardStats();
  } catch (err) {
    showError("Delete failed: " + err.message);
  }
};

// ==================== WITHDRAWALS — WITH DELETE BUTTON ====================
async function loadWithdrawals(filter = 'all') {
  const tbody = document.getElementById('withdrawalsTableBody');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="8"><div class="loader"></div><p>Loading withdrawals...</p></td></tr>';

  try {
    const snapshot = await getDocs(query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc')));
    const rows = [];

    snapshot.forEach(doc => {
      const w = doc.data();
      if (filter !== 'all' && w.status !== filter) return;

      rows.push(`
        <tr>
          <td data-label="User"><strong>${escapeHtml(w.userName)}</strong></td>
          <td data-label="Email">${escapeHtml(w.userEmail)}</td>
          <td data-label="Amount">${formatCurrency(w.amount)}</td>
          <td data-label="Currency">${w.currency.toUpperCase()}</td>
          <td data-label="Wallet"><small>${w.wallet.substring(0, 10)}...${w.wallet.slice(-6)}</small></td>
          <td data-label="Status"><span class="status-badge ${w.status}">${w.status}</span></td>
          <td data-label="Date">${formatDate(w.requestedAt)}</td>
          <td data-label="Actions" class="table-actions">
            ${w.status === 'pending' ? `
              <button class="action-btn approve" onclick="approveWithdrawal('${doc.id}')">
                <i class="fa-solid fa-check"></i> Approve
              </button>
              <button class="action-btn reject" onclick="rejectWithdrawal('${doc.id}')">
                <i class="fa-solid fa-times"></i> Reject
              </button>
            ` : `
              <button class="action-btn view" onclick="viewWithdrawal('${doc.id}')">
                <i class="fa-solid fa-eye"></i> View
              </button>
            `}
            <button class="action-btn delete" onclick="deleteWithdrawal('${doc.id}')">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </td>
        </tr>`);
    });

    tbody.innerHTML = rows.length ? rows.join('') : '<tr class="empty-row"><td colspan="8"><i class="fa-solid fa-wallet"></i><p>No withdrawals</p></td></tr>';
  } catch (error) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Error: ${error.message}</td></tr>`;
  }
}

// ==================== DELETE WITHDRAWAL ====================
window.deleteWithdrawal = async (id) => {
  if (!confirm("Permanently delete this withdrawal? This cannot be undone.")) return;

  try {
    await deleteDoc(doc(db, 'withdrawals', id));
    showSuccess("Withdrawal deleted.");
    loadWithdrawals();
    loadDashboardStats();
  } catch (err) {
    showError("Delete failed: " + err.message);
  }
};

// ==================== APPROVE/REJECT DEPOSIT ====================
window.approveDeposit = async (id) => {
  if (!confirm("Approve this deposit?")) return;
  try {
    const depositSnap = await getDoc(doc(db, 'deposits', id));
    if (!depositSnap.exists()) throw new Error("Deposit not found");

    const d = depositSnap.data();
    const amount = Number(d.amount) || 0;
    const userRef = doc(db, 'users', d.userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    const batch = writeBatch(db);
    batch.update(doc(db, 'deposits', id), {
      status: 'approved',
      approvedAt: serverTimestamp(),
      processedBy: currentAdmin.email
    });
    batch.update(userRef, {
      balance: userData.balance + amount,
      activeInvestments: userData.activeInvestments + 1,
      investedAmount: (userData.investedAmount || 0) + amount,
      lastEarningAt: null,
      updatedAt: serverTimestamp()
    });
    await batch.commit();

    showSuccess(`Deposit approved! $${amount} added.`);
    loadDeposits();
    loadDashboardStats();
    loadAnalytics();
  } catch (err) {
    showError("Failed: " + err.message);
  }
};

window.rejectDeposit = async (id) => {
  if (!confirm("Reject this deposit?")) return;
  try {
    await updateDoc(doc(db, 'deposits', id), {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      processedBy: currentAdmin.email
    });
    showSuccess("Deposit rejected.");
    loadDeposits();
  } catch (err) {
    showError("Failed: " + err.message);
  }
};

// ==================== APPROVE/REJECT WITHDRAWAL ====================
window.approveWithdrawal = async (id) => {
  if (!confirm("Approve withdrawal?")) return;
  try {
    const wSnap = await getDoc(doc(db, 'withdrawals', id));
    const w = wSnap.data();
    const amount = Number(w.amount) || 0;
    const userRef = doc(db, 'users', w.userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (userData.balance < amount) {
      showError("Insufficient balance!");
      return;
    }

    const batch = writeBatch(db);
    batch.update(doc(db, 'withdrawals', id), {
      status: 'approved',
      approvedAt: serverTimestamp(),
      processedBy: currentAdmin.email
    });
    batch.update(userRef, {
      balance: userData.balance - amount,
      updatedAt: serverTimestamp()
    });
    await batch.commit();

    showSuccess(`Withdrawal approved! $${amount} sent.`);
    loadWithdrawals();
    loadDashboardStats();
    loadAnalytics();
  } catch (err) {
    showError("Failed: " + err.message);
  }
};

window.rejectWithdrawal = async (id) => {
  if (!confirm("Reject withdrawal?")) return;
  try {
    await updateDoc(doc(db, 'withdrawals', id), {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      processedBy: currentAdmin.email
    });
    showSuccess("Withdrawal rejected.");
    loadWithdrawals();
  } catch (err) {
    showError("Failed: " + err.message);
  }
};

// ==================== TRANSACTIONS ====================
async function loadTransactions(filter = 'all') {
  const tbody = document.getElementById('transactionsTableBody');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="6"><div class="loader"></div><p>Loading transactions...</p></td></tr>';

  try {
    const snapshot = await getDocs(query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(50)));
    const rows = [];

    snapshot.forEach(doc => {
      const t = doc.data();
      if (filter !== 'all' && t.type !== filter) return;

      rows.push(`
        <tr>
          <td data-label="User"><strong>${escapeHtml(t.userName)}</strong></td>
          <td data-label="Type">${t.type}</td>
          <td data-label="Amount">${formatCurrency(t.amount)}</td>
          <td data-label="Status"><span class="status-badge ${t.status}">${t.status}</span></td>
          <td data-label="Desc">${escapeHtml(t.description || 'N/A')}</td>
          <td data-label="Date">${formatDate(t.timestamp)}</td>
        </tr>`);
    });

    tbody.innerHTML = rows.length ? rows.join('') : '<tr class="empty-row"><td colspan="6"><i class="fa-solid fa-receipt"></i><p>No transactions</p></td></tr>';
  } catch (error) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Error: ${error.message}</td></tr>`;
  }
}

// ==================== FILTER SYSTEM ====================
function setupFilter(containerSelector, tableBodyId, filterKey, loadFn) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    loadFn(filter);
  });
}

setupFilter('.section-toolbar:nth-child(1)', 'usersTableBody', 'currentPlan', loadUsers);
setupFilter('.section-toolbar:nth-child(2)', 'depositsTableBody', 'status', loadDeposits);
setupFilter('.section-toolbar:nth-child(3)', 'withdrawalsTableBody', 'status', loadWithdrawals);
setupFilter('.section-toolbar:nth-child(4)', 'transactionsTableBody', 'type', loadTransactions);

// ==================== MODALS ====================
window.openEditUser = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) throw new Error("User not found");

    const data = userDoc.data();
    document.getElementById('editUserName').textContent = data.name;
    document.getElementById('editUserEmail').textContent = data.email;
    document.getElementById('editUserCurrentBalance').textContent = formatCurrency(data.balance);

    const modal = document.getElementById('editUserModal');
    modal.classList.add('active');

    const form = document.getElementById('editBalanceForm');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.onsubmit = async (e) => {
      e.preventDefault();
      const newBal = parseFloat(document.getElementById('newBalance').value);
      const action = document.getElementById('balanceAction').value;

      if (isNaN(newBal) || newBal < 0) return showError("Invalid amount");

      setLoading(submitBtn, true);

      let finalBalance = data.balance;
      if (action === 'add') finalBalance += newBal;
      else if (action === 'subtract') finalBalance = Math.max(0, finalBalance - newBal);
      else finalBalance = newBal;

      try {
        await updateDoc(doc(db, 'users', userId), { 
          balance: finalBalance, 
          updatedAt: serverTimestamp() 
        });
        showSuccess("Balance updated!");
        modal.classList.remove('active');
        loadUsers();
        loadDashboardStats();
      } catch (err) {
        showError("Update failed: " + err.message);
      } finally {
        setLoading(submitBtn, false);
      }
    };
  } catch (error) {
    showError(error.message);
  }
};

window.viewDeposit = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, 'deposits', id));
    if (!docSnap.exists()) throw new Error("Not found");

    const d = docSnap.data();
    const content = `
      <div class="info-row"><span class="info-label">User:</span><span class="info-value">${escapeHtml(d.userName)}</span></div>
      <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${escapeHtml(d.userEmail)}</span></div>
      <div class="info-row"><span class="info-label">Coin:</span><span class="info-value">${d.coinType}</span></div>
      <div class="info-row"><span class="info-label">Amount:</span><span class="info-value"><strong>${formatCurrency(d.amount)}</strong></span></div>
      <div class="info-row"><span class="info-label">Status:</span><span class="info-value"><span class="status-badge ${d.status}">${d.status}</span></span></div>
      <div class="info-row"><span class="info-label">Requested:</span><span class="info-value">${formatDate(d.requestedAt)}</span></div>
    `;

    document.getElementById('depositDetailsContent').innerHTML = content;
    document.getElementById('depositDetailsModal').classList.add('active');
  } catch (error) {
    showError(error.message);
  }
};

window.viewWithdrawal = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, 'withdrawals', id));
    if (!docSnap.exists()) throw new Error("Not found");

    const w = docSnap.data();
    const content = `
      <div class="info-row"><span class="info-label">User:</span><span class="info-value">${escapeHtml(w.userName)}</span></div>
      <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${escapeHtml(w.userEmail)}</span></div>
      <div class="info-row"><span class="info-label">Amount:</span><span class="info-value"><strong>${formatCurrency(w.amount)}</strong></span></div>
      <div class="info-row"><span class="info-label">Currency:</span><span class="info-value">${w.currency.toUpperCase()}</span></div>
      <div class="info-row"><span class="info-label">Wallet:</span><span class="info-value"><small>${w.wallet}</small></span></div>
      <div class="info-row"><span class="info-label">Status:</span><span class="info-value"><span class="status-badge ${w.status}">${w.status}</span></span></div>
    `;

    document.getElementById('withdrawalDetailsContent').innerHTML = content;
    document.getElementById('withdrawalDetailsModal').classList.add('active');
  } catch (error) {
    showError(error.message);
  }
};

document.querySelectorAll('[data-close-modal]').forEach(el => {
  el.addEventListener('click', () => {
    el.closest('.modal').classList.remove('active');
  });
});

// ==================== INIT ====================
switchPage('dashboard');