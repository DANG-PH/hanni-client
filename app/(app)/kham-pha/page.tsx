"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import { Spinner } from "@/components/ui";
import { VideoShelf } from "@/components/video-shelf";
import { WordOfTheDayCard } from "@/components/word-of-the-day";
import { useRequireAuth } from "@/lib/auth";
import { EXPLORE_ITEMS } from "@/lib/explore";

const GROUPS = ["Luyện kỹ năng", "Giải trí", "Tra cứu"] as const;

/** Mọi công cụ luyện thêm ngoài lộ trình — một chỗ duy nhất thay cho 10 mục
 * menu rời rạc. Lộ trình (/learn) vẫn là nơi học chính; đây là chỗ đào sâu. */
export default function ExplorePage() {
  const { user, loading } = useRequireAuth();
  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap space-y-8">
      <div>
        <p className="eyebrow">KHÁM PHÁ</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
          Luyện thêm theo cách bạn thích
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Lộ trình là nơi học chính. Ở đây là những cách luyện thêm — mặc định đều bám theo
          bài bạn đang học.
        </p>
      </div>

      {GROUPS.map((group) => (
        <section key={group} aria-labelledby={`g-${group}`}>
          <h2 id={`g-${group}`} className="mb-3 text-sm font-bold text-muted">
            {group}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {EXPLORE_ITEMS.filter((i) => i.group === group).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="panel hover-card flex h-full items-start gap-3 p-4"
                >
                  <span className="icon-tile flex h-11 w-11 shrink-0 items-center justify-center">
                    <Icon name={item.icon} size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="grid items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <WordOfTheDayCard />
        <VideoShelf limit={6} />
      </div>
    </div>
  );
}
