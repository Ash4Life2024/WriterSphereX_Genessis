"use client";
import React from "react";
import Image from "next/image";

// Shared style config (can be refactored to a separate badgeStyles.js later)
const badgeStyles = {
  "sci-fi": { icon: "/badges/sci-fi.svg", title: "Sci-Fi Voyager", color: "bg-indigo-600" },
  fantasy: { icon: "/badges/fantasy.svg", title: "Mystic Weaver", color: "bg-pink-500" },
  romance: { icon: "/badges/romance.svg", title: "Heart Scribe", color: "bg-rose-500" },
  horror: { icon: "/badges/horror.svg", title: "Night Whisperer", color: "bg-gray-800" },
  mystery: { icon: "/badges/mystery.svg", title: "Codebreaker", color: "bg-teal-600" },
  drama: { icon: "/badges/drama.svg", title: "Soul Weaver", color: "bg-purple-700" },
};

export default function BadgeGrid({ unlockedBadges }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {unlockedBadges.map((key) => {
        const badge = badgeStyles[key];
        if (!badge) return null;

        return (
          <div key={key} className={`p-4 rounded-xl shadow-xl text-white ${badge.color}`}>
            <div className="flex items-center gap-2">
              <Image src={badge.icon} alt={badge.title} width={36} height={36} />
              <span className="text-sm">{badge.title}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
