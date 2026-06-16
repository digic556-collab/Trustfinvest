// ==================== admin.js v7.3 ====================
// TRUSTCORE FINANCE - ADMIN PANEL (FINAL v7.3)
// RESTORED CSS | OG TAGS | PASSWORD TOGGLE

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
const ADMIN_CREDENTIALS = {
    email: 'info@trustfinvest.com',
    password: 'Beesystem1#'
};
const ADMIN_PASSWORD_MIN_LENGTH = 8;

// DOM Elements
const loginScreen = document.getElementById('adminLogin');
const dashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('adminLoginForm');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('adminLogout');

// ==================== UTILS & NOTIFICATIONS ====================
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<span>${message}</span>`;
    container.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
}

function setLoading(element, loading = true) {
  if (!element) return;
  element.disabled = loading;
  element.querySelector('.btn-text').textContent = loading ? 'Authenticating...' : 'Access Dashboard';
}

// ==================== AUTHENTICATION ====================
onAuthStateChanged(auth, (user) => {
  if (user && user.email.toLowerCase() === ADMIN_CREDENTIALS.email) {
    showDashboard();
  } else {
    showLogin();
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim().toLowerCase();
  const password = document.getElementById('adminPassword').value;

  if (email !== ADMIN_CREDENTIALS.email) {
    return showNotification("Error: Access denied. Incorrect admin email.", "error");
  }
  if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    return showNotification(`Error: Password must be at least ${ADMIN_PASSWORD_MIN_LENGTH} characters.`, "error");
  }

  setLoading(loginBtn, true);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showNotification("Login successful!", "success");
  } catch (error) {
    let msg = "Login failed. Please try again.";
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        msg = "Invalid credentials. Please check your email and password.";
    }
    showNotification(msg, "error");
  } finally {
    setLoading(loginBtn, false);
  }
});

if(logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
        showNotification("You have been logged out.", "success");
        showLogin();
    });
}

// ==================== UI HELPERS ====================
function showLogin() {
  if(loginScreen) loginScreen.style.display = 'flex';
  if(dashboard) dashboard.style.display = 'none';
}

function showDashboard() {
  if(loginScreen) loginScreen.style.display = 'none';
  if(dashboard) dashboard.style.display = 'flex';
}
