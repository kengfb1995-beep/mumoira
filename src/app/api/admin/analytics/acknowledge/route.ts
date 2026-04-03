import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { incidentAcks, type NewIncidentAck } from "@/db/schema";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { getDb } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";
import { requireAdminRole } from "@/lib/authz";

const schema = z.object({
  incidentId: z.string().min(3),
  incidentType: z.string().min(3),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await requireAdminRole();
  if (!session) {
    return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
  }

  if (!assertCsrf(req)) {
    return NextResponse.json({ message: "CSRF token không hợp lệ" }, { status: 403 });
  }

  try {
    const payload = schema.parse(await req.json());
    const db = getDb();

    const existing = await db
      .select({ id: incidentAcks.id })
      .from(incidentAcks)
      .where(eq(incidentAcks.incidentId, payload.incidentId))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ ok: true, alreadyAcknowledged: true });
    }

    const now = Date.now();
    const insertPayload: NewIncidentAck = {
      incidentId: payload.incidentId,
      incidentType: payload.incidentType,
      status: "acknowledged",
      acknowledgedByUserId: session.userId,
      acknowledgedAt: new Date(now),
      slaDueAt: new Date(now + 2 * 60 * 60 * 1000),
      note: payload.note ?? null,
      updatedAt: new Date(now),
    };

    await db.insert(incidentAcks).values(insertPayload);

    await logAdminAudit({
      adminUserId: session.userId,
      action: "ACKNOWLEDGE_INCIDENT",
      targetType: "incident",
      targetId: payload.incidentId,
      payload: { incidentType: payload.incidentType, note: payload.note ?? null },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Không thể acknowledge incident" }, { status: 500 });
  }
}
