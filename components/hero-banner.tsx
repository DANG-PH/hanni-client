"use client";

import Link from "next/link";
import { Icon } from "./icon";
import { StudyArtwork } from "./study-artwork";

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
    <section className="reveal relative isolate overflow-hidden tint-hero rounded-3xl border border-primary/15 p-6 shadow-sm shadow-primary/5 sm:p-9 lg:min-h-[340px] lg:p-11">
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
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[42%] select-none items-center justify-center overflow-hidden border-l border-primary/10 bg-primary/[0.06] lg:flex"
      >
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-primary/10" />
        <div className="absolute -bottom-28 -left-12 h-72 w-72 rounded-full border border-primary/10" />
        <div className="w-[min(460px,92%)] origin-center scale-[0.82] xl:scale-90">
          <StudyArtwork />
        </div>
      </div>
    </section>
  );
}
