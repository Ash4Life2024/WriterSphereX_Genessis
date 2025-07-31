"use client";
import React, { useState } from "react";
import CaelPromptRandomizer from "@/components/CaelPromptRandomizer";
import CosmicPromptExpander from "@/components/CosmicPromptExpander";

export default function CaelCreativePortal({ earnedGenres = [] }) {
  const [currentPrompt, setCurrentPrompt] = useState("");

  return (
    <section className="mt-12 fade-in text-center">
      <h2 className="text-3xl text-indigo-300 mb-6">🪐 Cael's Creative Portal</h2>

      {/* Prompt Reveal */}
      <CaelPromptRandomizer
        earnedGenres={earnedGenres}
        onPrompt={(prompt) => setCurrentPrompt(prompt)}
      />

      {/* Story Expansion */}
      {currentPrompt && (
        <CosmicPromptExpander prompt={currentPrompt} />
      )}
    </section>
  );
}
