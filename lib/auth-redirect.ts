/** Trang chủ sau đăng nhập — lộ trình (dashboard đã gộp vào đây). */
export const HOME_PATH = "/learn";

/** Chỉ chấp nhận đường dẫn nội bộ để quay lại bài học sau đăng nhập. */
export function safeNextPath(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return HOME_PATH;
  try {
    const target = new URL(value, "https://hanni.local");
    if (
      target.origin !== "https://hanni.local" ||
      /^\/(login|register|auth|forgot-password|reset-password)(\/|$)/.test(
        target.pathname,
      )
    )
      return HOME_PATH;
    return target.pathname + target.search + target.hash;
  } catch {
    return HOME_PATH;
  }
}
