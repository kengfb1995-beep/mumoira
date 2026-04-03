import { and, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { banners, cronRuns } from "@/db/schema";
import { getDb } from "@/lib/db";
import { logEvent } from "@/lib/logger";

function isAuthorized(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.MAINTENANCE_CRON_SECRET;
  if (!expected) return false;
  return auth === `Bearer ${expected}`;
}

function getRunDate(now: Date) {
  return now.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const db = getDb();

  try {
    const now = Date.now();
    const nowDate = new Date(now);

    const expired = await db
      .select({ id: banners.id })
      .from(banners)
      .where(and(eq(banners.status, "active"), lt(banners.endDate, nowDate)));

    let updatedCount = 0;
    for (const item of expired) {
      await db.update(banners).set({ status: "expired" }).where(eq(banners.id, item.id));
      updatedCount += 1;
    }

    const durationMs = Date.now() - startedAt;
    await db.insert(cronRuns).values({
      taskName: "expire_banners",
      success: true,
      statusCode: 200,
      processedCount: updatedCount,
      durationMs,
      runDate: getRunDate(new Date()),
    });

    logEvent("info", "maintenance_expire_banners", {
      updatedCount,
      checkedAt: new Date(now).toISOString(),
      durationMs,
    });

    return NextResponse.json({ ok: true, updatedCount, durationMs });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : "unknown_error";

    await db.insert(cronRuns).values({
      taskName: "expire_banners",
      success: false,
      statusCode: 500,
      processedCount: 0,
      durationMs,
      errorMessage: message.slice(0, 500),
      runDate: getRunDate(new Date()),
    });

    logEvent("error", "maintenance_expire_banners_failed", {
      message,
      durationMs,
    });
    return NextResponse.json({ message: "Expire banners failed" }, { status: 500 });
  }
}
