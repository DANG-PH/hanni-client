/** Chỉ chấp nhận đường dẫn nội bộ để quay lại bài học sau đăng nhập. */
export function safeNextPath(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return "/dashboard";
  try {
    const target = new URL(value, "https://hanni.local");
    if (
      target.origin !== "https://hanni.local" ||
      /^\/(login|register|auth|forgot-password|reset-password)(\/|$)/.test(
        target.pathname,
      )
    )
      return "/dashboard";
    return target.pathname + target.search + target.hash;
  } catch {
    return "/dashboard";
  }
}
