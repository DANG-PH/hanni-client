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
  mode = "signin",
}: {
  onSuccess: (isNewUser: boolean) => void;
  mode?: "signin" | "signup";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!CLIENT_ID) {
      return;
    }
    let cancelled = false;
    void loadGsi()
      .then(() => {
        if (cancelled || !ref.current) return;
        const gid = window.google?.accounts?.id;
        if (!gid) return;
        ref.current.replaceChildren();
        gid.initialize({
          client_id: CLIENT_ID,
          callback: (res) => {
            if (!res.credential) return;
            void api
              .post<{ isNewUser: boolean }>("/auth/google", {
                idToken: res.credential,
              })
              .then((r) => onSuccessRef.current(r.isNewUser))
              .catch((e) =>
                setError(
                  e instanceof ApiError
                    ? e.message
                    : "Đăng nhập Google thất bại",
                ),
              );
          },
        });
        gid.renderButton(ref.current, {
          type: "standard",
          theme: "outline",
          size: "medium",
          text: mode === "signup" ? "signup_with" : "signin_with",
          shape: "pill",
          logo_alignment: "center",
          width: Math.min(400, ref.current.clientWidth),
        });
      })
      .catch(() => setError("Không tải được Google Identity Services"));
    return () => {
      cancelled = true;
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
