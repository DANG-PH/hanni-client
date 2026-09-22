import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** `/vocabulary` đã gộp vào `/tu-dien` (2 trang trước đó hiển thị cùng dữ
   * liệu). Khai ở đây thay vì dùng `redirect()` trong page component: page
   * nằm trong nhóm `(app)` nên request trực tiếp trả 200 kèm HTML app-shell
   * rồi mới chuyển hướng phía client — kiểm chứng bằng curl thấy status 200,
   * không có Location. Redirect cấp cấu hình trả 308 thật, đúng cho cả bot,
   * trình duyệt lẫn link cũ. */
  async redirects() {
    return [
      { source: "/vocabulary", destination: "/tu-dien", permanent: true },
      // `/grammar` gộp vào `/ngu-phap` cùng lý do: 2 trang cùng dữ liệu,
      // chỉ khác chỗ một cái cần đăng nhập nên Google không đọc được.
      { source: "/grammar", destination: "/ngu-phap", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        /** Mã commit đang chạy thật trên Vercel, để verify được "bản vừa
         * push đã lên chưa" chỉ bằng `curl -I`. Trước đó không có cách nào
         * biết, phải đoán qua hành vi trang — mất thời gian mỗi lần sửa lỗi
         * chỉ tái hiện trên production. Vercel tự đặt VERCEL_GIT_COMMIT_SHA
         * lúc build; chạy local thì là "dev". */
        source: "/:path*",
        headers: [
          {
            key: "x-hanni-commit",
            value: (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7),
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'; connect-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
