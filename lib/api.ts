/**
 * Lớp gọi API tập trung. Mọi request đều `credentials: 'include'` để gửi cookie phiên.
 * Tự động refresh access token 1 lần khi gặp 401.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** nội bộ: đánh dấu đã thử refresh để không lặp vô hạn */
  _retried?: boolean;
}

async function raw(path: string, opts: RequestOptions = {}): Promise<Response> {
  const { body, _retried, headers, ...rest } = opts;
  return fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  let res = await raw(path, opts);

  if (
    res.status === 401 &&
    !opts._retried &&
    !path.startsWith("/auth/")
  ) {
    const refresh = await raw("/auth/refresh", { method: "POST" });
    if (refresh.ok) {
      res = await raw(path, { ...opts, _retried: true });
    }
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message)
        : res.statusText) || "Lỗi không xác định";
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Gốc của server (bỏ "/api") — dùng cho file tĩnh như audio phát âm. */
export const SERVER_ORIGIN =
  API_BASE.replace(/\/api\/?$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

/** Tuyệt đối hoá đường dẫn tĩnh, vd "/media/audio/cmn-你好.mp3" hoặc URL Google. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${SERVER_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Upload multipart (FormData) — không set Content-Type để trình duyệt tự thêm boundary. */
async function apiUpload<T = unknown>(
  path: string,
  form: FormData,
): Promise<T> {
  let res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (res.status === 401) {
    const r = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (r.ok)
      res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message)
        : res.statusText;
    throw new ApiError(res.status, msg || "Tải lên thất bại", data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData) => apiUpload<T>(path, form),
};
