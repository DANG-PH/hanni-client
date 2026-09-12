"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

interface CredentialResponse {
  credential?: string;
}
interface GoogleAccountsId {
  initialize: (opts: {
    client_id: string;
    callback: (res: CredentialResponse) => void;
  }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = GSI_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () =>
        reject(new Error("Không tải được Google Identity Services"));
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * Nút "Đăng nhập với Google" dùng Google Identity Services.
 * Lấy id_token phía client rồi gửi về POST /auth/google (backend verify, không cần secret).
 */
export function GoogleButton({
  onSuccess,
  onError,
  mode = "signin",
}: {
  onSuccess: (isNewUser: boolean) => void;
  onError?: (message: string) => void;
  mode?: "signin" | "signup";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    const container = ref.current;
    if (!CLIENT_ID || !container) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    let resizeFrame = 0;
    let renderedWidth = 0;

    void loadGsi()
      .then(() => {
        if (cancelled) return;
        const gid = window.google?.accounts?.id;
        if (!gid) return;

        gid.initialize({
          client_id: CLIENT_ID,
          callback: (res) => {
            if (cancelled || !res.credential) return;
            void api
              .post<{ isNewUser: boolean }>("/auth/google", {
                idToken: res.credential,
              })
              .then((r) => {
                if (!cancelled) onSuccessRef.current(r.isNewUser);
              })
              .catch((e) => {
                if (cancelled) return;
                const message =
                  e instanceof ApiError
                    ? e.message
                    : "Đăng nhập Google thất bại";
                // Hai nút cùng tồn tại khi trượt; lỗi phải hiện ở form đang mở.
                if (onErrorRef.current) onErrorRef.current(message);
                else setError(message);
              });
          },
        });

        const render = (availableWidth: number) => {
          const width = Math.min(400, Math.floor(availableWidth));
          if (cancelled || width <= 0 || width === renderedWidth) return;

          renderedWidth = width;
          container.replaceChildren();
          gid.renderButton(container, {
            type: "standard",
            theme: "outline",
            size: "medium",
            text: mode === "signup" ? "signup_with" : "signin_with",
            shape: "pill",
            logo_alignment: "center",
            // GIS tự tính kích thước iframe; ép max-width bằng CSS sẽ cắt viền nút.
            width,
          });
        };

        const style = getComputedStyle(container);
        render(
          container.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight),
        );
        resizeObserver = new ResizeObserver(([entry]) => {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(() =>
            render(entry.contentRect.width),
          );
        });
        resizeObserver.observe(container);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được Google Identity Services");
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      cancelAnimationFrame(resizeFrame);
      container.replaceChildren();
    };
  }, [mode]);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-2">
      <div ref={ref} className="google-button flex w-full justify-center" />
      {error && <p className="text-center text-xs text-danger">{error}</p>}
    </div>
  );
}
