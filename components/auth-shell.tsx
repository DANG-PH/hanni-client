import type { ReactNode } from "react";
import { Icon } from "./icon";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="page-wrap grid min-h-[calc(100vh-170px)] items-center gap-12 py-10! lg:grid-cols-2 lg:gap-24">
      <aside className="relative hidden overflow-hidden rounded-3xl border border-primary/10 bg-primary/5 p-10 lg:block">
        <p className="eyebrow">MỖI NGÀY MỘT CHÚT</p>
        <h2 className="mt-5 text-4xl leading-tight font-semibold tracking-tight">
          Một ngôn ngữ mới.
          <br />
          <span className="text-primary">Nhiều điều để khám phá.</span>
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-7 text-muted">
          Cùng Hanni xây dựng thói quen học tiếng Trung, từ những bước nhỏ đầu
          tiên.
        </p>
        <div
          aria-hidden="true"
          className="relative mx-auto my-10 flex h-48 max-w-xs items-center justify-center"
        >
          <div className="absolute h-36 w-32 -translate-x-16 -rotate-12 rounded-2xl border border-border bg-surface/70" />
          <div className="absolute h-36 w-32 translate-x-16 rotate-12 rounded-2xl border border-primary/15 bg-primary/8" />
          <div className="relative flex h-44 w-40 items-center justify-center rounded-2xl border border-border bg-surface shadow-lg shadow-primary/5">
            <span className="hanzi text-7xl text-primary">学</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-primary/10 pt-6 text-sm text-muted">
          <Icon name="book" size={18} />
          Học theo nhịp của bạn. Tiến bộ theo cách của bạn.
        </div>
      </aside>
      <div className="mx-auto w-full max-w-md">
        <span className="icon-tile mb-6">
          <Icon name="spark" size={23} />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
        {children}
      </div>
    </div>
  );
}
