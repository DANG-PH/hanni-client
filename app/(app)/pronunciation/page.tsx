"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { Button, Card, ErrorNote } from "@/components/ui";
import {
  PracticeLibrary,
  PracticeTips,
} from "@/components/practice/practice-library";
import { useWordAudio } from "@/components/practice/use-word-audio";
import type { Word } from "@/lib/types";

export default function PronunciationPage() {
  return (
    <PracticeLibrary
      skill="pronunciation"
      title="Tự tin cất tiếng, chuẩn từng âm"
      description="Nghe mẫu, ghi âm giọng của bạn và nghe lại để luyện âm đầu, âm cuối cùng bốn thanh điệu."
      startSteps={[
        "Chọn cấp HSK phù hợp ở trên rồi nhấn Bắt đầu.",
        "Nhấn \"Nghe phát âm mẫu\" để nghe cách đọc chuẩn của từ.",
        "Nhấn \"Bắt đầu ghi âm\", đọc theo rồi nhấn dừng khi xong.",
        "Nghe lại giọng của bạn, so sánh với mẫu rồi chuyển từ tiếp theo.",
      ]}
    >
      {(words) => <PronunciationSession words={words} />}
    </PracticeLibrary>
  );
}

function PronunciationSession({ words }: { words: Word[] }) {
  const [index, setIndex] = useState(0);
  const word = words[index];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <Card>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">NGHE · ĐỌC · SO SÁNH</p>
              <h2 className="mt-1 font-semibold">Phòng luyện phát âm</h2>
            </div>
            <span className="rounded-lg bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
              {index + 1} / {words.length}
            </span>
          </div>
          <PronunciationWord key={word.id} word={word} />
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
          <span className="icon-tile mb-4">
            <Icon name="sound" size={22} />
          </span>
          <h2 className="font-semibold">Lắng nghe chính mình</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            So sánh bản thu với âm mẫu để tự điều chỉnh. Bài luyện này chưa có
            chức năng chấm điểm phát âm tự động.
          </p>
          <div className="mt-5 rounded-xl bg-primary/5 px-4 py-3 text-xs leading-5 text-primary">
            Mỗi lần luyện là một cơ hội nói tự nhiên hơn.
          </div>
        </Card>
      </PracticeTips>
    </div>
  );
}

function PronunciationWord({ word }: { word: Word }) {
  const model = useWordAudio(word.simplified, word.audioUrl);
  const [phase, setPhase] = useState<"idle" | "requesting" | "recording">(
    "idle",
  );
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState<{
    url: string;
    extension: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recordingUrl = useRef<string | null>(null);
  const playback = useRef<HTMLAudioElement | null>(null);
  const mounted = useRef(true);
  const limitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      };
      nextRecorder.onerror = () => {
        if (limitTimer.current) clearTimeout(limitTimer.current);
        input.getTracks().forEach((track) => track.stop());
        if (!mounted.current) return;
        setPhase("idle");
        setError("Ghi âm bị gián đoạn. Kiểm tra micro rồi thử lại.");
      };
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
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-surface-2/60 px-5 py-10 text-center sm:py-12">
        <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-muted">
          HSK {word.hskLevel}
        </span>
        <p
          lang="zh"
          className="hanzi mt-6 break-all text-6xl leading-tight sm:text-7xl"
        >
          {word.simplified}
        </p>
        <p className="mt-4 text-xl font-medium text-primary">{word.pinyin}</p>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
          {word.meaningVi ??
            word.meaningEn ??
            "Nghĩa của từ đang được cập nhật."}
        </p>
        <Button
          variant="secondary"
          className="mt-6"
          disabled={phase !== "idle"}
          onClick={() => {
            playback.current?.pause();
            model.play(0.85);
          }}
        >
          <Icon name="sound" size={17} />
          {model.playing ? "Nghe lại từ đầu" : "Nghe phát âm mẫu"}
        </Button>
        <p className="mt-3 text-[11px] text-muted">
          {model.synthetic
            ? "Giọng đọc tiếng Trung của thiết bị"
            : "Bản thu phát âm từ thư viện"}
        </p>
      </div>
      {model.error && <ErrorNote>{model.error}</ErrorNote>}

      <div className="rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Bản ghi âm của bạn</h3>
          <span
            role="status"
            className={`text-xs ${phase === "recording" ? "text-primary" : "text-muted"}`}
          >
            {phase === "recording"
              ? `Đang ghi · 00:${String(seconds).padStart(2, "0")}`
              : phase === "requesting"
                ? "Đang chờ quyền micro…"
                : "Tối đa 45 giây"}
          </span>
        </div>
        {recording && phase === "idle" ? (
          <div className="mt-4 space-y-3">
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
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-muted">
            {phase === "recording"
              ? "Hãy đọc từ phía trên. Nhấn dừng khi bạn đã đọc xong."
              : "Nhấn bắt đầu và cho phép sử dụng micro để luyện nói."}
          </p>
        )}
        <Button
          className="mt-5 w-full"
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
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      <p className="flex items-start gap-2 text-xs leading-5 text-muted">
        <Icon name="lock" size={14} className="mt-0.5 shrink-0" />
        Bản ghi chỉ có trong trang đang mở, không được gửi lên máy chủ. Tải về
        nếu muốn giữ lại trước khi chuyển từ.
      </p>
    </div>
  );
}
