"use client";

import { useSyncExternalStore } from "react";

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaState = {
  initialized: boolean;
  standalone: boolean;
  ios: boolean;
  online: boolean;
  installPrompt: InstallPromptEvent | null;
  workerStatus: "checking" | "ready" | "unsupported" | "development" | "error";
  updateAvailable: boolean;
  /** true khi popup mời cài PWA (install-prompt.tsx) ĐANG THẬT SỰ hiện trên
   * màn hình — component đó tự cập nhật giá trị này, nơi khác chỉ đọc, để
   * tránh phải chép lại logic show/hidden/snooze của nó ở chỗ khác. */
  promptDialogVisible: boolean;
};

const initialState: PwaState = {
  initialized: false,
  standalone: false,
  ios: false,
  online: true,
  installPrompt: null,
  workerStatus: "checking",
  updateAvailable: false,
  promptDialogVisible: false,
};
let state = initialState;
const listeners = new Set<() => void>();
export function updatePwaState(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}
export function getPwaState() {
  return state;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function usePwaState() {
  return useSyncExternalStore(subscribe, getPwaState, () => initialState);
}
