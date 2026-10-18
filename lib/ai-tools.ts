"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";

/** Tiện ích AI trong luồng học — mẹo nhớ, chấm câu, phân tích câu (xem
 * `hanni-server/CLAUDE.md` mục "Tiện ích AI"). Chung 1 hạn mức/ngày. */

export interface AiUsage {
  used: number;
  limit: number;
  premium: boolean;
  enabled: boolean;
}

export interface SentenceCheckResult {
  score: number;
  usesWord: boolean;
  corrected: string;
  pinyin: string;
  translationVi: string;
  explanationVi: string;
  tipVi: string | null;
  sentence: string;
  cached: boolean;
}

export interface AnalysisToken {
  text: string;
  wordId: string | null;
  simplified: string | null;
  pinyin: string | null;
  hanViet: string | null;
  meaningVi: string | null;
  hskLevel: number | null;
}

export interface AnalysisResult {
  source: "zh" | "vi";
  input: string;
  zh: string;
  pinyin: string;
  translationVi: string;
  grammar: { pattern: string; explanationVi: string }[];
  notesVi: string | null;
  tokens: AnalysisToken[];
  cached: boolean;
}

const fetcher = <T>(path: string) => apiFetch<T>(path);

export function useAiUsage(enabled: boolean) {
  return useSWR<AiUsage>(enabled ? "/ai/usage" : null, fetcher);
}

export function generateMnemonic(wordId: string) {
  return api.post<{ mnemonicVi: string; cached: boolean }>(`/ai/mnemonic/${wordId}`);
}

export function checkSentence(wordId: string, sentence: string) {
  return api.post<SentenceCheckResult>("/ai/sentence-check", { wordId, sentence });
}

export function analyzeText(text: string) {
  return api.post<AnalysisResult>("/ai/analyze", { text });
}
