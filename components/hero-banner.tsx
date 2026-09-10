"use client";

import Link from "next/link";
import { Icon } from "./icon";

/** Lời chào cá nhân và lối vào bài học đang tiếp tục. */
export function HeroBanner({
  title,
  highlight,
  subtitle,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  highlight: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <section className="reveal relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-[linear-gradient(115deg,#fff2ef_0%,#fff8f2_45%,#ffffff_100%)] p-6 shadow-sm shadow-primary/5 sm:p-9 lg:p-11">
      <div className="relative z-10 max-w-lg lg:max-w-[58%]">
        <p className="eyebrow mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Mỗi ngày một bước tiến
        </p>
        <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-tight sm:text-[40px]">
          {title}
          <br />
          <span className="text-primary">{highlight}</span>
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-7 text-muted">
          {subtitle}
        </p>
        <Link
          href={ctaHref}
          className="motion-button mt-7 inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-4 text-[15px] font-bold text-primary-fg shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5"
        >
          {ctaLabel}
          <Icon name="arrow" size={18} />
        </Link>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[40%] select-none overflow-hidden border-l border-primary/10 bg-[radial-gradient(120%_120%_at_80%_20%,rgba(220,53,38,0.14),transparent_60%)] lg:flex lg:items-center lg:justify-center"
      >
        <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full border border-primary/10" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full border border-primary/10" />
        <div className="relative flex -rotate-6 items-stretch gap-2 rounded-2xl border border-primary/15 bg-surface p-3 shadow-xl shadow-primary/5">
          <div className="flex min-h-44 w-28 flex-col items-center justify-center rounded-l-lg border border-border bg-surface-2/60">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted">
              Hanni
            </span>
            <span className="hanzi mt-3 text-7xl text-primary">学</span>
            <span className="mt-3 text-xs text-muted">xué · học</span>
          </div>
          <div className="flex w-24 flex-col items-center justify-center gap-3 rounded-r-lg border border-border px-4">
            <span className="hanzi text-3xl text-foreground">每天</span>
            <div className="h-px w-full bg-border" />
            <span className="hanzi text-3xl text-foreground">进步</span>
            <span className="mt-1 text-[9px] text-muted">Tiến bộ mỗi ngày</span>
          </div>
          <span className="absolute -bottom-4 -right-3 flex h-12 w-12 rotate-12 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-lg shadow-primary/20">
            <Icon name="spark" size={25} />
          </span>
        </div>
      </div>
    </section>
  );
}
