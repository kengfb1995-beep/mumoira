import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { incidentAcks } from "@/db/schema";
import { logAdminAudit } from "@/lib/audit";
import { assertCsrf } from "@/lib/csrf";
import { getDb } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";
import { requireAdminRole, requireSuperAdminRole } from "@/lib/authz";

const schema = z.object({
  incidentId: z.string().min(3),
  action: z.enum(["assign", "resolve", "reopen", "extend_sla"]),
  assignedToUserId: z.number().int().positive().optional(),
  extendMinutes: z.number().int().min(5).max(24 * 60).optional(),
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
      .select({ id: incidentAcks.id, status: incidentAcks.status })
      .from(incidentAcks)
      .where(eq(incidentAcks.incidentId, payload.incidentId))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json({ message: "Incident chưa tồn tại, hãy acknowledge trước" }, { status: 404 });
    }

    if (payload.action === "assign") {
      if (!payload.assignedToUserId) {
        return NextResponse.json({ message: "Thiếu assignedToUserId" }, { status: 400 });
      }

      await db
        .update(incidentAcks)
        .set({
          assignedToUserId: payload.assignedToUserId,
          updatedAt: new Date(),
        })
        .where(eq(incidentAcks.incidentId, payload.incidentId));

      await logAdminAudit({
        adminUserId: session.userId,
        action: "ASSIGN_INCIDENT",
        targetType: "incident",
        targetId: payload.incidentId,
        payload: { assignedToUserId: payload.assignedToUserId, note: payload.note ?? null },
        ipAddress: getClientIp(req),
      });

      return NextResponse.json({ ok: true });
    }

    if (payload.action === "reopen") {
      const superAdmin = await requireSuperAdminRole();
      if (!superAdmin) {
        return NextResponse.json({ message: "Chỉ super_admin được reopen incident" }, { status: 403 });
      }

      await db
        .update(incidentAcks)
        .set({
          status: "acknowledged",
          resolvedAt: null,
          updatedAt: new Date(),
          note: payload.note ?? null,
        })
        .where(eq(incidentAcks.incidentId, payload.incidentId));

      await logAdminAudit({
        adminUserId: session.userId,
        action: "REOPEN_INCIDENT",
        targetType: "incident",
        targetId: payload.incidentId,
        payload: { note: payload.note ?? null },
        ipAddress: getClientIp(req),
      });

      return NextResponse.json({ ok: true });
    }

    if (payload.action === "extend_sla") {
      if (!payload.extendMinutes) {
        return NextResponse.json({ message: "Thiếu extendMinutes" }, { status: 400 });
      }

      const now = Date.now();
      const base = now;
      await db
        .update(incidentAcks)
        .set({
          slaDueAt: new Date(base + payload.extendMinutes * 60 * 1000),
          updatedAt: new Date(now),
          note: payload.note ?? null,
        })
        .where(eq(incidentAcks.incidentId, payload.incidentId));

      await logAdminAudit({
        adminUserId: session.userId,
        action: "EXTEND_INCIDENT_SLA",
        targetType: "incident",
        targetId: payload.incidentId,
        payload: { extendMinutes: payload.extendMinutes, note: payload.note ?? null },
        ipAddress: getClientIp(req),
      });

      return NextResponse.json({ ok: true });
    }

    const superAdmin = await requireSuperAdminRole();
    if (!superAdmin) {
      return NextResponse.json({ message: "Chỉ super_admin được resolve incident" }, { status: 403 });
    }

    await db
      .update(incidentAcks)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        note: payload.note ?? null,
        updatedAt: new Date(),
      })
      .where(eq(incidentAcks.incidentId, payload.incidentId));

    await logAdminAudit({
      adminUserId: session.userId,
      action: "RESOLVE_INCIDENT",
      targetType: "incident",
      targetId: payload.incidentId,
      payload: { note: payload.note ?? null },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Không thể cập nhật incident" }, { status: 500 });
  }
}
