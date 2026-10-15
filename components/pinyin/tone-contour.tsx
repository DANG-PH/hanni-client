/** Đường cao độ thanh điệu trên thang 5 bậc (1 thấp — 5 cao), màu theo
 * `currentColor` để dùng chung màu thanh với `TONE_CLASS`. */
export function ToneContour({ pitch, className = "" }: { pitch: number[]; className?: string }) {
  const W = 120;
  const H = 64;
  const pad = 8;
  const y = (lvl: number) => pad + ((5 - lvl) / 4) * (H - 2 * pad);
  const x = (i: number) => pad + (i / (pitch.length - 1)) * (W - 2 * pad);
  const d = pitch.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden>
      {[1, 2, 3, 4, 5].map((l) => (
        <line key={l} x1={pad} x2={W - pad} y1={y(l)} y2={y(l)} stroke="currentColor" strokeOpacity={0.12} />
      ))}
      <path d={d} fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
