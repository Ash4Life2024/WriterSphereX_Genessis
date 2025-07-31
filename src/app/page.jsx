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
          timestamp: Date.now(),
        });
        console.log("Genre saved:", selectedGenre);
        // Add redirect or animation trigger here
      } catch (error) {
        console.error("Error saving genre:", error);
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white font-sans px-6">
      <h1 className="text-4xl font-extrabold mb-4 animate-fade-in tracking-wide drop-shadow-lg">
        Welcome to WriterSphereX ✨
      </h1>
      <p className="text-lg mb-8 text-center max-w-md opacity-80">
        Initializing emotional orbit... Choose your genre to begin your cosmic journey.
      </p>
      <div className="flex flex-wrap gap-6 justify-center">
        {["Fantasy", "Drama", "Sci-Fi"].map((genre) => (
          <button
            key={genre}
            onClick={() => handleGenreSelect(genre)}
            className="px-6 py-3 bg-opacity-80 hover:bg-opacity-100 rounded-full font-semibold transition-all duration-300 ease-in-out text-white 
              shadow-lg 
              bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:scale-105"
          >
            {genre}
          </button>
        ))}
      </div>
      <div className="absolute bottom-4 text-xs text-gray-400 opacity-60">
        Cael is watching your constellation unfold 🌌
      </div>
    </main>
  );
}
