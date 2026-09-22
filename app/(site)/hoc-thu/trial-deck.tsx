"use client";

import { savePendingWords } from "@/lib/pending-words";
import Link from "next/link";
import { useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { Icon } from "@/components/icon";
import { Button, LinkButton } from "@/components/ui";
import type { Word } from "@/lib/types";

/**
 * Bộ thẻ học thử — CỐ TÌNH không dùng `components/flashcard.tsx`: thẻ đó gắn
 * với SRS (4 mức đánh giá, gọi API ghi tiến độ, cần đăng nhập). Ở đây chỉ cần
 * lật xem nghĩa, không lưu gì — trộn SRS vào sẽ kéo theo cả auth và làm hỏng
 * đúng điều đang muốn chứng minh: học được ngay, không rào cản.
 */
export function TrialDeck({ words }: { words: Word[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  const word = words[index];
  const isLast = index === words.length - 1;

  if (done) {
    return (
      <section className="panel tint-primary p-7 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Icon name="trophy" size={28} />
        </span>
        <h2 className="mt-4 text-xl font-bold tracking-tight">
          Bạn vừa học {words.length} từ đầu tiên
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">
          Vấn đề là trong vài ngày tới bạn sẽ quên gần hết — đó là chuyện bình
          thường của trí nhớ. Hanni tính sẵn thời điểm bạn sắp quên từng từ và
          nhắc bạn ôn đúng lúc đó, nên số từ nhớ được cứ dày lên thay vì học
          xong rồi rơi rụng.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {/* Ghi lại đúng N từ vừa học TRƯỚC khi sang đăng ký — nếu không
           * thì nút này hứa suông, đăng ký xong chẳng có từ nào được lưu. */}
          <LinkButton
            href="/register"
            onClick={() => savePendingWords(words.map((w) => w.id))}
          >
            Lưu {words.length} từ này vào tài khoản
            <Icon name="arrow" size={16} />
          </LinkButton>
          <Button
            variant="secondary"
            onClick={() => {
              setIndex(0);
              setRevealed(false);
              setDone(false);
            }}
          >
            <Icon name="refresh" size={16} />
            Học lại
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted">
          Toàn bộ nội dung học ở Hanni miễn phí — tài khoản chỉ để lưu tiến độ.
        </p>
        {/* Người chưa muốn đăng ký vẫn phải có đường đi tiếp — đây là trang
         * đích của SEO, cụt ở đây là mất luôn khách. */}
        <p className="mt-3 text-xs text-muted">
          Chưa muốn tạo tài khoản?{" "}
          <Link href="/tu-dien" className="text-primary hover:underline">
            Tra từ điển
          </Link>{" "}
          hoặc{" "}
          <Link href="/ngu-phap" className="text-primary hover:underline">
            xem ngữ pháp
          </Link>{" "}
          — không cần đăng nhập.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-xs text-muted">
        Từ {index + 1}/{words.length}
      </p>

      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        aria-label={`Lật thẻ để xem nghĩa của ${word.simplified}`}
        className="panel hover-card flex min-h-64 w-full flex-col items-center justify-center gap-3 p-8 text-center"
      >
        {/* Ảnh minh hoạ nếu có (Wikimedia Commons) — giúp thẻ đầu tiên người
         * lạ nhìn thấy sinh động hơn hẳn một khối chữ Hán trơ trọi. */}
        {word.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={word.imageUrl}
            alt=""
            loading="lazy"
            className="h-28 w-full rounded-xl object-cover"
          />
        )}
        <span lang="zh" className="hanzi text-6xl text-primary">
          {word.simplified}
        </span>
        <span className="text-sm text-muted">{word.pinyin}</span>

        {revealed ? (
          <>
            <span className="mt-2 text-xl font-bold">
              {word.meaningVi ?? word.meaningEn ?? "Đang cập nhật"}
            </span>
            {word.hanViet && (
              <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                Âm Hán Việt: {word.hanViet}
              </span>
            )}
          </>
        ) : (
          <span className="mt-2 flex items-center gap-2 text-xs text-muted">
            <Icon name="refresh" size={14} />
            Chạm để xem nghĩa
          </span>
        )}
      </button>

      <div className="flex items-center justify-between gap-3">
        <span onClick={(e) => e.stopPropagation()}>
          <AudioButton src={word.audioUrl} />
        </span>
        <Button
          onClick={() => {
            if (isLast) {
              setDone(true);
              return;
            }
            setIndex((i) => i + 1);
            setRevealed(false);
          }}
        >
          {isLast ? "Xem kết quả" : "Từ tiếp theo"}
          <Icon name="arrow" size={16} />
        </Button>
      </div>
    </div>
  );
}
