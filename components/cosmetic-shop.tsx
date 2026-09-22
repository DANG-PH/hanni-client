"use client";

import { useState } from "react";
import { FrameShop } from "@/components/frame-shop";
import { Icon } from "@/components/icon";
import { TitleShop } from "@/components/title-shop";
import { Card } from "@/components/ui";
import { useWallet } from "@/lib/wallet";

/**
 * Gộp "Cửa hàng trang trí" (khung avatar) và "Danh hiệu" vào MỘT thẻ có tab.
 *
 * Trước đây là 2 thẻ riêng xếp chồng trong cột phải rộng 320px của
 * `/account`, cùng với thẻ Premium và Ví xu — 4 thẻ thương mại cuộn dài,
 * người dùng không thấy được quan hệ giữa chúng. Thực ra cả hai là CÙNG một
 * việc: tiêu xu lấy thứ hiện trên hồ sơ công khai. Gộp lại thì số dư xu chỉ
 * cần hiện 1 lần, và chuyển qua lại giữa 2 loại vật phẩm không phải cuộn.
 *
 * Chỉ gộp ở tầng HIỂN THỊ — `ShopService` và `TitleService` phía server vẫn
 * tách riêng (xem `hanni-server/CLAUDE.md`: mới 2 loại vật phẩm, gộp thành
 * "cosmetic system" tổng quát là abstraction thừa).
 */
const TABS = [
  { key: "frames", label: "Khung avatar", icon: "spark" },
  { key: "titles", label: "Danh hiệu", icon: "trophy" },
] as const;

export function CosmeticShop() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("frames");
  const { data: wallet } = useWallet();

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile bg-lavender/10 text-lavender">
            <Icon name="spark" />
          </span>
          <div>
            <h2 className="font-semibold">Cửa hàng trang trí</h2>
            <p className="mt-1 text-sm text-muted">
              Tiêu xu lấy khung avatar và danh hiệu — hiện trên hồ sơ công khai
              của bạn.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent">
          {(wallet?.balance ?? 0).toLocaleString("vi-VN")} xu
        </span>
      </div>

      <div
        className="mt-5 flex gap-1 rounded-xl bg-surface-2 p-1"
        role="tablist"
        aria-label="Loại vật phẩm"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`motion-button flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold ${
              tab === t.key
                ? "bg-surface text-primary shadow-2xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "frames" ? <FrameShop bare /> : <TitleShop bare />}
      </div>
    </Card>
  );
}
