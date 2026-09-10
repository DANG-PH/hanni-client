"use client";

import { useEffect, useRef, type ReactNode } from "react";

const TARGETS = ".reveal, .reveal-group > *";

/** Hiện một lần khi vào vùng nhìn; theo dõi cả nội dung nạp sau từ API. */
export function PageMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    // HTML vẫn hiện bình thường nếu trình duyệt không hỗ trợ observer.
    if (!root || !("IntersectionObserver" in window)) return;

    const registered = new WeakSet<HTMLElement>();
    const show = (element: HTMLElement, delay = 0) => {
      element.style.setProperty("--reveal-delay", `${delay}ms`);
      element.dataset.revealState = "visible";
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const groups = new Map<Element | null, number>();
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          const group = element.parentElement;
          const index = groups.get(group) ?? 0;
          show(element, Math.min(index * 80, 320));
          groups.set(group, index + 1);
        }
      },
      { threshold: 0.08 },
    );

    function register(container: HTMLElement) {
      const candidates = [
        ...(container.matches(TARGETS) ? [container] : []),
        ...container.querySelectorAll<HTMLElement>(TARGETS),
      ];
      const groups = new Map<Element | null, number>();
      for (const element of candidates) {
        if (registered.has(element)) continue;
        // Một khối đã reveal thì không chạy thêm hiệu ứng lồng ở bên trong.
        if (element.parentElement?.closest(TARGETS)) continue;
        registered.add(element);
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          // Giữ nội dung ẩn theo breakpoint an toàn khi đổi kích thước màn hình.
          continue;
        }
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const index = groups.get(element.parentElement) ?? 0;
          show(element, Math.min(index * 80, 320));
          groups.set(element.parentElement, index + 1);
        } else {
          element.dataset.revealState = "pending";
          observer.observe(element);
        }
      }
    }

    register(root);
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.removedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          observer.unobserve(node);
          node
            .querySelectorAll<HTMLElement>(TARGETS)
            .forEach((el) => observer.unobserve(el));
        }
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) register(node);
        }
      }
    });
    mutations.observe(root, { childList: true, subtree: true });

    function onFocus(event: FocusEvent) {
      if (!(event.target instanceof HTMLElement)) return;
      const element = event.target.closest<HTMLElement>("[data-reveal-state]");
      if (element) {
        show(element);
        // Tab đến đâu thấy ngay đến đó, kể cả trước khi cuộn/reveal kết thúc.
        element.dataset.revealState = "focused";
      }
    }
    root.addEventListener("focusin", onFocus);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      root.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <div ref={rootRef} className="page-enter">
      {children}
    </div>
  );
}
