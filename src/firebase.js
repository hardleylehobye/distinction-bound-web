import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration (env vars override when set)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC88uWwDECNu2FVsTbGMi2iVec7-m-knpk",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "distiction-bound.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "distiction-bound",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "distiction-bound.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "820802421460",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:820802421460:web:a2671abb79745a6d5cf141",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-MBNG54B9DJ",
};

const app = initializeApp(firebaseConfig);

// Analytics disabled to avoid 403 (enable Firebase Installations API in Google Cloud if needed)
export const analytics = null;

export const auth = getAuth(app);

// Initialize Firestore with memory-only cache (no persistence)
export const db = initializeFirestore(app, {
  localCache: {
    kind: 'memory'
  }
});

// Log initialization for debugging
console.log("✓ Firestore initialized (memory-only cache)");
console.log("Project ID:", firebaseConfig.projectId);
console.log("Browser online:", navigator.onLine);

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Configure provider for better cross-device compatibility
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Add these parameters for better OAuth handling
  access_type: 'offline',
  include_granted_scopes: 'true'
});

// Force correct redirect URI for local development
if (window.location.hostname === 'localhost') {
  googleProvider.setCustomParameters({
    ...googleProvider.customParameters,
    redirect_uri: 'http://localhost:3000'
  });
}