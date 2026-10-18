"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { Button, ErrorNote } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { checkSentence, type SentenceCheckResult } from "@/lib/ai-tools";
import { recognizerCtor, useCanRecognize, type Recognizer } from "@/lib/speech";

const MAX = 120;

function tone(score: number) {
  if (score >= 90) return { label: "Câu đúng và tự nhiên", cls: "text-good", bg: "bg-good/10" };
  if (score >= 60) return { label: "Gần đúng — còn lỗi nhỏ", cls: "text-accent", bg: "bg-accent/10" };
  return { label: "Cần sửa", cls: "text-danger", bg: "bg-danger/10" };
}

/**
 * "Đặt câu với từ này" — học viên tự viết (hoặc nói) 1 câu, AI chấm: điểm, câu đã sửa giữ ý,
 * nghĩa, nhận xét tiếng Việt. Viết câu là bước nhớ từ sâu nhất mà flashcard không luyện được,
 * cũng là nền cho phần viết HSK 4 trở lên.
 */
export function SentencePractice({ word }: { word: { id: string; simplified: string; meaningVi: string | null } }) {
  const { user, loading } = useAuth();
  const path = usePathname();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SentenceCheckResult | null>(null);
  const canSpeak = useCanRecognize();
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognizer | null>(null);

  useEffect(() => () => rec.current?.abort(), []);

  function listen() {
    const Ctor = recognizerCtor();
    if (!Ctor || listening) return;
    const r = new Ctor();
    r.lang = "zh-CN";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => setText((e.results[0]?.[0]?.transcript ?? "").slice(0, MAX));
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  }

  async function submit() {
    const s = text.trim();
    if (!s || busy) return;
    if (!/\p{Script=Han}/u.test(s)) {
      setError("Viết câu bằng chữ Hán nhé (bật bộ gõ tiếng Trung hoặc bấm micro để nói).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setResult(await checkSentence(word.id, s));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chưa chấm được câu này, thử lại nhé.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;
  const same = result && result.corrected.replace(/[。.!！?？\s]/g, "") === result.sentence.replace(/[。.!！?？\s]/g, "");
  const t = result ? tone(result.score) : null;

  return (
    <section aria-label={`Đặt câu với ${word.simplified}`} className="rounded-2xl border border-border p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon name="pencil" size={16} className="text-primary" />
        Đặt câu với <span lang="zh" className="hanzi text-base">{word.simplified}</span>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">AI chấm</span>
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted">
        Tự viết 1 câu dùng từ này{word.meaningVi ? ` (${word.meaningVi.split(";")[0]})` : ""} — AI sửa lỗi và giải thích bằng tiếng Việt.
      </p>
      {user ? (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              lang="zh"
              rows={2}
              value={text}
              maxLength={MAX}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Ví dụ: 我每天用${word.simplified}…`}
              className="field hanzi block min-h-11 min-w-0 flex-1 resize-none py-2.5 text-base leading-7"
            />
            {canSpeak && (
              <button
                type="button"
                onClick={listen}
                aria-label={listening ? "Đang nghe" : "Nói câu bằng giọng"}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${listening ? "animate-pulse bg-primary text-primary-fg" : "bg-surface-2 text-primary"}`}
              >
                <Icon name="mic" size={18} />
              </button>
            )}
          </div>
          <Button type="submit" className="mt-2.5" disabled={busy || !text.trim()}>
            <Icon name="spark" size={16} />
            {busy ? "AI đang chấm…" : "AI chấm câu"}
          </Button>
        </form>
      ) : (
        <a
          href={`/login?next=${encodeURIComponent(path)}`}
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold hover:text-primary"
        >
          Đăng nhập để AI chấm câu của bạn
          <Icon name="arrow" size={15} />
        </a>
      )}
      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      {result && t && (
        <div className="mt-4 space-y-3 rounded-xl bg-surface-2/60 p-3.5">
          <p className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${t.bg} ${t.cls}`}>
            <span>{t.label}</span>
            <span className="tabular-nums">{result.score}/100</span>
          </p>
          {!result.usesWord && (
            <p className="text-xs text-danger">Câu của bạn chưa dùng từ {word.simplified} — thử lại với từ này nhé.</p>
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{same ? "Câu của bạn" : "Câu đã sửa"}</p>
            <p lang="zh" className="hanzi mt-0.5 text-lg">{result.corrected}</p>
            <p className="text-xs text-muted">{result.pinyin}</p>
            <p className="mt-0.5 text-sm">{result.translationVi}</p>
            {!same && (
              <p className="mt-1 text-xs text-muted">
                Bạn viết: <span lang="zh" className="hanzi line-through decoration-danger/60">{result.sentence}</span>
              </p>
            )}
          </div>
          <p className="text-sm leading-6">{result.explanationVi}</p>
          {result.tipVi && (
            <p className="flex gap-2 text-xs leading-5 text-muted">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              {result.tipVi}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
