import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import api from './services/api';

// Prevent multiple concurrent auth attempts
let authInProgress = false;

export const signInWithGoogle = async () => {
  // Prevent multiple concurrent authentication attempts
  if (authInProgress) {
    console.log("Authentication already in progress");
    return null;
  }

  authInProgress = true;

  try {
    // Configure Google provider for better cross-device compatibility
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'offline',
      include_granted_scopes: 'true'
    });

    // Try popup first (better UX)
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("✓ Authentication successful:", user.email);
      return await processUser(user);
    } catch (popupError) {
      console.warn("Popup authentication failed, trying redirect method:", popupError.code);
      
      // Fallback to redirect method for mobile devices and blocked popups
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request' ||
          popupError.code === 'auth/unauthorized-domain' ||
          popupError.message?.includes('Cross-Origin-Opener-Policy')) {
        
        // Show user-friendly message
        if (popupError.code === 'auth/popup-blocked' || popupError.message?.includes('Cross-Origin-Opener-Policy')) {
          alert("Popup was blocked by browser security. Redirecting to Google for authentication...");
        } else if (popupError.code === 'auth/unauthorized-domain') {
          alert("This domain is not authorized for Google authentication. Please contact support.");
          return null;
        }
        
        // Use redirect method
        await signInWithRedirect(auth, googleProvider);
        return null; // Will be handled by redirect result
      }
      
      throw popupError;
    }
  } catch (err) {
    console.error("Google login error:", err);

    // Handle specific Firebase Auth errors
    if (err.code === 'auth/popup-closed-by-user') {
      alert("Authentication was cancelled. Please try again.");
    } else if (err.code === 'auth/popup-blocked') {
      alert("Popup was blocked by your browser. Redirecting to Google for authentication...");
      // Try redirect method as fallback
      await signInWithRedirect(auth, googleProvider);
      return null;
    } else if (err.code === 'auth/cancelled-popup-request') {
      alert("Authentication request was cancelled. Please try again.");
    } else if (err.code === 'auth/unauthorized-domain') {
      alert("This domain is not authorized for Google authentication. Please contact support.");
    } else if (err.code === 'auth/invalid-api-key') {
      alert("Authentication configuration error. Please contact support.");
    } else {
      alert("Authentication failed: " + err.message);
    }

    return null;
  } finally {
    authInProgress = false;
  }
};

// Handle redirect result (for mobile devices)
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    
    if (result && result.user) {
      console.log("✓ Redirect authentication successful:", result.user.email);
      const userData = await processUser(result.user);
      return userData;
    }
    
    return null;
  } catch (err) {
    // Only log unexpected errors
    if (err.code && !['auth/no-authenticated-user', 'auth/redirect-cancelled-by-user', 'auth/redirect-pending'].includes(err.code)) {
      if (!(err.message && err.message.includes('Cannot read properties of null'))) {
        console.error("Redirect error:", err.code || err.message);
      }
    }
    
    return null;
  }
};

// Process user data (shared between popup and redirect)
const processUser = async (user) => {
  try {
    console.log("Processing user data for:", user.email);
    console.log("📡 Fetching user data from backend API...");
    
    // Call backend API
    const userData = await api.login(user.uid, user.email, user.displayName);
    
    console.log("✓ User data received from API:", userData.role);

    // userData is already set above (hardcoded or default)

    // Blocked check
    if (userData.blocked) {
      alert("Your account has been blocked. Contact admin.");
      return null;
    }

    // Make sure uid is included in returned data
    const returnData = {
      uid: user.uid,
      ...userData
    };

    // Cache user role for offline fallback
    localStorage.setItem(`user_role_${user.uid}`, returnData.role);
    
    return returnData;
  } catch (error) {
    console.error("❌ Error processing user data:", error.message);
    
    // If Firestore is completely offline, return basic user data with cached role
    if (error.message.includes('client is offline') || error.message.includes('offline') || error.message.includes('Failed to get document')) {
      console.warn("⚠️ Firestore is offline - attempting to use cached role");
      
      // Try to get role from localStorage
      let actualRole = localStorage.getItem(`user_role_${user.uid}`);
      
      // Check from previous session data
      if (!actualRole) {
        const cachedUser = localStorage.getItem('distinctionBoundUser');
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            if (userData.uid === user.uid && userData.role) {
              actualRole = userData.role;
              console.log(`✓ Found cached role from previous session: ${actualRole}`);
            }
          } catch (e) {
            console.error("Error parsing cached user data:", e);
          }
        }
      } else {
        console.log(`✓ Found cached role: ${actualRole}`);
      }
      
      // Default to student if no cached role found
      if (!actualRole) {
        actualRole = 'student';
        console.warn("⚠️ No cached role found - defaulting to 'student'. Your actual role will be loaded when Firestore reconnects.");
      }
      
      console.log(`✓ Offline mode: ${user.email} (${actualRole})`);
      
      return {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        role: actualRole,
        blocked: false,
        offlineMode: true
      };
    }
    
    throw error;
  }
};