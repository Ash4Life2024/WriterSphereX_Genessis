import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

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
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      // Auth state listener will automatically update `user`
    } catch (error) {
      console.error("Sign-in failed:", error);
    }
  };

  return user ? (
    <div className="text-white text-xl">
      Welcome, {user.displayName || "Writer"} 🌌
    </div>
  ) : (
    <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded">
      Sign in with Google
    </button>
  );
}

      Sign in with Google
    </button>
  );
}
