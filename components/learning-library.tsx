import { SelectionGroup } from "./selection-group";
import styles from "./learning-library.module.css";

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
