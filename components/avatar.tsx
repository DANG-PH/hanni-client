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
  frameColors = null,
}: {
  user: {
    displayName?: string | null;
    avatarUrl?: string | null;
    id?: string;
    email?: string;
  };
  size?: number;
  className?: string;
  /** Viền gradient trang trí quanh avatar (khung đã mua ở /account) — bỏ
   * trống thì avatar hiện y hệt trước đây, không đổi gì cho các nơi gọi cũ
   * chưa truyền prop này. Màu lấy từ server (`GET /shop/frames`/hồ sơ công
   * khai), không chép tay ở đây để tránh lệch màu khi catalog đổi. */
  frameColors?: [string, string] | null;
}) {
  const src = user.avatarUrl ? mediaUrl(user.avatarUrl) : null;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const initial =
    Array.from((user.displayName || user.email || "H").trim())[0]?.toUpperCase() ??
    "H";

  if (!frameColors) {
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

  // Có khung trang trí: bọc thêm 1 lớp viền gradient, avatar/chữ cái đầu thu
  // nhỏ lại vừa khít bên trong bằng padding thay vì trừ kích thước thủ công.
  const ringWidth = Math.max(2, Math.round(size * 0.08));
  const inner =
    src && !failed ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="block h-full w-full rounded-full bg-surface-2 object-cover"
      />
    ) : (
      <span
        aria-hidden="true"
        className="flex h-full w-full items-center justify-center rounded-full font-bold text-white"
        style={{
          fontSize: size * 0.42,
          background: colorOf(user.id || user.displayName || "hanni"),
        }}
      >
        {initial}
      </span>
    );
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        padding: ringWidth,
        background: `linear-gradient(135deg, ${frameColors[0]}, ${frameColors[1]})`,
      }}
    >
      {inner}
    </span>
  );
}
