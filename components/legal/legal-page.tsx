import Link from "next/link";
import type { ReactNode } from "react";

/** Khung chung cho trang pháp lý: tiêu đề, ngày cập nhật, mục lục, các mục đánh số. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: { id: string; title: string; body: ReactNode }[];
}) {
  return (
    <div className="page-wrap max-w-3xl! py-10! sm:py-14!">
      <p className="eyebrow">PHÁP LÝ</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-xs text-muted">Cập nhật {updated}</p>
      <div className="mt-5 text-sm leading-7 text-muted">{intro}</div>
      <nav aria-label="Mục lục" className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs font-bold tracking-wide text-muted uppercase">Mục lục</p>
        <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:text-primary">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-8 space-y-8">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="scroll-mt-24">
            <h2 id={`${s.id}-t`} className="text-lg font-bold">
              {i + 1}. {s.title}
            </h2>
            <div className="legal-body mt-2 space-y-2 text-sm leading-7 text-muted">{s.body}</div>
          </section>
        ))}
      </div>
      <p className="mt-10 border-t border-border pt-5 text-xs text-muted">
        Xem thêm:{" "}
        <Link href="/dieu-khoan" className="text-primary hover:underline">
          Điều khoản sử dụng
        </Link>{" "}
        ·{" "}
        <Link href="/chinh-sach-bao-mat" className="text-primary hover:underline">
          Chính sách bảo mật
        </Link>{" "}
        ·{" "}
        <Link href="/nguon-du-lieu" className="text-primary hover:underline">
          Nguồn dữ liệu
        </Link>{" "}
        ·{" "}
        <Link href="/hop-tac#lien-he" className="text-primary hover:underline">
          Liên hệ
        </Link>
      </p>
    </div>
  );
}
