import { auth, db, googleProvider } from "./firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

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
    console.log("Starting Google authentication...");

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
      console.log("Popup authentication successful for user:", user.email);
      return await processUser(user);
    } catch (popupError) {
      console.log("Popup failed, trying redirect method:", popupError.message);
      
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
    console.log("Checking redirect result...");
    const result = await getRedirectResult(auth);
    
    if (result && result.user) {
      console.log("Redirect authentication successful for user:", result.user.email);
      const userData = await processUser(result.user);
      console.log("User data processed:", userData);
      return userData;
    }
    
    console.log("No redirect result found");
    return null;
  } catch (err) {
    console.error("Redirect result error:", err);
    
    // Handle specific redirect errors
    if (err.code === 'auth/no-authenticated-user') {
      console.log("No authenticated user in redirect result");
    } else if (err.code === 'auth/redirect-cancelled-by-user') {
      console.log("Redirect cancelled by user");
    } else if (err.code === 'auth/redirect-pending') {
      console.log("Redirect still pending");
    } else if (err.message && err.message.includes('Cannot read properties of null')) {
      console.log("No redirect result available (null result)");
    } else {
      console.error("Unexpected redirect error:", err.message);
    }
    
    return null;
  }
};

// Process user data (shared between popup and redirect)
const processUser = async (user) => {
  try {
    console.log("Processing user data for:", user.email);
    
    const userRef = doc(db, "users", user.uid);
    let userSnap;
    
    // Retry logic for Firestore connectivity
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Firestore attempt ${attempt} for user: ${user.uid}`);
        userSnap = await getDoc(userRef);
        console.log("Firestore connection successful on attempt", attempt);
        break;
      } catch (firestoreError) {
        console.error(`Firestore attempt ${attempt} failed:`, firestoreError.message);
        if (attempt === 3) {
          throw firestoreError;
        }
        // Faster retry for local development
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }

    let userData;

    if (userSnap.exists()) {
      // Existing user → read role
      userData = userSnap.data();
      console.log("Existing user loaded:", userData);
    } else {
      // New user → create default as student
      userData = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        role: "student",
        blocked: false,
        createdAt: serverTimestamp(),
      };
      
      // Retry for creating user document
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Creating user document attempt ${attempt}`);
          await setDoc(userRef, userData);
          console.log("New user created successfully on attempt", attempt);
          break;
        } catch (createError) {
          console.error(`Create user attempt ${attempt} failed:`, createError.message);
          if (attempt === 3) {
            throw createError;
          }
          // Faster retry for local development
          await new Promise(resolve => setTimeout(resolve, 200 * attempt)); // Reduced delay
        }
      }
      
      console.log("New user created:", userData);
    }

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

    console.log("Returning user data with role:", returnData.role);
    return returnData;
  } catch (error) {
    console.error("Error processing user data:", error);
    
    // If Firestore is completely offline, return basic user data with actual role
    if (error.message.includes('client is offline') || error.message.includes('offline')) {
      console.log("Firestore is offline, returning basic user data");
      
      // Try to get role from localStorage if available
      const cachedRole = localStorage.getItem(`user_role_${user.uid}`);
      
      // Manual override for known instructor (temporary fix)
      let actualRole = cachedRole || 'student';
      if (user.email === 'thabangth2003@gmail.com' || user.email === 'hardleylehobye@gmail.com') {
        actualRole = 'instructor';
        console.log("Manual override: Setting instructor role for", user.email);
      }
      
      return {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        role: actualRole, // Use cached, manual override, or default role
        blocked: false,
        offlineMode: true
      };
    }
    
    throw error;
  }
};