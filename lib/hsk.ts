/** Bậc HSK theo cấp: 1–3 Sơ cấp, 4–6 Trung cấp, 7–9 Cao cấp. */
export function hskBand(level: number): {
  label: string;
  tone: string;
} {
  if (level <= 3) return { label: "Sơ cấp", tone: "bg-good/10 text-good" };
  if (level <= 6)
    return { label: "Trung cấp", tone: "bg-warn/10 text-warn" };
  return { label: "Cao cấp", tone: "bg-lavender/10 text-lavender" };
}
