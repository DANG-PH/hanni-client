"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, NAV_MAIN, NAV_MORE, ACCOUNT_LINK, CLASS_LINK, INSTALL_LINK, type NavLink } from "@/lib/nav";
import { Icon } from "./icon";
import { useNavBadges } from "./sidebar";

/** 4 việc hằng ngày; mục "Từ điển" và phần cộng đồng/cá nhân nằm trong "Thêm". */
const TABS: NavLink[] = NAV_MAIN.filter((l) => l.href !== "/tu-dien").map((l) =>
  l.href === "/thi-thu-hsk" ? { ...l, label: "Luyện thi" } : l,
);
const IN_MORE = ["/tu-dien", ...NAV_MORE.map((l) => l.href), CLASS_LINK.href, ACCOUNT_LINK.href, INSTALL_LINK.href];

/**
 * Thanh tab dưới đáy cho điện thoại/máy tính bảng — cách app của Hanzii,
 * Migii HSK, Hanbeego, Duolingo đều làm: việc hay làm nhất cách 1 chạm, luôn
 * thấy, thay vì nằm sau nút ☰ (NN/g: menu ẩn được dùng ít hơn hẳn).
 */
export function BottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const { due } = useNavBadges();
  const moreActive = IN_MORE.some((href) => isNavActive(pathname, href));

  const cell = "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 text-xs font-semibold";
  const pill = (active: boolean) =>
    `flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-primary/12" : ""}`;

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-xl items-stretch px-1">
        {TABS.map((tab) => {
          const active = isNavActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`${cell} ${active ? "text-primary" : "text-muted"}`}
            >
              <span className={pill(active)}>
                <Icon name={tab.icon} size={21} />
              </span>
              <span className="max-w-full truncate">{tab.label}</span>
              {tab.href === "/study" && due > 0 && (
                <span className="absolute top-1 left-1/2 ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-fg">
                  {due > 99 ? "99+" : due}
                </span>
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          aria-haspopup="dialog"
          className={`${cell} ${moreActive ? "text-primary" : "text-muted"}`}
        >
          <span className={pill(moreActive)}>
            <Icon name="menu" size={21} />
          </span>
          <span>Thêm</span>
        </button>
      </div>
    </nav>
  );
}
