"use client";

import { useEffect, useState } from "react";
import BadgeGrid from "@/components/BadgeGrid";

export default function BadgeVault() {
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [view, setView] = useState("earned");

  useEffect(() => {
    // Placeholder — later integrate with Firestore
    setEarnedBadges(["fantasy", "drama", "sci-fi"]);
  }, []);

  const allBadgeKeys = [
    "fantasy", "drama", "sci-fi", "romance", "horror", "mystery"
  ];

  const inProgressBadges = allBadgeKeys.filter(
    (key) => !earnedBadges.includes(key)
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white px-6 py-12 font-cosmic">
      <h1 className="text-3xl text-center mb-6 fade-in">🌟 Your Badge Vault</h1>

      <div className="flex justify-center gap-6 mb-8 fade-in">
        <button onClick={() => setView("earned")} className={`btn-tab ${view === "earned" ? "active-tab" : ""}`}>
          Earned
        </button>
        <button onClick={() => setView("inProgress")} className={`btn-tab ${view === "inProgress" ? "active-tab" : ""}`}>
          In Progress
        </button>
      </div>

      {view === "earned" ? (
        earnedBadges.length > 0 ? (
          <BadgeGrid unlockedBadges={earnedBadges} />
        ) : (
          <p className="text-center text-gray-300">No badges earned yet. Let the stars guide you 🌠</p>
        )
      ) : (
        <BadgeGrid unlockedBadges={inProgressBadges} />
      )}

      <div className="mt-12 text-xs text-center text-indigo-300 fade-in">
        Your cosmic archive will expand as you evolve. Cael is watching 🚀
      </div>
    </main>
  );
}
