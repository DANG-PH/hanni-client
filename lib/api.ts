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

/**
 * Gọi `/auth/refresh` DÙNG CHUNG cho mọi request đang chờ, thay vì mỗi
 * request tự gọi một lần.
 *
 * Đo production 2026-09-22: 661 lần server báo "phát hiện dùng lại refresh
 * token" với chỉ 6 người dùng thật — mỗi lần là một lần ĐĂNG XUẤT OAN. Một
 * trang như dashboard bắn cả chục request SWR song song; access token hết
 * hạn thì tất cả cùng 401 rồi cùng gọi /auth/refresh với CÙNG một cookie.
 * Request đầu xoay token thành công, những request sau mang token vừa bị
 * revoke tới nên bị coi là bị đánh cắp.
 *
 * Giữ 1 promise dùng chung: request nào tới sau thì ĐỢI kết quả của lượt
 * refresh đang chạy. (Server cũng đã thêm cửa sổ ân hạn cho trường hợp
 * nhiều tab/thiết bị mà client không kiểm soát được — xem TokenService.)
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const started = (async () => {
    try {
      const r = await raw("/auth/refresh", { method: "POST" });
      return r.ok;
    } catch {
      return false;
    }
  })();
  refreshInFlight = started;
  void started.finally(() => {
    if (refreshInFlight === started) refreshInFlight = null;
  });
  return started;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  let res = await raw(path, opts);

  if (res.status === 401 && !opts._retried && !path.startsWith("/auth/")) {
    if (await refreshSession()) {
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
  if (res.status === 401 && (await refreshSession())) {
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
  del: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "DELETE", body }),
  upload: <T>(path: string, form: FormData) => apiUpload<T>(path, form),
};
