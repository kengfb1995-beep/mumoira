import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminAudits, incidentAcks, cronRuns, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

function clampDays(value: string | null) {
  const parsed = Number(value);
  if (parsed === 7 || parsed === 30 || parsed === 90) return parsed;
  return 30;
}

function clampPage(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function daysAgoStart(days: number) {
  const now = new Date();
  now.setDate(now.getDate() - days);
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
  }

  const searchParams = new URL(req.url).searchParams;
  const days = clampDays(searchParams.get("days"));
  const page = clampPage(searchParams.get("page"));
  const statusFilter = searchParams.get("status")?.trim();
  const breachedOnly = searchParams.get("breached") === "1";

  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const fromDate = new Date(daysAgoStart(days));

  const db = getDb();

  const [cronErrorRows, webhookRejectRows, ackRows] = await Promise.all([
    db
      .select({
        id: cronRuns.id,
        source: cronRuns.taskName,
        message: cronRuns.errorMessage,
        createdAt: cronRuns.createdAt,
      })
      .from(cronRuns)
      .where(and(eq(cronRuns.success, false), gte(cronRuns.createdAt, fromDate)))
      .orderBy(desc(cronRuns.id)),
    db
      .select({
        id: adminAudits.id,
        source: adminAudits.action,
        message: adminAudits.payload,
        createdAt: adminAudits.createdAt,
      })
      .from(adminAudits)
      .where(and(eq(adminAudits.action, "PAYOS_WEBHOOK_REJECTED_IP"), gte(adminAudits.createdAt, fromDate)))
      .orderBy(desc(adminAudits.id)),
    db
      .select({
        incidentId: incidentAcks.incidentId,
        status: incidentAcks.status,
        note: incidentAcks.note,
        acknowledgedAt: incidentAcks.acknowledgedAt,
        resolvedAt: incidentAcks.resolvedAt,
        slaDueAt: incidentAcks.slaDueAt,
        assignedToUserId: incidentAcks.assignedToUserId,
        acknowledgedByUserId: incidentAcks.acknowledgedByUserId,
      })
      .from(incidentAcks),
  ]);

  const userIds = ackRows
    .flatMap((row) => [row.assignedToUserId, row.acknowledgedByUserId])
    .filter((id): id is number => Number.isFinite(id));

  const userRows = userIds.length
    ? await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, userIds))
    : [];
  const userMap = new Map(userRows.map((u) => [u.id, u.email]));

  const ackMap = new Map(ackRows.map((row) => [row.incidentId, row]));

  const merged = [
    ...cronErrorRows.map((row) => ({
      id: `cron-${row.id}`,
      source: row.source,
      incidentType: "cron_error",
      message: row.message ?? "Cron task failed",
      createdAt: new Date(row.createdAt).getTime(),
    })),
    ...webhookRejectRows.map((row) => ({
      id: `audit-${row.id}`,
      source: row.source,
      incidentType: "webhook_reject_ip",
      message: row.message ?? "Webhook rejected IP",
      createdAt: new Date(row.createdAt).getTime(),
    })),
  ]
    .map((item) => {
      const ack = ackMap.get(item.id);
      const now = Date.now();
      const slaDueAtMs = ack?.slaDueAt ? new Date(ack.slaDueAt).getTime() : null;
      const isResolved = ack?.status === "resolved";
      const slaState = !slaDueAtMs ? "unknown" : isResolved ? "resolved" : slaDueAtMs < now ? "breached" : "within";
      return {
        ...item,
        status: ack?.status ?? "open",
        acknowledged: Boolean(ack),
        acknowledgedBy: ack?.acknowledgedByUserId ? (userMap.get(ack.acknowledgedByUserId) ?? null) : null,
        acknowledgedAt: ack?.acknowledgedAt ?? null,
        assignedTo: ack?.assignedToUserId ? (userMap.get(ack.assignedToUserId) ?? null) : null,
        assignedToUserId: ack?.assignedToUserId ?? null,
        resolvedAt: ack?.resolvedAt ?? null,
        slaDueAt: ack?.slaDueAt ?? null,
        slaState,
        note: ack?.note ?? null,
      };
    })
    .filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (breachedOnly && item.slaState !== "breached") return false;
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const total = merged.length;
  const items = merged.slice(offset, offset + pageSize);

  return NextResponse.json({
    canAcknowledge: session.role === "admin" || session.role === "super_admin",
    canResolve: session.role === "super_admin",
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    items,
  });
}
