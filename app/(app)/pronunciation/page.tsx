"use client";

/**
 * BẢN ĐỒ TRANG — LUYỆN PHÁT ÂM (/pronunciation) — ghi âm, chấm thanh điệu bằng đồ thị cao độ
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   GET /learn/current       ← useCurrentLesson() ở lib/hooks.ts (← components/practice/practice-library.tsx)
 *                              → server: modules/learn/learn.controller.ts → LearnService.currentLesson()
 *   GET /learn/lessons/:id   ← useLesson() ở lib/hooks.ts (← components/practice/practice-library.tsx)
 *                              → server: modules/learn/learn.controller.ts → LearnService.lesson()
 *   POST /practice/attempts  ← recordPracticeAttempt() ở lib/hooks.ts (← chính trang này)
 *                              → server: modules/practice/practice.controller.ts → PracticeService.record()
 *   GET /practice/stats      ← usePracticeStats() ở lib/hooks.ts (← chính trang này)
 *                              → server: modules/practice/practice.controller.ts → PracticeService.stats()
 *   GET /words               ← useWords() ở lib/hooks.ts (← components/practice/practice-library.tsx)
 *                              → server: modules/vocabulary/vocabulary.controller.ts → WordsService.list()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(app)/layout.tsx.
 */

import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Icon } from "@/components/icon";
import {
  Button,
  Card,
  ErrorNote,
  SectionHeading,
  Spinner,
} from "@/components/ui";
import {
  PracticeLibrary,
  PracticeTips,
} from "@/components/practice/practice-library";
import { useWordAudio } from "@/components/practice/use-word-audio";
import { ToneAnalysis } from "@/components/tone/tone-check";
import { useAuth } from "@/lib/auth";
import { recordPracticeAttempt, usePracticeStats } from "@/lib/hooks";
import type { Word } from "@/lib/types";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionEventLike {
  results: { [index: number]: { [index: number]: SpeechRecognitionAlternativeLike } };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

/** So khớp thô: bỏ khoảng trắng + dấu câu để so văn bản nhận diện với từ gốc. */
function normalizeHanzi(text: string): string {
  return text.replace(/[\s，。！？、,.!?~～]/g, "");
}

function noSubscription() {
  return () => {};
}
function useSpeechRecognitionSupport(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => !!(window.SpeechRecognition ?? window.webkitSpeechRecognition),
    () => false,
  );
}

function PronunciationLibrary() {
  const lessonId = useSearchParams().get("lesson") ?? undefined;
  return (
    <PracticeLibrary
      key={lessonId ?? "free"}
      skill="pronunciation"
      title="Luyện phát âm"
      description="Nghe mẫu, đọc to — Hanni vẽ đường giọng bạn chồng lên giọng chuẩn để chấm thanh điệu."
      startSteps={[
        'Nhấn "Nghe phát âm mẫu" để nghe cách đọc chuẩn của từ.',
        'Nhấn "Bắt đầu ghi âm", đọc theo rồi nhấn dừng khi xong.',
        "Nghe lại giọng của bạn, so sánh với mẫu rồi chuyển từ tiếp theo.",
      ]}
      lessonId={lessonId}
    >
      {(words) => <PronunciationSession words={words} />}
    </PracticeLibrary>
  );
}

export default function PronunciationPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PronunciationLibrary />
    </Suspense>
  );
}

function PronunciationSession({ words }: { words: Word[] }) {
  const [index, setIndex] = useState(0);
  const stats = usePracticeStats("PRONUNCIATION");
  const { user } = useAuth();
  const speechSupported = useSpeechRecognitionSupport();
  const word = words[index];

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_248px]">
      <div className="space-y-5">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-bold tracking-wide text-primary">NGHE MẪU · ĐỌC THỬ</p>
            <span className="shrink-0 rounded-lg bg-primary/8 px-2.5 py-1 text-xs font-semibold tabular-nums text-primary">
              {index + 1} / {words.length}
            </span>
          </div>
          <PronunciationWord
            key={word.id}
            word={word}
            speechSupported={speechSupported}
            onRecorded={(isCorrect) => {
              // Khách luyện thử — không có tài khoản để lưu lượt luyện.
              if (user)
                void recordPracticeAttempt(
                  word.id,
                  "PRONUNCIATION",
                  isCorrect,
                ).then(() => stats.mutate());
            }}
          />
        </Card>
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            <Icon name="back" size={16} />
            Từ trước
          </Button>
          <Button
            disabled={index === words.length - 1}
            onClick={() => setIndex(index + 1)}
          >
            Từ tiếp theo
            <Icon name="arrow" size={16} />
          </Button>
        </div>
      </div>

      <PracticeTips
        title="Một chút tập trung, nhiều tiến bộ"
        tips={[
          "Chọn nơi yên tĩnh và nghe kỹ bản mẫu trước khi ghi âm.",
          "Đọc chậm, rõ âm đầu và giữ đúng cao độ của từng thanh.",
          "Nghe lại giọng của bạn, so sánh với mẫu rồi thử thêm lần nữa.",
        ]}
      >
        <Card>
          <SectionHeading
            icon="sound"
            title="Lắng nghe chính mình"
            tone="good"
          />
          <p className="mt-3 text-sm leading-6 text-muted">
            Sau khi dừng ghi âm, nghe lại giọng của bạn và xem đường cao độ so với giọng mẫu.
            {speechSupported && " Trình duyệt còn có thể kiểm tra bạn đọc đúng từ nào."}
          </p>

        </Card>
        {stats.data && stats.data.totalAttempts > 0 && (
          <Card>
            <SectionHeading
              icon="chart"
              eyebrow="Từ trước đến nay"
              title="Luyện phát âm"
              tone="lavender"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-2xl font-semibold">
                  {stats.data.totalAttempts.toLocaleString("vi-VN")}
                </p>
                <p className="text-xs text-muted">lượt ghi âm</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-primary">
                  {stats.data.accuracyPct ?? "—"}
                  {stats.data.accuracyPct !== null && "%"}
                </p>
                <p className="text-xs text-muted">nhận diện đúng</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              {stats.data.distinctWordsCount.toLocaleString("vi-VN")} từ khác
              nhau đã được luyện.
            </p>
          </Card>
        )}
      </PracticeTips>
    </div>
  );
}

