// Firebase Client SDK Configuration
// For frontend/client-side initialization

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyA4WyMCUe4LoNtx3twnwDkOqjrjPPhGB80",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "trustfin-8e4d1.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "trustfin-8e4d1",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "trustfin-8e4d1.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "747695116520",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:747695116520:web:32c2d0428f48e51eca795d",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-K0B1534NMD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Development: Enable emulators (optional)
if (process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
  console.log("[Firebase] Connecting to emulator...");
  
  // Auth Emulator
  if (!auth.emulatorConfig) {
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
  
  // Firestore Emulator
  if (!db._settingsFrozen) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
  
  // Storage Emulator
  if (!storage.host) {
    connectStorageEmulator(storage, 'localhost', 9199);
  }
}

export { app, auth, db, storage };
