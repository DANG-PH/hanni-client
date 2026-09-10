"use client";

import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/api";

let activeSpeech: SpeechSynthesisUtterance | null = null;

/** Phát bản thu thật nếu có; giọng đọc trình duyệt chỉ là phương án thay thế. */
export function useWordAudio(text: string, source?: string | null) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const speech = useRef<SpeechSynthesisUtterance | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const url = mediaUrl(source);

  useEffect(() => {
    // Một số trình duyệt chỉ tải danh sách giọng sau lần truy cập đầu tiên.
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    return () => {
      if (audio.current) {
        audio.current.onended = null;
        audio.current.onerror = null;
        audio.current.pause();
        audio.current = null;
      }
      if (speech.current && "speechSynthesis" in window) {
        speech.current.onstart = null;
        speech.current.onend = null;
        speech.current.onerror = null;
        if (activeSpeech === speech.current) {
          window.speechSynthesis.cancel();
          activeSpeech = null;
        }
      }
    };
  }, []);

  function stop() {
    if (audio.current) {
      audio.current.onended = null;
      audio.current.onerror = null;
      audio.current.pause();
      audio.current = null;
    }
    if (speech.current && "speechSynthesis" in window) {
      speech.current.onstart = null;
      speech.current.onend = null;
      speech.current.onerror = null;
      if (activeSpeech === speech.current) {
        window.speechSynthesis.cancel();
        activeSpeech = null;
      }
      speech.current = null;
    }
    setPlaying(false);
  }

  function play(rate = 1) {
    stop();
    setError(null);
    if (url) {
      const player = new Audio(url);
      player.playbackRate = rate;
      player.currentTime = 0;
      player.onended = () => setPlaying(false);
      player.onerror = () => {
        setPlaying(false);
        setError("Chưa phát được bản thu. Kiểm tra kết nối rồi thử lại.");
      };
      audio.current = player;
      setPlaying(true);
      void player
        .play()
        .then(() => {
          if (audio.current === player) setHasPlayed(true);
        })
        .catch(() => {
          if (audio.current !== player) return;
          setPlaying(false);
          setError(
            "Không thể phát âm thanh. Kiểm tra kết nối và quyền phát âm thanh của trình duyệt.",
          );
        });
      return;
    }

    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      setError(
        "Từ này chưa có bản thu và trình duyệt chưa hỗ trợ đọc văn bản. Hãy thử từ khác.",
      );
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((item) => /^zh[-_]CN$/i.test(item.lang)) ??
      voices.find(
        (item) => /^zh\b/i.test(item.lang) && !/HK|TW/i.test(item.lang),
      );
    if (!voice) {
      setError(
        "Chưa có giọng đọc tiếng Trung phổ thông trên thiết bị. Hãy thêm giọng tiếng Trung trong cài đặt giọng nói, hoặc chọn từ có bản thu.",
      );
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = rate;
    utterance.onstart = () => setHasPlayed(true);
    utterance.onend = () => {
      setPlaying(false);
      speech.current = null;
    };
    utterance.onerror = (event) => {
      setPlaying(false);
      speech.current = null;
      if (event.error === "canceled" || event.error === "interrupted") return;
      setError("Giọng đọc chưa sẵn sàng. Hãy nhấn nghe lại hoặc chọn từ khác.");
    };
    window.speechSynthesis.cancel();
    activeSpeech = utterance;
    speech.current = utterance;
    setPlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  return { play, stop, playing, error, hasPlayed, synthetic: !url };
}
