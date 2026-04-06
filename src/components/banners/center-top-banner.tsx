import { and, desc, eq, gt } from "drizzle-orm";
import { banners } from "@/db/schema";
import { BANNER_TOP } from "@/lib/banner-config";
import { getDb } from "@/lib/db";

function isMp4Url(url: string) {
  return /\.mp4(\?.*)?$/i.test(url);
}

export async function CenterTopBanner() {
  const db = getDb();
  const rows = await db
    .select({ id: banners.id, imageUrl: banners.imageUrl, targetUrl: banners.targetUrl })
    .from(banners)
    .where(and(eq(banners.position, "center_top"), eq(banners.status, "active"), gt(banners.endDate, new Date())))
    .orderBy(desc(banners.id))
    .limit(1);

  const banner = rows[0];
  if (!banner) return null;

  return (
    <a
      href={banner.targetUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="block w-full overflow-hidden rounded-sm border border-amber-500/25 bg-black/20"
      style={{ aspectRatio: `${BANNER_TOP.w} / ${BANNER_TOP.h}` }}
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
          alt="Banner quảng cáo"
          width={BANNER_TOP.w}
          height={BANNER_TOP.h}
          className="h-full w-full object-cover"
          loading="eager"
        />
      )}
    </a>
  );
}
