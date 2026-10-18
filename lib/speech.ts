"use client";

import { useSyncExternalStore } from "react";

/** Nhận dạng giọng nói của trình duyệt (Web Speech API) — Chrome/Edge, Safari;
 * Firefox không có. Dùng chung cho ô tra từ điển và luyện nói với AI. */
export type Recognizer = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous?: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void)
    | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognizerCtor = new () => Recognizer;

export function recognizerCtor(): RecognizerCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noSubscription = () => () => {};

/** Trình duyệt có nhận dạng giọng nói không — SSR luôn false, không lệch hydrate. */
export function useCanRecognize(): boolean {
  return useSyncExternalStore(noSubscription, () => recognizerCtor() !== null, () => false);
}
