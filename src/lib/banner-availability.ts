import { and, count, eq, gt, inArray } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import { banners } from "@/db/schema";
import { BANNER_SLOT_LIMITS, type PurchasableBannerService } from "@/lib/banner-config";

type BannerPosition = "center_top" | "left_sidebar" | "right_sidebar" | "center_mid" | "center_bottom";

export async function countActiveBannersAt(
  db: AppDb,
  positions: readonly BannerPosition[],
): Promise<number> {
  const now = new Date();
  const rows = await db
    .select({ total: count() })
    .from(banners)
    .where(
      and(
        inArray(banners.position, [...positions]),
        eq(banners.status, "active"),
        gt(banners.endDate, now),
      ),
    );
  return rows[0]?.total ?? 0;
}

export type BannerSlotSnapshot = Record<
  PurchasableBannerService,
  { used: number; limit: number; full: boolean }
>;

export async function getBannerSlotSnapshot(db: AppDb): Promise<BannerSlotSnapshot> {
  const [top, midPool, left, right] = await Promise.all([
    countActiveBannersAt(db, ["center_top"]),
    countActiveBannersAt(db, ["center_mid", "center_bottom"]),
    countActiveBannersAt(db, ["left_sidebar"]),
    countActiveBannersAt(db, ["right_sidebar"]),
  ]);

  return {
    banner_center_top: {
      used: top,
      limit: BANNER_SLOT_LIMITS.center_top,
      full: top >= BANNER_SLOT_LIMITS.center_top,
    },
    banner_center_mid: {
      used: midPool,
      limit: BANNER_SLOT_LIMITS.center_mid_pool,
      full: midPool >= BANNER_SLOT_LIMITS.center_mid_pool,
    },
    banner_left_sidebar: {
      used: left,
      limit: BANNER_SLOT_LIMITS.left_sidebar,
      full: left >= BANNER_SLOT_LIMITS.left_sidebar,
    },
    banner_right_sidebar: {
      used: right,
      limit: BANNER_SLOT_LIMITS.right_sidebar,
      full: right >= BANNER_SLOT_LIMITS.right_sidebar,
    },
  };
}
