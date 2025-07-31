"use client";
import React from "react";

export default function MoodMap({ emotions }) {
  const emotionVisuals = {
    hope: {
      color: "#FDE047",
      stars: [[20, 20], [80, 40], [60, 80]],
    },
    loss: {
      color: "#6B7280",
      stars: [[30, 30], [50, 50], [70, 30]],
    },
    power: {
      color: "#EF4444",
      stars: [[25, 60], [75, 60], [50, 30]],
    },
    love: {
      color: "#FB7185",
      stars: [[40, 20], [60, 20], [50, 60]],
    },
    fear: {
      color: "#6366F1",
      stars: [[20, 50], [50, 80], [80, 50]],
    },
  };

  const renderConstellation = (emotion, style) => {
    const path = style.stars.map(([x, y]) => `${x},${y}`).join(" ");
    return (
      <svg
        key={emotion}
        width="100"
        height="100"
        viewBox="0 0 100 100"
        className="rounded-full bg-black p-1 shadow-lg"
      >
        {style.stars.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill={style.color}
            className="animate-pulse"
          />
        ))}
        <polyline
          points={path}
          fill="none"
          stroke={style.color}
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />
      </svg>
    );
  };

  return (
    <div className="mt-10 w-full max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Your Emotional Orbit 🌌
      </h2>
      <div className="flex flex-wrap justify-center gap-4">
        {emotions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center">
            No constellation formed yet. Share your thoughts to awaken the stars.
          </p>
        ) : (
          emotions.map((emotion) =>
            renderConstellation(emotion, emotionVisuals[emotion])
          )
        )}
      </div>
    </div>
  );
}
