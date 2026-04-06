import { and, desc, eq, gt } from "drizzle-orm";
import { Sparkles } from "lucide-react";
import { banners } from "@/db/schema";
import { BANNER_SIDE, BANNER_VIP_GOLD } from "@/lib/banner-config";
import { getDb } from "@/lib/db";

const SIDE_SLOT_COUNT = 3;

type SideBannerProps = {
  side: "left" | "right";
};

function isMp4Url(url: string) {
  return /\.mp4(\?.*)?$/i.test(url);
}

export async function SideBanner({ side }: SideBannerProps) {
  const db = getDb();
  const position = side === "left" ? "left_sidebar" : "right_sidebar";

  const sideBanners = await db
    .select({
      id: banners.id,
      imageUrl: banners.imageUrl,
      targetUrl: banners.targetUrl,
    })
    .from(banners)
    .where(and(eq(banners.position, position), eq(banners.status, "active"), gt(banners.endDate, new Date())))
    .orderBy(desc(banners.id))
    .limit(SIDE_SLOT_COUNT);

  const slots: ({ id: number; imageUrl: string; targetUrl: string } | null)[] = sideBanners.slice(0, SIDE_SLOT_COUNT);
  while (slots.length < SIDE_SLOT_COUNT) slots.push(null);

  return (
    <aside className="sticky top-[88px] hidden shrink-0 xl:block" style={{ width: BANNER_SIDE.w }}>
      <div className="space-y-2">
        {slots.map((banner, idx) =>
          banner ? (
            <a
              key={banner.id}
              href={banner.targetUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex w-full items-center justify-center overflow-hidden rounded-lg border border-amber-500/25 bg-gradient-to-b from-[#120a0a] to-[#0a0505]"
              style={{ aspectRatio: `${BANNER_SIDE.w} / ${BANNER_SIDE.h}` }}
            >
              {isMp4Url(banner.imageUrl) ? (
                <video
                  src={banner.imageUrl}
                  className="max-h-full max-w-full object-contain"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banner.imageUrl}
                  alt={`Banner ${side} #${banner.id}`}
                  width={BANNER_SIDE.w}
                  height={BANNER_SIDE.h}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              )}
            </a>
          ) : (
            <div
              key={`empty-${side}-${idx}`}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-amber-500/35 bg-black/30 text-center"
              style={{ aspectRatio: `${BANNER_SIDE.w} / ${BANNER_SIDE.h}` }}
            >
              <Sparkles className="h-4 w-4 text-amber-400/70" aria-hidden="true" />
              <p className="text-[10px] font-medium leading-tight text-amber-100/90">Trống</p>
            </div>
          ),
        )}
      </div>
    </aside>
  );
}
