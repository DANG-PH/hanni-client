import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div id="main-content">{children}</div>
    </AppShell>
  );
}
