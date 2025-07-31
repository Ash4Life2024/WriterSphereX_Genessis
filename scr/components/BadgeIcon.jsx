"use client";
import React from "react";
import Image from "next/image";

const badgeStyles = {
  "sci-fi": {
    icon: "/badges/sci-fi.svg",
    title: "Sci-Fi Voyager",
    color: "bg-indigo-600",
  },
  fantasy: {
    icon: "/badges/fantasy.svg",
    title: "Mystic Weaver",
    color: "bg-pink-500",
  },
  romance: {
    icon: "/badges/romance.svg",
    title: "Heart Scribe",
    color: "bg-rose-500",
  },
  horror: {
    icon: "/badges/horror.svg",
    title: "Night Whisperer",
    color: "bg-gray-800",
  },
  mystery: {
    icon: "/badges/mystery.svg",
    title: "Codebreaker",
    color: "bg-teal-600",
  },
  drama: {
    icon: "/badges/drama.svg",
    title: "Soul Weaver",
    color: "bg-purple-700",
  },
};

export default function BadgeIcon({ genre }) {
  if (!badgeStyles[genre]) return null;
  const { icon, title, color } = badgeStyles[genre];

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white ${color} shadow-xl animate-pulse`}>
      <Image src={icon} alt={`${title} badge`} width={28} height={28} />
      <span>{title}</span>
    </div>
  );
}
