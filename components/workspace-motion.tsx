"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./workspace-motion.module.css";

const REVEAL_TARGETS =
  ".reveal, .reveal-group > *, .page-wrap > header, .learning-workspace > header";

/** Progressive enhancement, limited to the signed-in learning workspace. */
export function WorkspaceMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let registered = new WeakSet<HTMLElement>();
    let activeCard: HTMLElement | null = null;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          if (reducedMotion.matches) return;
          const groups = new Map<Element | null, number>();
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const element = entry.target as HTMLElement;
            const index = groups.get(element.parentElement) ?? 0;
            element.style.setProperty("--workspace-delay", `${Math.min(index, 4) * 65}ms`);
            element.dataset.workspaceReveal = "visible";
            groups.set(element.parentElement, index + 1);
            observer?.unobserve(element);
          }
        }, { threshold: 0, rootMargin: "0px 0px -24px 0px" })
      : null;

    function register(container: HTMLElement) {
      if (reducedMotion.matches) return;
      const candidates = [
        ...(container.matches(REVEAL_TARGETS) ? [container] : []),
        ...container.querySelectorAll<HTMLElement>(REVEAL_TARGETS),
      ];
      for (const element of candidates) {
        if (registered.has(element)) continue;
        // Avoid double entrances, and never transform modal/fixed containers.
        if (element.parentElement?.closest(REVEAL_TARGETS) ||
            element.closest("dialog, [aria-modal='true']") ||
            element.querySelector("dialog, [aria-modal='true']")) continue;
        registered.add(element);
        observer?.observe(element);
      }
    }

    function resetDepth() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!activeCard) return;
      for (const property of ["--depth-rx", "--depth-ry", "--depth-x", "--depth-y"]) {
        activeCard.style.removeProperty(property);
      }
      activeCard = null;
    }

    function updateDepth() {
      frame = 0;
      if (!activeCard?.isConnected) return;
      const rect = activeCard.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(1, (pointerX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (pointerY - rect.top) / rect.height));
      activeCard.style.setProperty("--depth-rx", `${((0.5 - y) * 6).toFixed(2)}deg`);
      activeCard.style.setProperty("--depth-ry", `${((x - 0.5) * 6).toFixed(2)}deg`);
      activeCard.style.setProperty("--depth-x", `${(x * 100).toFixed(1)}%`);
      activeCard.style.setProperty("--depth-y", `${(y * 100).toFixed(1)}%`);
    }

    function onPointerMove(event: PointerEvent) {
      if (reducedMotion.matches || !finePointer.matches || event.pointerType === "touch") return;
      const card = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-depth]") : null;
      if (card !== activeCard) {
        resetDepth();
        activeCard = card;
      }
      if (!activeCard) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(updateDepth);
    }

    function onFocus(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-workspace-reveal]");
      if (element) element.dataset.workspaceReveal = "focused";
    }

    function onPreferenceChange() {
      resetDepth();
      if (reducedMotion.matches) {
        observer?.disconnect();
        registered = new WeakSet<HTMLElement>();
        root?.querySelectorAll<HTMLElement>("[data-workspace-reveal]").forEach((element) => {
          element.removeAttribute("data-workspace-reveal");
        });
      } else if (root) {
        register(root);
      }
    }

    register(root);
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.removedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          observer?.unobserve(node);
          node.querySelectorAll(REVEAL_TARGETS).forEach((element) => observer?.unobserve(element));
          if (activeCard && node.contains(activeCard)) resetDepth();
        }
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) register(node);
        }
      }
    });
    mutations.observe(root, { childList: true, subtree: true });
    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", resetDepth);
    root.addEventListener("pointercancel", resetDepth);
    root.addEventListener("focusin", onFocus);
    window.addEventListener("blur", resetDepth);
    reducedMotion.addEventListener("change", onPreferenceChange);
    finePointer.addEventListener("change", resetDepth);

    return () => {
      observer?.disconnect();
      mutations.disconnect();
      resetDepth();
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", resetDepth);
      root.removeEventListener("pointercancel", resetDepth);
      root.removeEventListener("focusin", onFocus);
      window.removeEventListener("blur", resetDepth);
      reducedMotion.removeEventListener("change", onPreferenceChange);
      finePointer.removeEventListener("change", resetDepth);
    };
  }, []);

  return <div ref={rootRef} className={styles.content}>{children}</div>;
}
