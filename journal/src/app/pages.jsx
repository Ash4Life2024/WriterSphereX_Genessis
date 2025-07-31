"use client";
import { useState, useEffect } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function JournalPage() {
  const [genre, setGenre] = useState("Fantasy");
  const [entry, setEntry] = useState("");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    // Genre-based prompts
    const genrePrompts = {
      Fantasy: "Describe a memory that feels magical but might not be real.",
      Drama: "Write about a moment of emotional transformation.",
      "Sci-Fi": "What part of your mind would you upgrade — and why?",
    };
    const newPrompt = genrePrompts[genre];
    setPrompt(newPrompt);

    // Voice narration using SpeechSynthesis API
    const speakPrompt = () => {
      const utterance = new SpeechSynthesisUtterance(newPrompt);
      utterance.rate = 0.95;
      utterance.pitch = 1.2;
      utterance.volume = 0.9;

      const voices = speechSynthesis.getVoices();
      const caelVoice = voices.find(v =>
        v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("en-us")
      );
      if (caelVoice) utterance.voice = caelVoice;

      speechSynthesis.cancel(); // Stop any previous speech
      speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis) {
      speakPrompt();
    }
  }, [genre]);

  const handleSaveEntry = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore();

    if (user && entry.trim() !== "") {
      try {
        await setDoc(doc(db, "journalEntries", `${user.uid}_${Date.now()}`), {
          genre,
          entry,
          timestamp: Date.now(),
        });
        setEntry("");
        alert("Journal saved to your galaxy ✨");
      } catch (error) {
        console.error("Error saving journal:", error);
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364] text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 tracking-wide">
        Journal Galaxy 🪐
      </h1>
      <p className="text-md mb-8 opacity-80 text-center max-w-xl">
        Constellation Theme: <span className="font-semibold">{genre}</span>
      </p>

      <div className="bg-black bg-opacity-30 p-6 rounded-xl shadow-xl w-full max-w-xl mb-6">
        <p className="mb-2 text-sm opacity-70">Prompt:</p>
        <p className="mb-4 italic">{prompt}</p>
        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          rows={8}
          placeholder="Begin your cosmic reflection..."
          className="w-full p-4 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSaveEntry}
          className="mt-4 px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-800 transition-colors font-semibold"
        >
          Save to Cosmos
        </button>
      </div>

      <div className="text-xs text-gray-400 opacity-50">
        Cael whispers through the stars: your thoughts matter 🌌
      </div>
    </main>
  );
}
