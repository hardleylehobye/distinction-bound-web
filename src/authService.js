import { auth, db, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";
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

    // Configure Google provider
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    console.log("Authentication successful for user:", user.email);

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

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
      await setDoc(userRef, userData);
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
  } catch (err) {
    console.error("Google login error:", err);

    // Handle specific Firebase Auth errors
    if (err.code === 'auth/popup-closed-by-user') {
      alert("Authentication was cancelled. Please try again.");
    } else if (err.code === 'auth/popup-blocked') {
      alert("Popup was blocked by your browser. Please allow popups and try again.");
    } else if (err.code === 'auth/cancelled-popup-request') {
      alert("Authentication request was cancelled. Please try again.");
    } else {
      alert("Authentication failed: " + err.message);
    }

    return null;
  } finally {
    authInProgress = false;
  }
};