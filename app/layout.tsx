import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { PwaRuntime } from "@/components/pwa/pwa-runtime";
import { ConnectivityNotice } from "@/components/pwa/connectivity-notice";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Hanni — Học tiếng Trung theo HSK 3.0";
const description =
  "Học từ vựng tiếng Trung theo chuẩn HSK 3.0 (9 cấp) với lộ trình theo bài, flashcard lặp lại ngắt quãng, theo dõi tiến độ và streak.";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
  title,
  description,
  openGraph: {
    type: "website",
    siteName: "Hanni",
    title,
    description,
    images: [
      {
        url: "/themes.png",
        width: 1672,
        height: 941,
        alt: "Hanni — Nền tảng học tiếng Trung",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/themes.png"],
  },
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
        <PwaRuntime />
        <ConnectivityNotice />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
