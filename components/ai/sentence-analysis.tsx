"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { Button, ErrorNote } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { analyzeText, type AnalysisResult } from "@/lib/ai-tools";

/**
 * Ô tra từ điển nhận cả CÂU (như Hanzii dịch câu): câu tiếng Trung → tách từ theo từ điển
 * Hanni (Hán Việt, nghĩa, bấm sang trang từ) + bản dịch + cấu trúc ngữ pháp; câu tiếng Việt
 * → dịch sang tiếng Trung rồi tách từ như trên.
 */
export function SentenceAnalysis({ text }: { text: string }) {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const vi = !/\p{Script=Han}/u.test(text);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setResult(await analyzeText(text));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chưa phân tích được câu này, thử lại nhé.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;
  return (
    <section aria-label="Phân tích câu bằng AI" className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Icon name="spark" size={16} className="text-accent" />
            {vi ? "Nói câu này bằng tiếng Trung thế nào?" : "Phân tích cả câu"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {vi ? "AI dịch sang tiếng Trung, tách từng từ kèm âm Hán Việt." : "AI dịch, chỉ ra cấu trúc ngữ pháp; từng từ kèm âm Hán Việt."}
          </p>
        </div>
        {!result &&
          (user ? (
            <Button onClick={() => void run()} disabled={busy}>
              <Icon name="spark" size={16} />
              {busy ? "AI đang phân tích…" : vi ? "Dịch bằng AI" : "Phân tích bằng AI"}
            </Button>
          ) : (
            <a
              href={`/login?next=${encodeURIComponent(`/tu-dien?q=${encodeURIComponent(text)}`)}`}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold hover:text-primary"
            >
              Đăng nhập để dùng AI <Icon name="arrow" size={15} />
            </a>
          ))}
      </div>
      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      {result && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-1.5" lang="zh">
            {result.tokens.map((t, i) =>
              t.wordId && t.simplified ? (
                <Link
                  key={i}
                  href={`/tu-dien/${encodeURIComponent(t.simplified)}`}
                  title={t.meaningVi ?? undefined}
                  className="flex flex-col items-center rounded-xl border border-border px-2.5 py-1.5 hover:border-primary/40"
                >
                  <span className="text-xs text-muted">{t.pinyin}</span>
                  <span className="hanzi text-xl leading-tight text-primary">{t.text}</span>
                  {t.hanViet && <span className="text-xs font-semibold text-hanviet">{t.hanViet}</span>}
                  {t.meaningVi && <span className="max-w-28 truncate text-xs text-muted">{t.meaningVi}</span>}
                </Link>
              ) : (
                <span key={i} className="flex flex-col items-center justify-end px-1 py-1.5">
                  {t.pinyin && <span className="text-xs text-muted">{t.pinyin}</span>}
                  <span className="hanzi text-xl leading-tight">{t.text}</span>
                </span>
              ),
            )}
          </div>
          <div>
            <p className="text-xs text-muted">{result.pinyin}</p>
            <p className="mt-1 text-base font-medium">{result.translationVi}</p>
          </div>
          {result.grammar.length > 0 && (
            <ul className="space-y-2">
              {result.grammar.map((g) => (
                <li key={g.pattern} className="rounded-xl bg-surface-2/70 px-3.5 py-2.5 text-sm">
                  <p lang="zh" className="hanzi font-semibold">{g.pattern}</p>
                  <p className="mt-0.5 leading-6 text-muted">{g.explanationVi}</p>
                </li>
              ))}
            </ul>
          )}
          {result.notesVi && (
            <p className="flex gap-2 text-sm leading-6 text-muted">
              <Icon name="info" size={15} className="mt-1 shrink-0" />
              {result.notesVi}
            </p>
          )}
          <p className="text-xs text-muted">Bản dịch và giải thích do AI viết — đối chiếu với nghĩa từ điển ở từng từ.</p>
        </div>
      )}
    </section>
  );
}
