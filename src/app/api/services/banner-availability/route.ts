import { NextResponse } from "next/server";
import { BANNER_SERVICE_SPECS } from "@/lib/banner-config";
import { getBannerSlotSnapshot } from "@/lib/banner-availability";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const slots = await getBannerSlotSnapshot(db);

  return NextResponse.json({
    slots,
    dimensions: BANNER_SERVICE_SPECS,
  });
}
