import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

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