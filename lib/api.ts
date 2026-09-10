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

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
