import { NextResponse } from "next/server";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { getDb } from "@/lib/db";
import { rebuildAllPostSlugs } from "@/lib/post-slug";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    let session;
    try {
      session = await getSession();
    } catch {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }

    if (!assertCsrf(req)) {
      return NextResponse.json({ message: "CSRF token không hợp lệ" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const guard = enforceRateLimit({
      key: `admin:rebuild-post-slugs:${ip}`,
      limit: 5,
      windowMs: 60_000,
    });

    if (!guard.allowed) {
      return rateLimitResponse(guard.retryAfterMs);
    }

    const db = getDb();
    const result = await rebuildAllPostSlugs(db);

    await logAdminAudit({
      adminUserId: session.userId,
      action: "REBUILD_POST_SLUGS",
      targetType: "posts",
      payload: result,
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Không thể rebuild slug bài viết",
      },
      { status: 500 },
    );
  }
}
