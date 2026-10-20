"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { PremiumModal } from "@/components/premium-modal";
import { usePremiumStatus } from "@/lib/premium";

/**
 * Lối vào Premium cố định ở chân menu — máy tính: góc dưới trái; điện thoại: trong ngăn "Thêm". Trước 2026-10-20
 * chỉ có trong /account (user: "phải vào tài khoản mới thấy thì không hay"). Đang Premium thì còn 1 dòng trạng thái.
 */
export function PremiumNavCard({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { data } = usePremiumStatus();
  const [open, setOpen] = useState(false);
  if (!data) return null;

  if (data.active)
    return (
      <Link
        href="/account"
        onClick={onNavigate}
        title={collapsed ? "Hanni Premium" : undefined}
        className={`nav-item text-xs! text-accent! ${collapsed ? "justify-center px-0!" : ""}`}
      >
        <Icon name="crown" size={16} />
        <span className={collapsed ? "sr-only" : ""}>
          {data.lifetime ? "Premium trọn đời" : "Đang dùng Premium"}
        </span>
      </Link>
    );

  return (
    <>
      {collapsed ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Nâng cấp Premium"
          aria-label="Nâng cấp Premium"
          className="nav-item mb-1 w-full justify-center px-0! text-accent!"
        >
          <Icon name="crown" size={18} />
        </button>
      ) : (
        <div className="mb-3 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-surface to-primary/8 p-3.5">
          <p className="flex items-center gap-2 text-sm font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Icon name="crown" size={16} />
            </span>
            Hanni Premium
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Trợ lý AI không giới hạn, Hanni Coach nhận xét kết quả, quét ảnh 100 lượt/ngày.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="motion-button mt-3 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-primary bg-primary text-xs font-bold text-primary-fg shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_62%,#000)] hover:brightness-105 active:translate-y-[2px] active:shadow-none"
          >
            Nâng cấp
            <Icon name="arrow" size={13} />
          </button>
        </div>
      )}
      {open && <PremiumModal plans={data.plans} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Điện thoại/máy tính bảng (< lg): menu nằm trong ngăn "Thêm" nên thêm nút vương miện trên thanh trên. */
export function PremiumTopButton() {
  const { data } = usePremiumStatus();
  const [open, setOpen] = useState(false);
  if (!data || data.active) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Nâng cấp Premium"
        title="Nâng cấp Premium"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent hover:bg-accent/20 lg:hidden"
      >
        <Icon name="crown" size={17} />
      </button>
      {open && <PremiumModal plans={data.plans} onClose={() => setOpen(false)} />}
    </>
  );
}
