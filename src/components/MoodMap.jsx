"use client";
import React from "react";

export default function MoodMap({ emotions }) {
  // Define visual styles for each emotion
  const emotionStyles = {
    hope: "bg-yellow-400 animate-pulse",
    loss: "bg-gray-500 animate-fade",
    power: "bg-red-500 animate-bounce",
    love: "bg-pink-400 animate-spin",
    fear: "bg-indigo-700 animate-ping",
  };

  return (
    <div className="mt-10 w-full max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Your Emotional Orbit</h2>
      <div className="flex flex-wrap justify-center gap-4">
        {emotions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center">
            No constellation formed yet. Share your thoughts to see emotion stars!
          </p>
        ) : (
          emotions.map((emotion) => (
            <div
              key={emotion}
              className={`w-16 h-16 rounded-full ${emotionStyles[emotion]} shadow-lg flex items-center justify-center text-xs text-white`}
            >
              {emotion}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
