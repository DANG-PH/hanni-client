import Link from "next/link";
import { Icon, type IconName } from "./icon";

/**
 * Khối "bước tiếp theo" — đặt cuối các trang hoạt động.
 *
 * Lý do tồn tại: rà lại toàn bộ liên kết chéo (2026-09-22) thấy `/listening`,
 * `/writing`, `/roleplay`, `/minigame` **không link sang đâu cả** — người học
 * làm xong là cụt đường, phải tự mò sidebar. Đó chính là cảm giác "các phần
 * rời rạc" mà cả user lẫn dev FE đều nhận ra.
 *
 * Nguyên tắc khi thêm: chỉ gợi ý bước tiếp theo TỰ NHIÊN của việc vừa làm
 * (nghe xong → nói lại chính từ đó), không nhét link bừa cho đủ.
 */
export function NextStep({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: { href: string; label: string; icon: IconName }[];
}) {
  return (
    <section className="panel tint-primary p-5 sm:p-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1.5 text-xs leading-5 text-muted">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="hover-card inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-sm font-medium"
          >
            <Icon name={a.icon} size={16} className="text-primary" />
            {a.label}
            <Icon name="arrow" size={14} className="text-muted" />
          </Link>
        ))}
      </div>
    </section>
  );
}
