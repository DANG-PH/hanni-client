import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div id="main-content">{children}</div>
      <InstallPrompt />
    </AppShell>
  );
}
