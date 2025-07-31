"use client";

import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import BadgeIcon from "@/components/BadgeIcon";

export default function Page() {
  const [selectedGenre, setSelectedGenre] = useState("");
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);

  const genreList = ["Fantasy", "Drama", "Sci-Fi", "Romance", "Horror", "Mystery"];
  const genreToKey = {
    Fantasy: "fantasy",
    Drama: "drama",
    "Sci-Fi": "sci-fi",
    Romance: "romance",
    Horror: "horror",
    Mystery: "mystery",
  };

  const handleGenreSelect = async (genre) => {
    setSelectedGenre(genre);
    setBadgeUnlocked(true);

    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore();

    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          genre,
          firstLogin: true,
          badgeUnlocked: genreToKey[genre],
          timestamp: Date.now(),
        });
        console.log("Genre and badge saved:", genre);
      } catch (error) {
        console.error("Error saving genre:", error);
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white font-cosmic px-6">
      <h1 className="heading-cosmic fade-in">Welcome to WriterSphereX ✨</h1>
      <p className="text-lg mb-8 text-center max-w-md opacity-80 fade-in">
        Initializing emotional orbit... Choose your genre to begin your cosmic journey.
      </p>

      <div className="flex flex-wrap gap-6 justify-center fade-in">
        {genreList.map((genre) => (
          <button
            key={genre}
            onClick={() => handleGenreSelect(genre)}
            className="btn-glow"
          >
            {genre}
          </button>
        ))}
      </div>

      {badgeUnlocked && (
        <div className="mt-8 fade-in">
          <p className="text-sm text-indigo-300 mb-2 text-center">
            You’ve unlocked a celestial badge:
          </p>
          <BadgeIcon genre={genreToKey[selectedGenre]} />
        </div>
      )}

      <div className="absolute bottom-4 text-xs text-gray-400 opacity-60">
        Cael is watching your constellation unfold 🌌
      </div>
    </main>
  );
}

