import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { servers } from "@/db/schema";
import { assertCsrf } from "@/lib/csrf";
import { getDb } from "@/lib/db";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

const schema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["pending", "active", "archived"]),
  vipPackageType: z.enum(["none", "vip_silver", "vip_gold"]).optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    const ip = getClientIp(req);

    const guard = enforceRateLimit({
      key: `admin:server-status:${ip}`,
      limit: 30,
      windowMs: 60_000,
    });

    if (!guard.allowed) {
      return rateLimitResponse(guard.retryAfterMs);
    }

    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }

    if (!assertCsrf(req)) {
      return NextResponse.json({ message: "CSRF token không hợp lệ" }, { status: 403 });
    }

    const payload = schema.parse(await req.json());
    const db = getDb();

    const found = await db.select({ id: servers.id }).from(servers).where(eq(servers.id, payload.id)).limit(1);
    if (!found[0]) {
      return NextResponse.json({ message: "Không tìm thấy server" }, { status: 404 });
    }

    await db
      .update(servers)
      .set({
        status: payload.status,
        vipPackageType: payload.vipPackageType ?? "none",
      })
      .where(and(eq(servers.id, payload.id)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Cập nhật server thất bại" }, { status: 500 });
  }
}