function PronunciationWord({
  word,
  speechSupported,
  onRecorded,
}: {
  word: Word;
  speechSupported: boolean;
  onRecorded: (isCorrect?: boolean) => void;
}) {
  const model = useWordAudio(word.simplified, word.audioUrl);
  const [phase, setPhase] = useState<"idle" | "requesting" | "recording">(
    "idle",
  );
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState<{
    url: string;
    extension: string;
  } | null>(null);
  const [heard, setHeard] = useState<{
    text: string;
    correct: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recordingUrl = useRef<string | null>(null);
  const playback = useRef<HTMLAudioElement | null>(null);
  const mounted = useRef(true);
  const limitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const heardRef = useRef<{ text: string; correct: boolean } | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (limitTimer.current) clearTimeout(limitTimer.current);
      if (recorder.current) {
        recorder.current.ondataavailable = null;
        recorder.current.onstop = null;
        recorder.current.onerror = null;
        if (recorder.current.state !== "inactive") recorder.current.stop();
      }
      stream.current?.getTracks().forEach((track) => track.stop());
      if (recordingUrl.current) URL.revokeObjectURL(recordingUrl.current);
      if (recognition.current) {
        recognition.current.onresult = null;
        recognition.current.onerror = null;
        recognition.current.onend = null;
        try {
          recognition.current.abort();
        } catch {
          /* đã dừng sẵn rồi thì thôi */
        }
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== "recording") return;
    const interval = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  function stopRecording() {
    if (limitTimer.current) clearTimeout(limitTimer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    setPhase("idle");
  }

  async function startRecording() {
    model.stop();
    playback.current?.pause();
    setError(null);
    setHeard(null);
    heardRef.current = null;
    finished.current = false;
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      setError(
        "Trình duyệt chưa hỗ trợ ghi âm ở trang này. Mở Hanni bằng HTTPS trên trình duyệt có hỗ trợ micro.",
      );
      return;
    }
    setPhase("requesting");
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        input.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = input;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const nextRecorder = new MediaRecorder(
        input,
        mimeType ? { mimeType } : undefined,
      );
      recorder.current = nextRecorder;
      const chunks: Blob[] = [];
      nextRecorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      nextRecorder.onstop = () => {
        if (limitTimer.current) clearTimeout(limitTimer.current);
        input.getTracks().forEach((track) => track.stop());
        if (!mounted.current) return;
        setPhase("idle");
        const blob = new Blob(chunks, { type: nextRecorder.mimeType });
        if (!blob.size) {
          setError("Chưa thu được âm thanh. Kiểm tra micro và thử ghi lại.");
          finished.current = true;
          try {
            recognition.current?.abort();
          } catch {
            /* bỏ qua */
          }
          return;
        }
        if (recordingUrl.current) URL.revokeObjectURL(recordingUrl.current);
        const url = URL.createObjectURL(blob);
        recordingUrl.current = url;
        setRecording({
          url,
          extension: blob.type.includes("mp4")
            ? "m4a"
            : blob.type.includes("ogg")
              ? "ogg"
              : "webm",
        });
        if (recognition.current) {
          setTimeout(() => {
            if (finished.current || !mounted.current) return;
            finished.current = true;
            onRecorded(heardRef.current?.correct);
          }, 1500);
          try {
            recognition.current.stop();
          } catch {
            /* onend hoặc timer dự phòng ở trên sẽ tự lo tiếp */
          }
        } else {
          onRecorded(undefined);
        }
      };
      nextRecorder.onerror = () => {
        if (limitTimer.current) clearTimeout(limitTimer.current);
        input.getTracks().forEach((track) => track.stop());
        if (!mounted.current) return;
        setPhase("idle");
        setError("Ghi âm bị gián đoạn. Kiểm tra micro rồi thử lại.");
      };

      const RecognitionCtor =
        window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (RecognitionCtor) {
        const instance = new RecognitionCtor();
        instance.lang = "zh-CN";
        instance.interimResults = false;
        instance.maxAlternatives = 1;
        instance.onresult = (event) => {
          const transcript = event.results[0]?.[0]?.transcript ?? "";
          const result = {
            text: transcript,
            correct:
              normalizeHanzi(transcript) === normalizeHanzi(word.simplified),
          };
          heardRef.current = result;
          if (mounted.current) setHeard(result);
        };
        instance.onerror = () => {
          /* im lặng — vẫn giữ bản ghi âm, chỉ là không chấm được điểm lần này */
        };
        instance.onend = () => {
          if (finished.current || !mounted.current) return;
          finished.current = true;
          onRecorded(heardRef.current?.correct);
        };
        recognition.current = instance;
        try {
          instance.start();
        } catch {
          recognition.current = null;
        }
      } else {
        recognition.current = null;
      }

      nextRecorder.start();
      setSeconds(0);
      setPhase("recording");
      limitTimer.current = setTimeout(stopRecording, 45_000);
    } catch (cause) {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (!mounted.current) return;
      setPhase("idle");
      const denied =
        cause instanceof DOMException && cause.name === "NotAllowedError";
      setError(
        denied
          ? "Chưa có quyền dùng micro. Cho phép micro trong cài đặt trang web rồi thử lại."
          : "Không kết nối được micro. Kiểm tra thiết bị ghi âm và thử lại.",
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid items-center gap-4 rounded-xl border border-border bg-[#fff9f5] p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-5">
        <div className="min-w-0">
          <p lang="zh" className="hanzi break-words text-5xl leading-tight sm:text-6xl">
            {word.simplified}
          </p>
          <p className="mt-1 text-lg font-medium text-primary">{word.pinyin}</p>
          <p className="mt-1 text-sm leading-5 text-muted [overflow-wrap:anywhere]">
            {word.meaningVi ?? word.meaningEn ?? "Nghĩa của từ đang được cập nhật."}
          </p>
        </div>
        <div className="grid min-w-0 gap-2">
          <Button
            variant="secondary"
            disabled={phase !== "idle"}
            onClick={() => {
              playback.current?.pause();
              model.play(0.85);
            }}
          >
            <Icon name="sound" size={17} />
            {model.playing ? "Nghe lại từ đầu" : "Nghe phát âm mẫu"}
          </Button>
          <Button
            className="min-w-0"
            variant={phase === "recording" ? "danger" : "primary"}
            disabled={phase === "requesting"}
            onClick={() => {
              if (phase === "recording") stopRecording();
              else void startRecording();
            }}
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 bg-current ${phase === "recording" ? "rounded-sm motion-safe:animate-pulse" : "rounded-full"}`}
            />
            {phase === "recording"
              ? "Dừng ghi âm"
              : phase === "requesting"
                ? "Đang kết nối micro…"
                : recording
                  ? "Ghi âm lại"
                  : "Bắt đầu ghi âm"}
          </Button>
          {phase !== "idle" && (
            <p role="status" className="text-xs text-muted">
              {phase === "recording"
                ? `Đang ghi · 00:${String(seconds).padStart(2, "0")}`
                : "Đang chờ quyền micro…"}
            </p>
          )}
        </div>
      </div>
      {model.error && <ErrorNote>{model.error}</ErrorNote>}
      {recording && phase === "idle" && (
          <div className="space-y-3 rounded-xl border border-border p-4">
            <audio
              ref={playback}
              key={recording.url}
              controls
              src={recording.url}
              className="w-full"
              aria-label="Nghe lại bản ghi âm của bạn"
              onPlay={() => model.stop()}
            />
            <a
              href={recording.url}
              download={`hanni-phat-am-${word.id}.${recording.extension}`}
              className="inline-flex min-h-9 items-center text-xs font-medium text-primary hover:underline"
            >
              Tải bản ghi về máy
            </a>
            <ToneAnalysis
              recordingUrl={recording.url}
              hanzi={word.simplified}
              pinyin={word.pinyin}
              pinyinNumeric={word.pinyinNumeric}
              audioUrl={word.audioUrl}
            />
            {heard && (
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                  heard.correct
                    ? "bg-good/10 text-good"
                    : "bg-danger/10 text-danger"
                }`}
              >
                <Icon name={heard.correct ? "check" : "close"} size={16} />
                {heard.correct
                  ? "Nhận diện đúng từ này!"
                  : `Trình duyệt nghe ra "${heard.text || "…"}" — thử đọc rõ hơn nhé.`}
              </div>
            )}
            {!heard && speechSupported && (
              <p className="text-xs text-muted">
                Không nhận diện được giọng nói lần này, vẫn tính là một lượt
                luyện.
              </p>
            )}
          </div>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
      <p className="flex items-start gap-2 text-xs leading-5 text-muted">
        <Icon name="lock" size={14} className="mt-0.5 shrink-0" />
        Bản ghi không được gửi lên máy chủ. Bạn có thể tải về trước khi chuyển từ.
      </p>
    </div>
  );
}
