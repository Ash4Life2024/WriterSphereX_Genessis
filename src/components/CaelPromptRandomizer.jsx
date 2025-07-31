"use client";
import React, { useState } from "react";

// Prompt bank (same format as GenrePromptGenerator, can sync later)
const genrePrompts = {
  fantasy: [
    "A forgotten goddess awakens beneath the mountain.",
    "Your character finds a map inked in dragon blood.",
  ],
  drama: [
    "Two siblings reunite at their father's funeral — old secrets emerge.",
    "A letter arrives years too late and changes everything.",
  ],
  "sci-fi": [
    "Earth receives its first alien transmission — it’s in ancient Latin.",
    "Your protagonist wakes up in a simulation meant for someone else.",
  ],
  romance: [
    "Their first kiss was during a robbery — now they’re in love.",
    "A love letter accidentally mailed to a rival… and answered.",
  ],
  horror: [
    "Your town’s shadows have started whispering names.",
    "Every mirror shows a slightly different version of you.",
  ],
  mystery: [
    "A locked room, no windows, one cryptic note.",
    "A detective who believes in ghosts solves a case without evidence.",
  ],
};

export default function CaelPromptRandomizer({ earnedGenres }) {
  const [currentPrompt, setCurrentPrompt] = useState("");

  const getRandomPrompt = () => {
    const allPrompts = earnedGenres.flatMap((genre) => genrePrompts[genre] || []);
    const random = allPrompts[Math.floor(Math.random() * allPrompts.length)];
    setCurrentPrompt(random || "Cael is still aligning the constellations... 🌠");
  };

  return (
    <div className="mt-10 fade-in text-center">
      <button onClick={getRandomPrompt} className="btn-cosmic-glow px-6 py-2 rounded-full text-white bg-gradient-to-r from-indigo-600 via-pink-500 to-purple-600 shadow-lg">
        🔮 Reveal Cael’s Prompt
      </button>

      {currentPrompt && (
        <div className="mt-6 p-4 bg-[#1f1f3b] text-indigo-200 rounded-xl border border-indigo-500 shadow-md">
          <p className="text-sm font-mono">{currentPrompt}</p>
        </div>
      )}
    </div>
  );
}
