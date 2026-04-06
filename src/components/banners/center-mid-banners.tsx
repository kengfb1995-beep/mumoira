import { and, desc, eq, gt } from "drizzle-orm";
import { banners } from "@/db/schema";
import { BANNER_MIDDLE } from "@/lib/banner-config";
import { getDb } from "@/lib/db";

function isMp4Url(url: string) {
  return /\.mp4(\?.*)?$/i.test(url);
}

/** Các banner center_mid xếp dọc (780×110), giống cột giữa mumoira.tv */
export async function CenterMidBanners() {
  const db = getDb();
  const rows = await db
    .select({ id: banners.id, imageUrl: banners.imageUrl, targetUrl: banners.targetUrl })
    .from(banners)
    .where(and(eq(banners.position, "center_mid"), eq(banners.status, "active"), gt(banners.endDate, new Date())))
    .orderBy(desc(banners.id))
    .limit(10);

  if (!rows.length) return null;

  return (
    <div className="flex w-full flex-col gap-1">
      {rows.map((banner) => (
        <a
          key={banner.id}
          href={banner.targetUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="block w-full overflow-hidden rounded-sm border border-amber-500/25 bg-black/20"
          style={{ aspectRatio: `${BANNER_MIDDLE.w} / ${BANNER_MIDDLE.h}` }}
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
              alt=""
              width={BANNER_MIDDLE.w}
              height={BANNER_MIDDLE.h}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </a>
      ))}
    </div>
  );
}
