import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useEffect } from "react";

export default function WelcomePage() {
  const handleGenreSelect = async (selectedGenre) => {
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore();

    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          genre: selectedGenre,
          firstLogin: true,
          timestamp: Date.now()
        });
        console.log("Genre saved:", selectedGenre);
        // TODO: Add redirect or animation here
      } catch (error) {
        console.error("Error saving genre:", error);
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen text-white">
      <h1 className="text-3xl font-bold mb-4">Welcome to WriterSphereX ✨</h1>
      <p className="text-lg mb-8">Initializing emotional orbit... choose your genre to begin.</p>

      <div className="flex gap-4">
        <button onClick={() => handleGenreSelect("Fantasy")} className="bg-purple-600 px-4 py-2 rounded">
          Fantasy
        </button>
        <button onClick={() => handleGenreSelect("Drama")} className="bg-green-600 px-4 py-2 rounded">
          Drama
        </button>
        <button onClick={() => handleGenreSelect("Sci-Fi")} className="bg-indigo-600 px-4 py-2 rounded">
          Sci-Fi
        </button>
      </div>
    </main>
  );
}
