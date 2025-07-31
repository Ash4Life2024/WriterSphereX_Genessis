"use client";
import React from "react";

// Prompt samples by genre — can be expanded with AI-generated suggestions later
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

export default function GenrePromptGenerator({ earnedGenres }) {
  const prompts = earnedGenres.flatMap((genreKey) => genrePrompts[genreKey] || []);

  return (
    <div className="fade-in mt-10">
      <h2 className="text-2xl mb-4 text-center text-indigo-300">🧠 Creative Prompts Unlocked</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prompts.length > 0 ? (
          prompts.map((prompt, i) => (
            <div
              key={i}
              className="p-4 bg-[#2d2d4c] rounded-lg shadow-md text-sm font-mono border border-indigo-600"
            >
              {prompt}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400">Unlock badges to reveal prompts from Cael 🪐</p>
        )}
      </div>
    </div>
  );
}
