"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/api";

const PALETTE = [
  "#c8312b",
  "#93600f",
  "#24784b",
  "#2f6fd0",
  "#8a4fbf",
  "#8e5383",
  "#0d7a7a",
  "#85621c",
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
  onImageError,
}: {
  user: {
    displayName?: string | null;
    avatarUrl?: string | null;
    id?: string;
    email?: string;
  };
  size?: number;
  className?: string;
  onImageError?: () => void;
}) {
  const src = user.avatarUrl ? mediaUrl(user.avatarUrl) : null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const initial =
    Array.from((user.displayName || user.email || "H").trim())[0]?.toUpperCase() ??
    "H";

  if (src && src !== failedSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onLoad={() => setFailedSrc(null)}
        onError={() => {
          setFailedSrc(src);
          onImageError?.();
        }}
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
