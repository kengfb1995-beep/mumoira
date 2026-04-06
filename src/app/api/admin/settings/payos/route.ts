import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { upsertSecureSetting } from "@/lib/secure-settings";
import { getSession } from "@/lib/session";

const payloadSchema = z.object({
  clientId: z.string().min(1),
  apiKey: z.string().min(1),
  checksumKey: z.string().min(1),
  webhookSecret: z.string().min(1),
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
      key: `admin:payos:${ip}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!guard.allowed) {
      return rateLimitResponse(guard.retryAfterMs);
    }

    const payload = payloadSchema.parse(await req.json());

    await Promise.all([
      upsertSecureSetting("PAYOS_CLIENT_ID", payload.clientId),
      upsertSecureSetting("PAYOS_API_KEY", payload.apiKey),
      upsertSecureSetting("PAYOS_CHECKSUM_KEY", payload.checksumKey),
      upsertSecureSetting("PAYOS_WEBHOOK_SECRET", payload.webhookSecret),
    ]);

    await logAdminAudit({
      adminUserId: session.userId,
      action: "UPDATE_SETTING",
      targetType: "settings",
      targetId: "PAYO_CREDENTIALS",
      payload: {
        keysSaved: ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY", "PAYOS_WEBHOOK_SECRET"],
      },
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Không thể cập nhật PayOS credentials" }, { status: 500 });
  }
}
