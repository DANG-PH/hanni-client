import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Hanni",
  appleWebApp: { capable: true, title: "Hanni", statusBarStyle: "default" },
  icons: {
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  formatDetection: { telephone: false },
  title: "Hanni — Học tiếng Trung theo HSK 3.0",
  description:
    "Học từ vựng tiếng Trung theo chuẩn HSK 3.0 (9 cấp) với lộ trình theo bài, flashcard lặp lại ngắt quãng, theo dõi tiến độ và streak.",
};

export const viewport: Viewport = { themeColor: "#dc3526" };

// Đặt data-theme trước khi React hydrate để không nháy màu.
const THEME_INIT = `try{var t=localStorage.getItem('hanni-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
