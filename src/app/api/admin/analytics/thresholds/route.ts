import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { settings } from "@/db/schema";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { getDb } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";
import { requireAdminRole, requireSuperAdminRole } from "@/lib/authz";

const schema = z.object({
  minSuccessRate: z.number().min(1).max(100),
  maxAvgDurationMs: z.number().int().min(100).max(120000),
  maxWebhookRejects: z.number().int().min(0).max(1000),
});

const KEYS = {
  minSuccessRate: "ANALYTICS_MIN_SUCCESS_RATE",
  maxAvgDurationMs: "ANALYTICS_MAX_AVG_DURATION_MS",
  maxWebhookRejects: "ANALYTICS_MAX_WEBHOOK_REJECTS",
} as const;

async function upsertSetting(key: string, value: string) {
  const db = getDb();
  const found = await db.select({ id: settings.id }).from(settings).where(eq(settings.key, key)).limit(1);

  if (found[0]) {
    await db.update(settings).set({ value }).where(eq(settings.id, found[0].id));
  } else {
    await db.insert(settings).values({ key, value });
  }
}

export async function GET() {
  const session = await requireAdminRole();
  if (!session) {
    return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .where(inArray(settings.key, [KEYS.minSuccessRate, KEYS.maxAvgDurationMs, KEYS.maxWebhookRejects]));

  const minSuccessRate = Number(rows.find((r) => r.key === KEYS.minSuccessRate)?.value ?? "95");
  const maxAvgDurationMs = Number(rows.find((r) => r.key === KEYS.maxAvgDurationMs)?.value ?? "4000");
  const maxWebhookRejects = Number(rows.find((r) => r.key === KEYS.maxWebhookRejects)?.value ?? "3");

  return NextResponse.json({ minSuccessRate, maxAvgDurationMs, maxWebhookRejects });
}

export async function POST(req: Request) {
  const session = await requireSuperAdminRole();
  if (!session) {
    return NextResponse.json({ message: "Chỉ super_admin mới được cập nhật ngưỡng" }, { status: 403 });
  }

  if (!assertCsrf(req)) {
    return NextResponse.json({ message: "CSRF token không hợp lệ" }, { status: 403 });
  }

  try {
    const payload = schema.parse(await req.json());

    await Promise.all([
      upsertSetting(KEYS.minSuccessRate, String(payload.minSuccessRate)),
      upsertSetting(KEYS.maxAvgDurationMs, String(payload.maxAvgDurationMs)),
      upsertSetting(KEYS.maxWebhookRejects, String(payload.maxWebhookRejects)),
    ]);

    await logAdminAudit({
      adminUserId: session.userId,
      action: "UPDATE_ANALYTICS_THRESHOLDS",
      targetType: "analytics_thresholds",
      targetId: "global",
      payload,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Không thể cập nhật ngưỡng" }, { status: 500 });
  }
}
