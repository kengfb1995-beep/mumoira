import type { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SideBanner } from "@/components/layout/side-banner";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[#070304] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(120,20,20,0.4),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(120,90,20,0.25),_transparent_35%)]" />
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-[1400px] gap-4 px-4 py-4 lg:px-6">
        <SideBanner side="left" />
        <main className="min-h-[calc(100vh-120px)] flex-1 rounded-xl border border-amber-500/20 bg-[#120808]/80 p-4 md:p-6">
          {children}
        </main>
        <SideBanner side="right" />
      </div>
    </div>
  );
}
