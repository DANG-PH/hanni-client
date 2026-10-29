/**
 * Pháo giấy màu Hanni bắn từ 2 góc dưới lên, ~2 giây rồi tự gỡ canvas. Chỉ dùng cho khoảnh khắc hiếm (xong bài, thi
 * đạt, cột mốc chuỗi ngày) — bắn ở mọi chỗ thì thành hình nền. Máy bật giảm chuyển động thì bỏ qua.
 */
const COLORS = ["#dc3526", "#f0b429", "#e3b25c", "#2f8f5b", "#ffffff", "#f27a6b"];

export function confetti(pieces = 110) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "70",
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();
  ctx.scale(dpr, dpr);

  const parts = Array.from({ length: pieces }, (_, i) => {
    const left = i % 2 === 0;
    const angle = (left ? -60 : -120) + (Math.random() - 0.5) * 40;
    const speed = (0.7 + Math.random() * 0.5) * Math.sqrt(h) * 0.85;
    return {
      x: left ? w * 0.08 : w * 0.92,
      y: h + 10,
      vx: Math.cos((angle * Math.PI) / 180) * speed,
      vy: Math.sin((angle * Math.PI) / 180) * speed,
      size: 6 + Math.random() * 6,
      spin: Math.random() * Math.PI,
      vspin: (Math.random() - 0.5) * 0.3,
      color: COLORS[i % COLORS.length],
      round: Math.random() < 0.3,
    };
  });

  const start = performance.now();
  let last = start;
  function frame(now: number) {
    const t = now - start;
    // Tính theo khung 60 Hz để màn 120 Hz không bắn nhanh gấp đôi.
    const k = Math.min(3, (now - last) / 16.7);
    last = now;
    ctx!.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.vy += 0.32 * k;
      p.vx *= 0.985 ** k;
      p.vy *= 0.985 ** k;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.spin += p.vspin * k;
      ctx!.save();
      ctx!.globalAlpha = Math.max(0, 1 - Math.max(0, t - 1400) / 600);
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.spin);
      ctx!.fillStyle = p.color;
      if (p.round) {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
        ctx!.fill();
      } else {
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx!.restore();
    }
    if (t < 2000) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
