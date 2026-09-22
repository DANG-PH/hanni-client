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
    "border border-primary/90 bg-gradient-to-b from-primary to-primary/90 text-primary-fg hover:brightness-110 shadow-md shadow-primary/25 active:translate-y-0.5",
  secondary:
    "border border-border/80 bg-surface/90 text-foreground hover:bg-surface-2 hover:border-primary/30 shadow-xs active:translate-y-0.5",
  ghost:
    "border border-transparent text-muted hover:bg-surface-2 hover:text-foreground active:translate-y-0.5",
  danger:
    "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 shadow-xs active:translate-y-0.5",
};
const buttonClass =
  "motion-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4.5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none";
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
  onClick,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  /** Chạy kèm lúc bấm (vẫn điều hướng như thường) — vd ghi tạm dữ liệu vào
   * sessionStorage trước khi rời trang. */
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
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
      className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2/90 p-0.5 shadow-inner"
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${color} shadow-xs`}
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
  tone = "text-primary bg-primary/10 border-primary/20",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  tone?: string;
}) {
  return (
    <div className="reveal hover-card panel relative overflow-hidden p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted uppercase">
          {label}
        </span>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone} shadow-2xs`}
        >
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      {hint && (
        <p className="mt-2 text-xs text-muted leading-relaxed">{hint}</p>
      )}
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
        {eyebrow && <p className={headingStyles.eyebrow}>{eyebrow}</p>}
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
            <div className={headingStyles.sectionDescription}>
              {description}
            </div>
          )}
        </div>
      </div>
      {children && (
        <div className={headingStyles.sectionActions}>{children}</div>
      )}
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
