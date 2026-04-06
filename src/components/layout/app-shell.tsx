import type { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SideBanner } from "@/components/layout/side-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { FloatingSocialDock } from "@/components/layout/floating-social-dock";
import { getSeoConfig } from "@/lib/seo";
import { normalizeFacebookHref, normalizeZaloHref } from "@/lib/social-links";

export async function AppShell({ children }: PropsWithChildren) {
  const seo = await getSeoConfig();
  const facebookHref = normalizeFacebookHref(seo.social.facebook);
  const zaloHref = normalizeZaloHref(seo.social.zalo);
  const showFloat = !!facebookHref || !!zaloHref;

  return (
    <div className="min-h-screen bg-[#0f1923] text-zinc-200" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
      <SiteHeader />

      <div className="mx-auto flex w-full min-w-0 max-w-[1560px] gap-0.5 px-0.5 py-1 sm:gap-1 sm:px-1 sm:py-1.5 md:px-1.5">
        <SideBanner side="left" />

        <main className="min-h-[calc(100vh-160px)] min-w-0 flex-1 overflow-x-auto rounded-md border border-[#243447] bg-[#131d28] p-0 [scrollbar-gutter:stable]">
          {children}
        </main>

        <SideBanner side="right" />
      </div>

      <SiteFooter />
      {showFloat ? <FloatingSocialDock facebookHref={facebookHref} zaloHref={zaloHref} /> : null}
    </div>
  );
}
