"use client";

import type { RankTierInfo } from "@/lib/types";

/** Huy hiệu rank dạng khiên — pip tròn tăng dần theo bậc (1 cho Sắt → 8 cho
 * Đại Cao Thủ), riêng bậc cao nhất (Thách Đấu) đổi sang sao + có quầng sáng
 * để nổi bật rõ đây là bậc giới hạn số lượng (`GET /duel/rank-tiers`),
 * không phải chỉ cần đủ ELO là lên được. Màu lấy thẳng từ server
 * (`tierColor`) để chỉ cần đổi 1 chỗ (`duel-rank.util.ts` bên server) khi
 * cân bằng lại ngưỡng ELO — client không tự đoán màu theo tên tier. Dùng
 * chung cho cả `/minigame` (Đấu 1v1) và `/leaderboard` (tab "Đấu 1v1 ELO").
 */
export function RankEmblem({
  tierName,
  color,
  tiers,
  size = 40,
}: {
  tierName: string;
  color: string;
  tiers: RankTierInfo[] | undefined;
  size?: number;
}) {
  const idx = tiers ? tiers.findIndex((t) => t.name === tierName) : -1;
  const isTop = !!tiers && idx === tiers.length - 1;
  const pipCount = Math.max(1, idx + 1);
  const gradId = `rank-grad-${tierName.replace(/\s+/g, "-")}`;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {isTop && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 ${Math.round(size * 0.4)}px ${color}99` }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 44"
        className="relative"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path
          d="M20 2 L36 9 V21 C36 30 29 37 20 41 C11 37 4 30 4 21 V9 Z"
          fill={`url(#${gradId})`}
          stroke={color}
          strokeWidth="1.5"
        />
        {isTop ? (
          <path
            d="m20 13 2.6 6.4L29 22l-6.4 2.6L20 31l-2.6-6.4L11 22l6.4-2.6Z"
            fill="#fff"
            fillOpacity="0.92"
          />
        ) : (
          Array.from({ length: pipCount }).map((_, i) => (
            <circle
              key={i}
              cx={20 - ((pipCount - 1) * 3) / 2 + i * 3}
              cy={25}
              r="1.4"
              fill="#fff"
              fillOpacity="0.85"
            />
          ))
        )}
      </svg>
    </span>
  );
}
