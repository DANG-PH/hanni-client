"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useStreak } from "@/lib/hooks";
import { Brand, Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { Icon } from "./icon";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const streak = useStreak();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-border bg-surface">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 lg:hidden"
          >
            <Icon name="menu" />
          </button>
          <div className="lg:hidden">
            <Brand compact />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {streak.data && (
              <span className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 py-1.5 text-sm font-semibold text-primary">
                <Icon name="flame" size={16} />
                {streak.data.currentStreak}
              </span>
            )}
            <ThemeToggle />
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-surface-2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {user?.displayName?.slice(0, 1).toUpperCase() ?? "H"}
              </span>
              <span className="hidden text-sm leading-tight sm:block">
                <span className="block font-medium">{user?.displayName}</span>
                <span className="block text-[11px] text-muted">
                  {user?.email}
                </span>
              </span>
            </Link>
          </div>
        </header>

        <main className="page-enter flex-1">{children}</main>
      </div>
    </div>
  );
}
