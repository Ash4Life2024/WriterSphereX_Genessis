"use client";
import React, { useState } from "react";
import { Configuration, OpenAIApi } from "openai";

// Use your environment variable for security
const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default function CosmicPromptExpander({ prompt }) {
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);

  const generateStory = async () => {
    if (!prompt) return;

    setLoading(true);
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a poetic narrator guiding creative storytelling." },
          { role: "user", content: `Expand the following writing prompt into a vivid story: ${prompt}` },
        ],
        max_tokens: 400,
        temperature: 0.9,
      });

      const aiStory = response.data.choices[0]?.message?.content || "No story was generated.";
      setStory(aiStory);
    } catch (error) {
      console.error("Error generating story:", error);
      setStory("⚠️ Cosmic interference... Cael suggests trying again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 text-center fade-in">
      <button
        onClick={generateStory}
        className="btn-cosmic-glow px-6 py-2 bg-gradient-to-r from-fuchsia-600 via-indigo-500 to-sky-600 text-white rounded-full shadow-md"
        disabled={loading}
      >
        🌠 Expand Prompt with AI
      </button>

      {story && (
        <div className="mt-6 p-4 bg-[#1f1f3b] text-indigo-200 rounded-xl border border-indigo-500 shadow-md text-left whitespace-pre-line">
          {story}
        </div>
      )}
    </div>
  );
}
