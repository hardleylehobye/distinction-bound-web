import { db } from './firebase';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

export const diagnoseFirestore = async () => {
  console.log("🔍 Running Firestore Diagnostics...");
  console.log("━".repeat(50));
  
  // Check Firebase config
  console.log("1. Firebase App:", db.app.name);
  console.log("2. Project ID:", db.app.options.projectId);
  
  // Check network status
  console.log("3. Browser Online:", navigator.onLine);
  
  // Check IndexedDB
  try {
    const dbs = await indexedDB.databases();
    console.log("4. IndexedDB databases:", dbs.map(db => db.name));
  } catch (e) {
    console.log("4. IndexedDB check failed:", e.message);
  }
  
  // Try to force reconnect
  console.log("5. Attempting to reconnect...");
  try {
    await disableNetwork(db);
    console.log("   ✓ Network disabled");
    await new Promise(resolve => setTimeout(resolve, 500));
    await enableNetwork(db);
    console.log("   ✓ Network re-enabled");
    console.log("━".repeat(50));
    return true;
  } catch (error) {
    console.error("   ❌ Reconnect failed:", error.message);
    console.log("━".repeat(50));
    return false;
  }
};

export const clearFirestoreCache = async () => {
  try {
    console.log("🗑️ Clearing Firestore cache...");
    
    // Clear IndexedDB
    const dbs = await indexedDB.databases();
    const firebaseDbs = dbs.filter(db => 
      db.name.includes('firebase') || 
      db.name.includes('firestore')
    );
    
    for (const db of firebaseDbs) {
      await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(db.name);
        request.onsuccess = () => {
          console.log(`✓ Deleted ${db.name}`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }
    
    console.log("✓ Cache cleared successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to clear cache:", error.message);
    return false;
  }
};

export const forceFirestoreReconnect = async () => {
  console.log("🔄 Forcing Firestore reconnection...");
  
  try {
    // Step 1: Disable network
    await disableNetwork(db);
    console.log("Step 1/3: Network disabled");
    
    // Step 2: Clear cache
    await clearFirestoreCache();
    console.log("Step 2/3: Cache cleared");
    
    // Step 3: Re-enable network
    await enableNetwork(db);
    console.log("Step 3/3: Network re-enabled");
    
    console.log("✅ Firestore reconnected successfully!");
    alert("Firestore reconnected! Please try logging in again.");
    
    // Reload page to apply changes
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error("❌ Reconnection failed:", error.message);
    alert("Failed to reconnect. Please manually clear your browser cache:\n1. Press F12\n2. Application tab\n3. Clear storage\n4. Refresh page");
    return false;
  }
};
