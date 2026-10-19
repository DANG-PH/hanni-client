"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { speakChinese, stopListening } from "@/lib/listening-audio";

/** Đọc to 1 câu tiếng Trung bằng giọng của trình duyệt (câu ví dụ không có ghi âm thật). */
export function SpeakButton({ text, label = "Nghe câu" }: { text: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => () => stopListening(), []);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        if (busy) {
          stopListening();
          setBusy(false);
          return;
        }
        setBusy(true);
        await speakChinese(text);
        setBusy(false);
      }}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${busy ? "bg-primary text-primary-fg" : "bg-primary/8 text-primary hover:bg-primary/15"}`}
    >
      <Icon name={busy ? "pause" : "sound"} size={15} />
    </button>
  );
}
