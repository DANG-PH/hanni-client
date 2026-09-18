/** Render câu chữ Hán với pinyin (tô màu theo thanh điệu) phía trên từng chữ.
 * Nhóm theo `tokens` (server tách sẵn theo từ vựng thật) — đoạn khớp 1 từ
 * thật thì bấm được để xem nghĩa + lưu vào SRS, đoạn không khớp giữ nguyên. */
import type { LineToken } from "@/lib/types";

const TONE_CLASS: Record<string, string> = {
  "1": "text-[#c23b32]",
  "2": "text-[#2f8f4f]",
  "3": "text-[#2f6fd0]",
  "4": "text-[#8a4fbf]",
  "5": "text-muted",
  "0": "text-muted",
};

function toneOf(numSyllable: string): string {
  const m = /([1-5])(?!.*[1-5])/.exec(numSyllable);
  return m ? m[1] : "5";
}
function stripTone(diacritic: string): string {
  return diacritic;
}

export function TonePinyin({
  zh,
  pinyin,
  pinyinNum,
  tokens,
  size = "base",
  onWordClick,
}: {
  zh: string;
  pinyin: string;
  pinyinNum: string;
  tokens?: LineToken[];
  size?: "sm" | "base" | "lg";
  onWordClick?: (token: LineToken) => void;
}) {
  const chars = Array.from(zh);
  const dia = pinyin.trim().split(/\s+/);
  const num = pinyinNum.trim().split(/\s+/);
  const hanziSize =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";

  function renderChar(ch: string, i: number) {
    const isHan = /\p{Script=Han}/u.test(ch);
    const p = dia[i] ?? "";
    const tone = isHan ? toneOf(num[i] ?? "5") : "5";
    return (
      <span key={i} className="flex flex-col items-center leading-none">
        <span
          className={`mb-0.5 text-[11px] ${
            isHan ? TONE_CLASS[tone] : "text-transparent"
          }`}
        >
          {isHan ? stripTone(p) : "·"}
        </span>
        <span className={`hanzi ${hanziSize}`}>{ch}</span>
      </span>
    );
  }

  if (!tokens) {
    return (
      <div className="flex flex-wrap items-end gap-x-1 gap-y-2">
        {chars.map((ch, i) => renderChar(ch, i))}
      </div>
    );
  }

  const startOffsets = tokens.reduce<number[]>((acc, token, i) => {
    const prev = i > 0 ? acc[i - 1] + Array.from(tokens[i - 1].text).length : 0;
    acc.push(prev);
    return acc;
  }, []);

  return (
    <div className="flex flex-wrap items-end gap-x-1 gap-y-2">
      {tokens.map((token, ti) => {
        const tokenChars = Array.from(token.text);
        const start = startOffsets[ti];
        const content = tokenChars.map((ch, j) => renderChar(ch, start + j));
        if (!token.word || !onWordClick) {
          return (
            <span key={ti} className="flex items-end gap-x-1">
              {content}
            </span>
          );
        }
        return (
          <span
            key={ti}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onWordClick(token);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onWordClick(token);
              }
            }}
            className="flex cursor-pointer items-end gap-x-1 rounded-md underline decoration-primary/40 decoration-dotted underline-offset-4 hover:bg-primary/8"
          >
            {content}
          </span>
        );
      })}
    </div>
  );
}
