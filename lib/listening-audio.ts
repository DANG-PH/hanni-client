"use client";

import { mediaUrl } from "./api";
import type { MockSpeechLine } from "./types";

/**
 * Phát phần NGHE của đề thi thử. Đề thật có băng ghi âm; Hanni không có nên
 * đọc lời thoại bằng giọng tiếng Trung của trình duyệt (Web Speech API) — từ
 * đơn có bản ghi âm thật thì phát bản ghi âm. Như đề thật, mỗi câu đọc 2 lần.
 * Chỉ 1 câu phát tại một thời điểm: bấm câu khác là dừng câu đang phát.
 */

type Speaker = MockSpeechLine["s"];
interface VoicePick {
  voice: SpeechSynthesisVoice;
  pitch: number;
  rate: number;
}

const REPEAT = 2;
const GAP_REPEAT_MS = 1200;
const GAP_LINE_MS = 400;
/** Tên giọng nam phổ biến (Edge/Windows, Android); còn lại coi là giọng nữ. */
const MALE = /yunxi|yunyang|yunjian|yunhao|yunfeng|yunze|yunye|kangkang|zhiwei|male|男/i;

let token = 0;
let currentAudio: HTMLAudioElement | null = null;

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function zhVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis
    .getVoices()
    .filter(
      (v) => /^(zh|cmn)([-_]|$)/i.test(v.lang) && !/HK|TW|Hant|yue/i.test(v.lang),
    );
}

/** Chrome nạp danh sách giọng KHÔNG đồng bộ — lần đầu gọi có thể rỗng. */
function loadVoices(timeoutMs = 2000): Promise<SpeechSynthesisVoice[]> {
  if (!speechSupported()) return Promise.resolve([]);
  const now = zhVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", done);
      clearTimeout(timer);
      resolve(zhVoices());
    };
    const timer = setTimeout(done, timeoutMs);
    window.speechSynthesis.addEventListener("voiceschanged", done);
  });
}

function pickVoices(voices: SpeechSynthesisVoice[]): Record<Speaker, VoicePick> | null {
  if (!voices.length) return null;
  // Giọng "Natural" (Edge) và Google tự nhiên hơn hẳn giọng hệ điều hành cũ.
  const rank = (v: SpeechSynthesisVoice) =>
    /natural|neural/i.test(v.name) ? 0 : /google/i.test(v.name) ? 1 : 2;
  const sorted = [...voices].sort((a, b) => rank(a) - rank(b));
  const male = sorted.find((v) => MALE.test(v.name));
  const female = sorted.find((v) => !MALE.test(v.name)) ?? sorted[0];
  return {
    F: { voice: female, pitch: 1.05, rate: 0.9 },
    // Không có giọng nam thì hạ cao độ giọng nữ để vẫn phân biệt được 2 người.
    M: male ? { voice: male, pitch: 1, rate: 0.9 } : { voice: female, pitch: 0.65, rate: 0.88 },
    N: { voice: female, pitch: 0.95, rate: 0.92 },
  };
}

/** Có giọng đọc tiếng Trung phổ thông trên thiết bị không. */
export async function hasChineseVoice(): Promise<boolean> {
  return (await loadVoices()).length > 0;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function speakOne(text: string, pick: VoicePick, mine: number): Promise<void> {
  return new Promise((resolve) => {
    if (mine !== token) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = pick.voice;
    u.lang = pick.voice.lang;
    u.pitch = pick.pitch;
    u.rate = pick.rate;
    // Phòng trình duyệt không bắn `end` (Chrome thỉnh thoảng nuốt sự kiện).
    const safety = setTimeout(resolve, Array.from(text).length * 450 + 3000);
    u.onend = u.onerror = () => {
      clearTimeout(safety);
      resolve();
    };
    window.speechSynthesis.speak(u);
  });
}

function playUrl(url: string, mine: number): Promise<void> {
  return new Promise((resolve) => {
    if (mine !== token) return resolve();
    const a = new Audio(url);
    currentAudio = a;
    const safety = setTimeout(resolve, 15000);
    const end = () => {
      clearTimeout(safety);
      resolve();
    };
    a.onended = end;
    a.onerror = end;
    void a.play().catch(end);
  });
}

export function stopListening() {
  token += 1;
  currentAudio?.pause();
  currentAudio = null;
  if (speechSupported()) window.speechSynthesis.cancel();
}

export type PlayResult = "ended" | "cancelled" | "no-voice";

/** Phát 1 câu nghe (đọc 2 lần). Trả "no-voice" nếu cần giọng máy mà thiết
 * bị không có giọng tiếng Trung — giao diện khi đó cho xem lời thoại. */
export async function playListening(
  audio: { lines: MockSpeechLine[]; url?: string },
  onRound?: (round: number) => void,
): Promise<PlayResult> {
  stopListening();
  const mine = token;
  const url = audio.url ? mediaUrl(audio.url) : null;
  const voices = url ? null : pickVoices(await loadVoices());
  if (!url && !voices) return "no-voice";
  for (let round = 1; round <= REPEAT; round++) {
    if (mine !== token) return "cancelled";
    onRound?.(round);
    if (url) await playUrl(url, mine);
    else
      for (const [i, line] of audio.lines.entries()) {
        if (i > 0) await wait(GAP_LINE_MS);
        await speakOne(line.zh, voices![line.s], mine);
      }
    if (round < REPEAT) await wait(GAP_REPEAT_MS);
  }
  return mine === token ? "ended" : "cancelled";
}
