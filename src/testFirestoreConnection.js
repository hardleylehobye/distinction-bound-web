// Quick Firestore connection test
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export const testFirestoreConnection = async () => {
  console.log("🔍 Testing basic Firestore connectivity...");
  console.log("━".repeat(50));
  
  try {
    // Test 1: Try to list collections (this doesn't require reading any documents)
    console.log("Test 1: Attempting to query courses collection...");
    const coursesRef = collection(db, "courses");
    const snapshot = await getDocs(coursesRef);
    console.log(`✓ Success! Found ${snapshot.size} courses`);
    
    return {
      success: true,
      message: `Firestore is online! Found ${snapshot.size} courses.`
    };
    
  } catch (error) {
    console.error("❌ Firestore connection test failed:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Detailed error analysis
    if (error.code === 'unavailable') {
      console.error("→ Firestore service is unavailable (network issue or firewall)");
    } else if (error.code === 'permission-denied') {
      console.error("→ Permission denied (check Firestore rules)");
    } else if (error.message?.includes('offline')) {
      console.error("→ Client is offline (network connectivity issue)");
    }
    
    console.log("━".repeat(50));
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// Auto-run on import in development only (skip in production builds)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  setTimeout(() => {
    testFirestoreConnection().then(result => {
      if (result.success) {
        console.log("✅", result.message);
      } else {
        console.error("🚨 FIRESTORE CONNECTION FAILED");
        console.error("This might be caused by:");
        console.error("  1. Firewall/antivirus blocking Firestore");
        console.error("  2. Network configuration issues");
        console.error("  3. Firebase project not properly configured");
        console.error("  4. Firestore rules blocking access");
      }
    }).catch(err => {
      console.error("Firestore test error:", err);
    });
  }, 2000);
}
