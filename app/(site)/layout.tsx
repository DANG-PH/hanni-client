import type { ReactNode } from "react";
import { Nav } from "@/components/nav";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border text-xs text-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-x-4 gap-y-1 px-5 py-7">
          <span>
            © {new Date().getFullYear()} Hanni · Mỗi ngày một chút, tiến xa hơn.
          </span>
          <a href="/nguon-du-lieu" className="hover:text-primary">
            Nguồn dữ liệu
          </a>
        </div>
      </footer>
    </div>
  );
}
