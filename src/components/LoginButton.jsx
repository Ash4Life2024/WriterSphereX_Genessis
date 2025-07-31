import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your Firebase config (can be stored in lib/firebase.js too)
const firebaseConfig = {
  apiKey: "AIzaSyCYpbQjB0HSpK0y9tW5erSHs3uuYGKJGYY",
  authDomain: "sample-firebase-ai-app-6c16d.firebaseapp.com",
  projectId: "sample-firebase-ai-app-6c16d",
  appId: "1:445376235867:web:05afee7a7f4a782abcb27e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function LoginButton() {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Signed in as:", user.displayName);
    } catch (error) {
      console.error("Sign-in failed:", error);
    }
  };

  return (
    <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded">
      Sign in with Google
    </button>
  );
}
