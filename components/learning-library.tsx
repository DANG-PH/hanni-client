import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import { PageHeading } from "./ui";
import { SelectionGroup } from "./selection-group";
import styles from "./learning-library.module.css";

type LibrarySection = "vocabulary" | "grammar" | "exams";

export function LearningHeader({
  section,
  eyebrow,
  title,
  description,
  children,
}: {
  section: LibrarySection;
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  const icons = {
    vocabulary: "book",
    grammar: "cards",
    exams: "target",
  } satisfies Record<LibrarySection, IconName>;

  return (
    <PageHeading
      icon={icons[section]}
      eyebrow={eyebrow}
      title={title}
      description={description}
    >
      {children}
    </PageHeading>
  );
}

export function LevelFilter({
  options,
  value,
  onChange,
}: {
  options: { value: number | undefined; label: string; count?: number }[];
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <SelectionGroup
      className={styles.levels}
      label="Lọc theo cấp HSK"
      value={value}
    >
      {options.map((option) => (
        <button
          key={option.value ?? "all"}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && <span>{option.count}</span>}
        </button>
      ))}
    </SelectionGroup>
  );
}

export function LearningTip({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.tip}>
      <span className={styles.tipIcon}>
        <Icon name="spark" size={20} />
      </span>
      <div>
        <h3>{title}</h3>
        <div className={styles.tipCopy}>{children}</div>
      </div>
    </div>
  );
}
