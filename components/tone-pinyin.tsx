/** Render câu chữ Hán với pinyin (tô màu theo thanh điệu) phía trên từng chữ. */

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
  size = "base",
}: {
  zh: string;
  pinyin: string;
  pinyinNum: string;
  size?: "sm" | "base" | "lg";
}) {
  const chars = Array.from(zh);
  const dia = pinyin.trim().split(/\s+/);
  const num = pinyinNum.trim().split(/\s+/);
  const hanziSize =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";

  return (
    <div className="flex flex-wrap items-end gap-x-1 gap-y-2">
      {chars.map((ch, i) => {
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
      })}
    </div>
  );
}
