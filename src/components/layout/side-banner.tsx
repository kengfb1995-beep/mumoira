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
                  className="h-full w-full object-cover"
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
                  className="h-full w-full object-cover [image-rendering:-webkit-optimize-contrast]"
                  loading="lazy"
                />
              )}
            </a>
          ) : (
            <a
              key={`empty-${side}-${idx}`}
              href="/tai-khoan/mua-dich-vu"
              className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-500/35 bg-black/30 p-2 text-center transition hover:border-amber-400 hover:bg-amber-950/20 group cursor-pointer"
              style={{ aspectRatio: `${BANNER_SIDE.w} / ${BANNER_SIDE.h}` }}
              title="Vị trí còn trống — Bấm để thuê banner"
            >
              <Sparkles className="h-5 w-5 text-amber-400/80 group-hover:scale-110 transition" aria-hidden="true" />
              <p className="text-[11px] font-bold text-amber-200/90 group-hover:text-amber-100">
                Thuê vị trí này
              </p>
              <span className="rounded-md border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[9px] font-black text-amber-300">
                204×390 px
              </span>
            </a>
          ),
        )}
      </div>
    </aside>
  );
}
