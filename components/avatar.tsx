"use client";

import { useEffect, useState } from "react";
import { mediaUrl } from "@/lib/api";

const PALETTE = [
  "#c8312b",
  "#b5761b",
  "#2f8f5b",
  "#2f6fd0",
  "#8a4fbf",
  "#9a5b8f",
  "#0f8a8a",
  "#b5852f",
];

function colorOf(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({
  user,
  size = 32,
  className = "",
}: {
  user: {
    displayName?: string | null;
    avatarUrl?: string | null;
    id?: string;
    email?: string;
  };
  size?: number;
  className?: string;
}) {
  const src = user.avatarUrl ? mediaUrl(user.avatarUrl) : null;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const initial =
    Array.from((user.displayName || user.email || "H").trim())[0]?.toUpperCase() ??
    "H";

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full bg-surface-2 object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: colorOf(user.id || user.displayName || "hanni"),
      }}
    >
      {initial}
    </span>
  );
}
