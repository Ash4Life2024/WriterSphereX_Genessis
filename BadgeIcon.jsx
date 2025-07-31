// components/BadgeIcon.jsx
import React from "react";
import Image from "next/image";

const badgeStyles = {
  "sci-fi": { icon: "/badges/sci-fi.svg", title: "Sci-Fi Voyager", color: "bg-indigo-600" },
  "fantasy": { icon: "/badges/fantasy.svg", title: "Mystic Weaver", color: "bg-pink-500" },
  "romance": { icon: "/badges/romance.svg", title: "Heart Scribe", color: "bg-rose-500" },
  "horror": { icon: "/badges/horror.svg", title: "Night Whisperer", color: "bg-gray-800" },
  "mystery": { icon: "/badges/mystery.svg", title: "Codebreaker", color: "bg-teal-600" },
  // Add more genres here!
};

export default function BadgeIcon({ genre }) {
  if (!badgeStyles[genre]) return null;

  const { icon, title, color } = badgeStyles[genre];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm text-white ${color}`}>
      <Image src={icon} alt={`${title} badge`} width={24} height={24} />
      <span>{title}</span>
    </div>
  );
}
