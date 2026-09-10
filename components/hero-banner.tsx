"use client";

import Link from "next/link";
import { Icon } from "./icon";

/** Banner lớn ở đầu Tổng quan — nền gradient ấm, chữ Hán trang trí. */
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
    <section className="hero reveal relative overflow-hidden rounded-3xl border border-border p-7 sm:p-10">
      <div className="relative z-10 max-w-lg">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {title}
          <br />
          <span className="text-primary">{highlight}</span>
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-muted">{subtitle}</p>
        <Link
          href={ctaHref}
          className="motion-button mt-7 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-fg shadow-sm"
        >
          {ctaLabel}
          <Icon name="arrow" size={18} />
        </Link>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-6 hidden select-none sm:block"
      >
        <span className="hanzi block text-[190px] leading-none text-primary/10">
          学
        </span>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 right-8 hidden gap-3 text-4xl opacity-70 sm:flex"
      >
        <span>🏮</span>
        <span>🌸</span>
      </div>
    </section>
  );
}
