"use client";
import { useState, useEffect } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import LoginButton from "../components/LoginButton";

export default function JournalPage() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
        <h1 className="text-xl mb-4">Sign in to unlock your cosmic journal 🌌</h1>
        <LoginButton />
      </main>
    );
  }

  const [genre, setGenre] = useState("Fantasy");
  const [entry, setEntry] = useState("");
  const [prompt, setPrompt] = useState("");
  const [caelResponse, setCaelResponse] = useState("");

  useEffect(() => {
    const genrePrompts = {
      Fantasy: "Describe a memory that feels magical but might not be real.",
      Drama: "Write about a moment of emotional transformation.",
      "Sci-Fi": "What part of your mind would you upgrade — and why?",
    };
    const newPrompt = genrePrompts[genre];
    setPrompt(newPrompt);

    const speakPrompt = () => {
      const utterance = new SpeechSynthesisUtterance(newPrompt);
      utterance.rate = 0.95;
      utterance.pitch = 1.2;
      utterance.volume = 0.9;
      const voices = speechSynthesis.getVoices();
      const caelVoice = voices.find(v =>
        v.name.toLowerCase().includes("male") ||
        v.name.toLowerCase().includes("en-us")
      );
      if (caelVoice) utterance.voice = caelVoice;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis) {
      speakPrompt();
    }
  }, [genre]);

  const detectEmotions = (text) => {
    const emotionKeywords = {
      hope: "lightOrbits",
      loss: "shadowNebula",
      power: "solarBurst",
      love: "twinStar",
      fear: "blackHole",
    };
    return Object.keys(emotionKeywords).filter(keyword =>
      text.toLowerCase().includes(keyword)
    );
  };

  const getCaelResponse = (emotions) => {
    if (emotions.includes("hope")) return "I sense light stirring in your story.";
    if (emotions.includes("loss")) return "You've touched the silent stars tonight.";
    if (emotions.includes("power")) return "Your mind pulses like a solar burst.";
    if (emotions.includes("love")) return "You orbit the warmth of twin stars.";
    if (emotions.includes("fear")) return "Even black holes whisper truths.";
    return "Your words drift gently through the galaxy.";
  };

  const handleSaveEntry = async () => {
    const db = getFirestore();
    if (entry.trim() !== "") {
      const emotionsDetected = detectEmotions(entry);
      const caelReply = getCaelResponse(emotionsDetected);
      setCaelResponse(caelReply);

      try {
        await setDoc(doc(db, "journalEntries", `${user.uid}_${Date.now()}`), {
          genre,
          entry,
          emotions: emotionsDetected,
          caelResponse: caelReply,
          timestamp: Date.now(),
        });

        setEntry("");

        const feedbackUtterance = new SpeechSynthesisUtterance(caelReply);
        feedbackUtterance.rate = 1;
        feedbackUtterance.pitch = 1.1;
        feedbackUtterance.volume = 0.95;
        speechSynthesis.speak(feedbackUtterance);

        alert("Journal saved to your galaxy ✨");
      } catch (error) {
        console.error("Error saving journal:", error);
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364] text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 tracking-wide">Journal Galaxy 🪐</h1>
      <p className="text-md mb-8 opacity-80 text-center max-w-xl">
        Constellation Theme: <span className="font-semibold">{genre}</span>
      </p>

      <div className="mb-4">
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="bg-gray-900 text-white p-2 rounded-lg border border-gray-600"
        >
          <option value="Fantasy">Fantasy</option>
          <option value="Drama">Drama</option>
          <option value="Sci-Fi">Sci-Fi</option>
        </select>
      </div>

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

      {caelResponse && (
        <div className="mt-2 text-sm text-indigo-300 font-light italic text-center max-w-lg">
          Cael whispers: {caelResponse}
        </div>
      )}

      <div className="text-xs text-gray-400 opacity-50 mt-4">
        Your words ripple through the orbit of your inner universe.
      </div>
    </main>
  );
}
