import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Nav } from "@/components/nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hanni — Học tiếng Trung theo HSK 3.0",
  description:
    "Học từ vựng tiếng Trung theo chuẩn HSK 3.0 (9 cấp) với flashcard lặp lại ngắt quãng, theo dõi tiến độ và streak.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <Nav />
          <main className="flex-1 w-full">{children}</main>
          <footer className="border-t border-border text-xs text-muted">
            <div className="mx-auto max-w-5xl px-4 py-6 flex flex-wrap gap-x-4 gap-y-1 justify-between">
              <span>© {new Date().getFullYear()} Hanni</span>
              <a href="/nguon-du-lieu" className="hover:text-foreground underline">
                Nguồn dữ liệu
              </a>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
