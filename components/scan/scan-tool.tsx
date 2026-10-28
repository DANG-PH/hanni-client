"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { askAssistant } from "@/components/assistant-widget";
import { AudioButton } from "@/components/audio-button";
import { Icon } from "@/components/icon";
import { PremiumModal } from "@/components/premium-modal";
import { Button, ErrorNote, LinkButton } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { addWordToSrs } from "@/lib/hooks";
import { usePremiumStatus } from "@/lib/premium";
import { prepareImage, scanImage, useScanUsage } from "@/lib/scan";
import type { ScanLine, ScanResult, ScanWord } from "@/lib/types";

type Phase =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "done"; result: ScanResult }
  | { kind: "error"; message: string; quota: boolean };

const hskLabel = (level: number) => `HSK ${level >= 7 ? "7–9" : level}`;

/**
 * Quét ảnh học từ: chụp/chọn/dán ảnh → server (Gemini) đọc chữ Hán từng dòng
 * hoặc gọi tên đồ vật, món ăn → mỗi từ bấm được để xem Hán Việt, nghĩa từ
 * điển Hanni, audio và lưu vào ôn tập. Ảnh thu nhỏ ở trình duyệt trước khi
 * gửi; server không lưu ảnh.
 */
export function ScanTool() {
  const { user, loading } = useAuth();
  const usage = useScanUsage(!!user);
  const premium = usePremiumStatus(!!user);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const [pinyin, setPinyin] = useState(true);
  const [selected, setSelected] = useState<{ item: string; wordId: string } | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [upgrade, setUpgrade] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = phase.kind === "scanning";

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  async function onFile(file: File | null | undefined) {
    if (!file || busy) return;
    if (!file.type.startsWith("image/")) {
      setPhase({ kind: "error", quota: false, message: "Chọn một tệp ảnh nhé (JPG, PNG, WEBP hoặc HEIC)." });
      return;
    }
    setPreview(URL.createObjectURL(file));
    setSelected(null);
    setPhase({ kind: "scanning" });
    try {
      const result = await scanImage(await prepareImage(file));
      setSaved(new Set(result.words.filter((w) => w.saved).map((w) => w.id)));
      setPhase({ kind: "done", result });
      void usage.mutate(result.usage, { revalidate: false });
    } catch (err) {
      const quota = err instanceof ApiError && err.status === 403;
      setPhase({
        kind: "error",
        quota,
        message: err instanceof ApiError ? err.message : "Chưa gửi được ảnh — kiểm tra kết nối rồi thử lại.",
      });
      if (quota) void usage.mutate();
    }
  }

  // Dán ảnh chụp màn hình (Ctrl+V) — cách nhanh nhất trên máy tính.
  useEffect(() => {
    if (!user) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (file) void onFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  async function save(ids: string[]) {
    const todo = ids.filter((id) => !saved.has(id) && !saving.has(id));
    if (!todo.length) return;
    setSaving((s) => new Set([...s, ...todo]));
    for (const id of todo) {
      try {
        await addWordToSrs(id);
        setSaved((s) => new Set(s).add(id));
      } catch {
        // Lỗi 1 từ không chặn các từ còn lại; nút vẫn hiện "Lưu" để bấm lại.
      }
    }
    setSaving((s) => new Set([...s].filter((id) => !todo.includes(id))));
  }

  if (loading) return <div className="panel h-40 animate-pulse" />;

  if (!user) {
    return (
      <div className="panel tint-primary p-6 text-center sm:p-8">
        <span className="icon-tile mx-auto">
          <Icon name="camera" />
        </span>
        <h2 className="mt-4 text-lg font-bold">Tạo tài khoản miễn phí để bắt đầu quét</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Mỗi ngày 3 ảnh miễn phí — đủ cho một thực đơn, một biển hiệu. Từ quét được lưu thẳng vào danh sách ôn tập.
        </p>
        <div className="mt-5 grid gap-2 sm:flex sm:justify-center">
          <LinkButton href="/register?next=/tu-dien/quet">Tạo tài khoản miễn phí</LinkButton>
          <LinkButton href="/login?next=/tu-dien/quet" variant="secondary">
            Đăng nhập
          </LinkButton>
        </div>
      </div>
    );
  }

  const u = usage.data;
  const result = phase.kind === "done" ? phase.result : null;
  const byId = new Map(result?.words.map((w) => [w.id, w]));
  const unsaved = result?.words.filter((w) => !saved.has(w.id)).map((w) => w.id) ?? [];

  // Một dòng chữ (text) hoặc một thứ trong ảnh (big, có tên tiếng Việt ở trên); bấm từ thì thẻ từ mở ngay dưới.
  const renderItem = (line: ScanLine, item: string, big: boolean) => {
    const open = selected?.item === item ? selected.wordId : null;
    const word = open ? byId.get(open) : undefined;
    return (
      <li key={item} className="rounded-2xl border border-border p-3.5">
        {big && <p className="text-sm font-semibold">{line.vi}</p>}
        <Tokens
          line={line}
          pinyin={pinyin}
          big={big}
          selected={open}
          onSelect={(wordId) => setSelected(open === wordId ? null : { item, wordId })}
        />
        {!big && line.vi && <p className="mt-1 text-sm leading-6 text-muted">{line.vi}</p>}
        {word && (
          <WordPanel
            word={word}
            saved={saved.has(word.id)}
            saving={saving.has(word.id)}
            onSave={() => void save([word.id])}
          />
        )}
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div
        className="panel p-5 sm:p-6"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFile(e.dataTransfer.files[0]);
        }}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Button onClick={() => cameraRef.current?.click()} disabled={busy}>
            <Icon name="camera" size={18} /> Chụp ảnh
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Icon name="plus" size={18} /> Chọn ảnh có sẵn
          </Button>
          {u && (
            <p className="text-sm text-muted sm:ml-auto">
              {u.premium ? "Premium · " : ""}Hôm nay còn{" "}
              <strong className="text-foreground">{Math.max(0, u.limit - u.used)}</strong>/{u.limit} lượt
            </p>
          )}
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <p className="mt-3 text-xs leading-5 text-muted">
          <span className="hidden sm:inline">Có thể kéo thả hoặc dán ảnh chụp màn hình (Ctrl+V). </span>Ảnh chỉ dùng để
          đọc rồi bỏ, Hanni không lưu lại.
          {u && !u.premium && (
            <>
              {" "}
              <button type="button" onClick={() => setUpgrade(true)} className="font-semibold text-primary hover:underline">
                Premium quét 100 ảnh/ngày
              </button>
            </>
          )}
        </p>
      </div>

      {phase.kind === "error" && (
        <ErrorNote>
          {phase.message}
          {phase.quota && !u?.premium && (
            <>
              {" "}
              <button type="button" onClick={() => setUpgrade(true)} className="font-semibold underline">
                Xem Premium
              </button>
            </>
          )}
        </ErrorNote>
      )}

      {(busy || result) && preview && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob: tạm của người dùng */}
              <img src={preview} alt="Ảnh vừa chọn để quét" className="max-h-[60vh] w-full object-contain" />
              {busy && <div aria-hidden className="scan-sweep absolute inset-x-0 top-0 h-1/3" />}
            </div>
          </div>

          {busy ? (
            <div role="status" className="panel space-y-3 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                Hanni đang đọc ảnh… (khoảng 5–10 giây)
              </p>
              {[88, 72, 80, 64].map((w) => (
                <div key={w} className="h-3 animate-pulse rounded bg-surface-2" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : (
            result && (
              <div className="min-w-0 space-y-5">
                {!result.lines.length && !result.objects.length ? (
                  <div className="panel p-5 text-sm leading-6">
                    Không thấy chữ Hán hay đồ vật nào rõ để học trong ảnh này — lượt này không bị tính. Thử chụp gần và
                    thẳng hơn nhé.
                  </div>
                ) : (
                  <div className="panel space-y-5 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {result.kind.charAt(0).toUpperCase() + result.kind.slice(1)}
                      </span>
                      <span className="text-sm text-muted">
                        {[
                          result.objects.length && `${result.objects.length} thứ trong ảnh`,
                          result.lines.length && `${result.lines.length} dòng chữ`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}{" "}
                        · bấm vào từ để xem nghĩa
                      </span>
                      <button
                        type="button"
                        onClick={() => setPinyin(!pinyin)}
                        aria-pressed={pinyin}
                        className={`ml-auto rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          pinyin ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-surface text-muted"
                        }`}
                      >
                        Pinyin
                      </button>
                    </div>
                    {result.objects.length > 0 && (
                      <div>
                        <h2 className="mb-2 text-sm font-semibold">Trong ảnh có</h2>
                        <ol className="grid items-start gap-3 sm:grid-cols-2">
                          {result.objects.map((line, i) => renderItem(line, `o${i}`, true))}
                        </ol>
                      </div>
                    )}
                    {result.lines.length > 0 && (
                      <div>
                        <h2 className="mb-2 text-sm font-semibold">Chữ trong ảnh</h2>
                        <ol className="space-y-3">{result.lines.map((line, i) => renderItem(line, `l${i}`, false))}</ol>
                      </div>
                    )}
                  </div>
                )}

                {result.words.length > 0 && (
                  <div className="panel p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">Từ vựng trong ảnh ({result.words.length})</h2>
                      {unsaved.length > 0 && (
                        <Button
                          variant="secondary"
                          className="ml-auto"
                          disabled={saving.size > 0}
                          onClick={() => void save(unsaved)}
                        >
                          <Icon name="cards" size={16} />
                          {saving.size > 0 ? "Đang lưu…" : `Lưu ${unsaved.length} từ vào ôn tập`}
                        </Button>
                      )}
                    </div>
                    <ul className="divide-y divide-border">
                      {result.words.map((w) => (
                        <WordRow
                          key={w.id}
                          word={w}
                          saved={saved.has(w.id)}
                          saving={saving.has(w.id)}
                          onSave={() => void save([w.id])}
                        />
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid gap-2 sm:flex">
                  {(result.lines.length > 0 || result.objects.length > 0) && (
                    <Button variant="secondary" onClick={() => askAssistant(assistantText(result))}>
                      <Icon name="spark" size={16} /> Hỏi trợ lý Hanni về ảnh này
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => cameraRef.current?.click()}>
                    <Icon name="camera" size={16} /> Quét ảnh khác
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {upgrade && premium.data && <PremiumModal plans={premium.data.plans} onClose={() => setUpgrade(false)} />}
    </div>
  );
}

function assistantText(r: ScanResult) {
  const parts = [
    r.lines.length && `Chữ trong ảnh:\n${r.lines.map((l) => `${l.zh} — ${l.vi}`).join("\n")}`,
    r.objects.length && `Trong ảnh có: ${r.objects.map((o) => `${o.zh} (${o.vi})`).join(", ")}`,
  ].filter(Boolean);
  return `Mình vừa quét một ảnh (${r.kind}).\n${parts.join("\n")}\n${
    r.lines.length
      ? "Giải thích giúp mình các từ và cấu trúc đáng chú ý trong đó nhé."
      : "Đặt giúp mình vài câu tiếng Trung đơn giản (kèm pinyin, nghĩa) dùng các từ này nhé."
  }`;
}

/** Đoạn ngoài từ điển như "個) 100": pinyin (mỗi chữ Hán 1 âm tiết) chỉ đặt lên phần chữ Hán, số và dấu câu
 * để trơn — không thì "gè" phủ lên cả cụm. */
function splitPlain(text: string, pinyin: string | null) {
  if (!pinyin) return [{ text, pinyin: null }];
  const syllables = pinyin.split(/\s+/);
  let k = 0;
  return text
    .split(/(\p{Script=Han}+)/u)
    .filter(Boolean)
    .map((part) => {
      if (!/\p{Script=Han}/u.test(part)) return { text: part, pinyin: null };
      const n = Array.from(part).length;
      const out = { text: part, pinyin: syllables.slice(k, k + n).join(" ") || null };
      k += n;
      return out;
    });
}

function Tokens({
  line,
  pinyin,
  big,
  selected,
  onSelect,
}: {
  line: ScanLine;
  pinyin: boolean;
  big: boolean;
  selected: string | null;
  onSelect: (wordId: string) => void;
}) {
  return (
    <p lang="zh" className={`hanzi break-words ${big ? "text-2xl" : "text-xl"} ${pinyin ? "leading-[2.3]" : "leading-relaxed"}`}>
      {line.tokens.map((t, i) => {
        const ruby = (part: { text: string; pinyin: string | null }, key?: number) =>
          pinyin && part.pinyin ? (
            <ruby key={key}>
              {part.text}
              <rt className="font-sans text-xs font-normal text-muted">{part.pinyin}</rt>
            </ruby>
          ) : (
            <span key={key}>{part.text}</span>
          );
        if (!t.wordId) return <span key={i}>{splitPlain(t.text, t.pinyin).map((part, j) => ruby(part, j))}</span>;
        const text = ruby(t);
        const wordId = t.wordId;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(wordId)}
            aria-pressed={selected === wordId}
            className={`rounded-md px-0.5 underline decoration-primary/35 decoration-dotted underline-offset-[5px] transition-colors ${
              selected === wordId ? "bg-primary/15 text-primary" : "hover:bg-primary/10"
            }`}
          >
            {text}
          </button>
        );
      })}
    </p>
  );
}

function SaveButton({ saved, saving, onSave }: { saved: boolean; saving: boolean; onSave: () => void }) {
  if (saved)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-good">
        <Icon name="check" size={14} /> Đã lưu
      </span>
    );
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saving}
      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
    >
      <Icon name="plus" size={14} /> {saving ? "Đang lưu…" : "Lưu ôn tập"}
    </button>
  );
}

function WordPanel({ word, saved, saving, onSave }: { word: ScanWord; saved: boolean; saving: boolean; onSave: () => void }) {
  return (
    <div className="mt-3 rounded-xl bg-surface-2/70 p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span lang="zh" className="hanzi text-2xl">
          {word.simplified}
        </span>
        {word.traditional && word.traditional !== word.simplified && (
          <span lang="zh" className="hanzi text-lg text-muted">
            {word.traditional}
          </span>
        )}
        <span className="text-sm text-muted">{word.pinyin}</span>
        <AudioButton src={word.audioUrl} size={16} />
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">{hskLabel(word.hskLevel)}</span>
      </div>
      {word.hanViet && (
        <p className="mt-1.5 text-sm">
          Hán Việt: <strong className="text-hanviet">{word.hanViet}</strong>
          {word.familiar && (
            <span className="ml-2 rounded-full bg-good/10 px-2 py-0.5 text-xs font-semibold text-good">
              Trùng nghĩa tiếng Việt
            </span>
          )}
        </p>
      )}
      {word.meaningVi && <p className="mt-1 text-sm leading-6 text-muted">{word.meaningVi}</p>}
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <SaveButton saved={saved} saving={saving} onSave={onSave} />
        <Link href={`/tu-dien/${encodeURIComponent(word.simplified)}`} className="inline-flex min-h-8 items-center text-xs font-semibold text-primary hover:underline">
          Xem trong từ điển
        </Link>
      </div>
    </div>
  );
}

function WordRow({ word, saved, saving, onSave }: { word: ScanWord; saved: boolean; saving: boolean; onSave: () => void }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <AudioButton src={word.audioUrl} size={16} />
      <Link href={`/tu-dien/${encodeURIComponent(word.simplified)}`} className="min-w-0 flex-1 hover:text-primary">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span lang="zh" className="hanzi text-lg">
            {word.simplified}
          </span>
          <span className="text-xs text-muted">{word.pinyin}</span>
          {word.hanViet && <span className="text-xs font-semibold text-hanviet">{word.hanViet}</span>}
          {word.familiar && <span className="text-xs font-semibold text-good">· quen nhờ Hán Việt</span>}
        </span>
        <span className="block truncate text-xs text-muted">
          {hskLabel(word.hskLevel)} · {word.meaningVi}
        </span>
      </Link>
      <SaveButton saved={saved} saving={saving} onSave={onSave} />
    </li>
  );
}
