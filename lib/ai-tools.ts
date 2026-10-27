"use client";

import { api } from "./api";

/** Tiện ích AI trong luồng học — mẹo nhớ, chấm câu, phân tích câu (xem
 * `hanni-server/CLAUDE.md` mục "Tiện ích AI"). Chung 1 hạn mức/ngày. */

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

/**
 * API → POST /ai/mnemonic/:wordId · server: modules/ai-tools/ai-tools.controller.ts → AiToolsService.mnemonic()
 */
export function generateMnemonic(wordId: string) {
  return api.post<{ mnemonicVi: string; cached: boolean }>(`/ai/mnemonic/${wordId}`);
}

/**
 * API → POST /ai/sentence-check · server: modules/ai-tools/ai-tools.controller.ts → AiToolsService.checkSentence()
 */
export function checkSentence(wordId: string, sentence: string) {
  return api.post<SentenceCheckResult>("/ai/sentence-check", { wordId, sentence });
}

/**
 * API → POST /ai/analyze · server: modules/ai-tools/ai-tools.controller.ts → AiToolsService.analyze()
 */
export function analyzeText(text: string) {
  return api.post<AnalysisResult>("/ai/analyze", { text });
}
