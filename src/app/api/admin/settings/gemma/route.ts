import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { upsertSecureSetting } from "@/lib/secure-settings";
import { getSession } from "@/lib/session";

const payloadSchema = z.object({
  value: z.string().min(10),
});

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
      key: `admin:gemma:${ip}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!guard.allowed) {
      return rateLimitResponse(guard.retryAfterMs);
    }

    const payload = payloadSchema.parse(await req.json());
    await upsertSecureSetting("GEMMA_API_KEY", payload.value);

    await logAdminAudit({
      adminUserId: session.userId,
      action: "UPDATE_SETTING",
      targetType: "settings",
      targetId: "GEMMA_API_KEY",
      payload: { key: "GEMMA_API_KEY", valueLength: payload.value.length },
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Không thể cập nhật Gemma key" }, { status: 500 });
  }
}
