import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export async function getUserBadges() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore();

    if (!user) return [];

    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return data.badgeUnlocked ? [data.badgeUnlocked] : [];
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch badges:", error);
    return [];
  }
}
