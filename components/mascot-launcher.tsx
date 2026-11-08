"use client";

import { useEffect, useRef, useState } from "react";

/** Thời lượng sáu khung hình của từng cử động trong bộ mascot. */
const CLIPS = {
  blink: [180, 70, 90, 70, 160, 200],
  wave: [160, 120, 160, 160, 120, 180],
  peek: [160, 140, 180, 140, 140, 200],
} as const;
type Clip = keyof typeof CLIPS;
const ORDER: readonly Clip[] = ["blink", "wave", "blink", "peek"];

export function LauncherFox() {
  const [clip, setClip] = useState<Clip>("blink");
  const [frame, setFrame] = useState(0);
  const waveRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decoded = new Map<Clip, Promise<void>>();
    let timer = 0;
    let step = 0;
    let sequence = 0;
    let busy = false;
    let playback = 0;
    let lastStart = -Infinity;

    function canPlay() {
      return !document.hidden && !reduce.matches;
    }

    function schedule(delay = 2600 + Math.random() * 1500) {
      window.clearTimeout(timer);
      if (canPlay()) {
        timer = window.setTimeout(() => void play(ORDER[sequence++ % ORDER.length]), delay);
      }
    }

    async function play(id: Clip) {
      if (busy || !canPlay()) return;
      window.clearTimeout(timer);
      busy = true;
      const currentPlayback = ++playback;
      try {
        let ready = decoded.get(id);
        if (!ready) {
          const sprite = new window.Image();
          sprite.src = `/mascot/launcher-${id}.webp`;
          ready = sprite.decode();
          decoded.set(id, ready);
        }
        await ready;
      } catch {
        decoded.delete(id);
        if (currentPlayback === playback) {
          busy = false;
          schedule();
        }
        return;
      }
      if (currentPlayback !== playback || !canPlay()) return;
      lastStart = performance.now();
      setClip(id);
      setFrame(0);

      let i = 0;
      function tick() {
        i += 1;
        if (i === CLIPS[id].length) {
          busy = false;
          schedule();
          return;
        }
        setFrame(i);
        step = window.setTimeout(tick, CLIPS[id][i]);
      }
      step = window.setTimeout(tick, CLIPS[id][0]);
    }

    function stop() {
      playback += 1;
      window.clearTimeout(timer);
      window.clearTimeout(step);
      busy = false;
    }

    function onAvailabilityChange() {
      stop();
      setClip("blink");
      setFrame(0);
      schedule(1000);
    }

    waveRef.current = () => {
      if (performance.now() - lastStart >= 1600) void play("wave");
    };
    schedule(950);
    document.addEventListener("visibilitychange", onAvailabilityChange);
    reduce.addEventListener("change", onAvailabilityChange);
    return () => {
      stop();
      waveRef.current = () => undefined;
      document.removeEventListener("visibilitychange", onAvailabilityChange);
      reduce.removeEventListener("change", onAvailabilityChange);
    };
  }, []);

  // Căn phần bát đỏ trong sprite vào đúng tâm của nút tròn.
  return (
    <span
      aria-hidden="true"
      onPointerEnter={() => waveRef.current()}
      onPointerDown={() => waveRef.current()}
      className="absolute left-1/2 top-1/2 block h-[137%] w-[137%] -translate-x-1/2 -translate-y-[58.5%] bg-no-repeat drop-shadow-[0_6px_10px_rgb(0_0_0/0.18)]"
      style={{
        backgroundImage: `url(/mascot/launcher-${clip}.webp)`,
        backgroundSize: "600% 100%",
        backgroundPosition: `${frame * 20}% 0`,
      }}
    />
  );
}
