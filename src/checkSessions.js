import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

async function checkSessionsInDatabase() {
  try {
    const sessionsSnapshot = await getDocs(collection(db, "sessions"));
    console.log(`Found ${sessionsSnapshot.size} sessions in the database:`);
    sessionsSnapshot.forEach((doc) => {
      console.log(`${doc.id} =>`, doc.data());
    });
    if (sessionsSnapshot.empty) {
      console.log("No sessions found in the database.");
    }
  } catch (error) {
    console.error("Error checking sessions:", error);
  }
}

// Call this function to check
checkSessionsInDatabase();