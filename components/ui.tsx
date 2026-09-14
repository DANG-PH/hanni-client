"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import headingStyles from "./headings.module.css";
import { StudyLoader } from "./study-loader";
import loaderStyles from "./study-loader.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary:
    "border border-primary bg-primary text-primary-fg hover:bg-primary/90 shadow-sm",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-2",
  ghost:
    "border border-transparent text-muted hover:bg-surface-2 hover:text-foreground",
  danger: "border border-danger/20 bg-danger/8 text-danger hover:bg-danger/15",
};
const buttonClass =
  "motion-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`${buttonClass} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${buttonClass} ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`reveal panel p-5 sm:p-6 ${className}`}>{children}</div>
  );
}
export function ProgressBar({
  value,
  label = "Tiến độ",
  color = "bg-primary",
}: {
  value: number;
  label?: string;
  color?: string;
}) {
  const safeValue = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(safeValue)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
export function Spinner() {
  return (
    <>
      <div className={loaderStyles.workspaceSpinner}>
        <StudyLoader variant="compact" label="Đang tải nội dung học tập…" />
      </div>
      <div
        role="status"
        className={`flex items-center justify-center gap-3 py-20 text-sm text-muted ${loaderStyles.legacySpinner}`}
      >
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        Đang tải…
      </div>
    </>
  );
}
export function Stat({
  label,
  value,
  hint,
  icon = "chart",
  tone = "text-primary bg-primary/8",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  tone?: string;
}) {
  return (
    <div className="reveal hover-card panel p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-sm text-muted">{label}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
    >
      <Icon name="info" className="shrink-0" /> <div>{children}</div>
    </div>
  );
}
export function PageHeading({
  icon = "spark",
  eyebrow,
  title,
  description,
  children,
  tone = "primary",
}: {
  icon?: IconName;
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  tone?: "primary" | "good" | "accent" | "lavender";
}) {
  return (
    <header className={headingStyles.page} data-tone={tone}>
      <div className={headingStyles.identity}>
        <span className={headingStyles.pageIcon}>
          <Icon name={icon} size={28} />
        </span>
        {eyebrow && (
          <p className={headingStyles.eyebrow}>{eyebrow}</p>
        )}
        <h1 className={headingStyles.pageTitle}>{title}</h1>
        <p className={headingStyles.pageDescription}>{description}</p>
      </div>
      {children && <div className={headingStyles.pageActions}>{children}</div>}
    </header>
  );
}

/** Đầu mục gọn bên trong trang, dùng h2 để giữ đúng cấp nội dung. */
export function SectionHeading({
  icon,
  eyebrow,
  title,
  description,
  children,
  className = "",
  id,
  tone = "primary",
}: {
  icon?: IconName;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  id?: string;
  tone?: "primary" | "good" | "accent" | "lavender";
}) {
  return (
    <div className={`${headingStyles.section} ${className}`} data-tone={tone}>
      <div className={headingStyles.sectionIdentity}>
        {icon && (
          <span className={headingStyles.sectionIcon}>
            <Icon name={icon} size={19} />
          </span>
        )}
        <div className={headingStyles.sectionCopy}>
          {eyebrow && <p className={headingStyles.sectionEyebrow}>{eyebrow}</p>}
          <h2 id={id} className={headingStyles.sectionTitle}>
            {title}
          </h2>
          {description && (
            <div className={headingStyles.sectionDescription}>{description}</div>
          )}
        </div>
      </div>
      {children && <div className={headingStyles.sectionActions}>{children}</div>}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Card className="py-12 text-center">
      <span className="icon-tile mx-auto mb-4">
        <Icon name="book" />
      </span>
      <h2 className="font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
      {children && <div className="mt-5">{children}</div>}
    </Card>
  );
}
