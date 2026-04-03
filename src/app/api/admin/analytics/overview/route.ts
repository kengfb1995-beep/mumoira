import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminAudits, cronRuns, incidentAcks, settings, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

type DailyPoint = {
  date: string;
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  processedCount: number;
};

function clampDays(value: string | null) {
  const parsed = Number(value);
  if (parsed === 7 || parsed === 30 || parsed === 90) return parsed;
  return 30;
}

function daysAgoStart(days: number) {
  const now = new Date();
  now.setDate(now.getDate() - days);
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

function summarizeRuns(
  runs: Array<{
    success: boolean;
    processedCount: number;
    durationMs: number | null;
  }>,
) {
  let successRuns = 0;
  let failedRuns = 0;
  let totalProcessed = 0;
  let totalDuration = 0;

  for (const run of runs) {
    totalProcessed += run.processedCount;
    if (run.success) successRuns += 1;
    else failedRuns += 1;
    if (run.durationMs) totalDuration += run.durationMs;
  }

  const totalRuns = successRuns + failedRuns;
  return {
    totalRuns,
    successRuns,
    failedRuns,
    totalProcessed,
    successRate: totalRuns ? Number(((successRuns / totalRuns) * 100).toFixed(2)) : 0,
    avgDurationMs: totalRuns ? Math.round(totalDuration / totalRuns) : 0,
  };
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
  }

  const db = getDb();
  const searchParams = new URL(req.url).searchParams;
  const days = clampDays(searchParams.get("days"));
  const taskName = searchParams.get("taskName")?.trim() || "all";

  const fromTs = daysAgoStart(days);
  const prevFromTs = daysAgoStart(days * 2);
  const fromDate = new Date(fromTs);
  const prevFromDate = new Date(prevFromTs);

  const whereCurrent =
    taskName === "all"
      ? gte(cronRuns.createdAt, fromDate)
      : and(gte(cronRuns.createdAt, fromDate), eq(cronRuns.taskName, taskName));

  const wherePrevious =
    taskName === "all"
      ? and(gte(cronRuns.createdAt, prevFromDate), sql`${cronRuns.createdAt} < ${fromDate}`)
      : and(gte(cronRuns.createdAt, prevFromDate), sql`${cronRuns.createdAt} < ${fromDate}`, eq(cronRuns.taskName, taskName));

  const [runs, previousRuns, recentErrors, webhookRejects, taskRows, thresholdRows, incidentRows, userRows] = await Promise.all([
    db
      .select({
        id: cronRuns.id,
        taskName: cronRuns.taskName,
        success: cronRuns.success,
        processedCount: cronRuns.processedCount,
        durationMs: cronRuns.durationMs,
        errorMessage: cronRuns.errorMessage,
        runDate: cronRuns.runDate,
        createdAt: cronRuns.createdAt,
      })
      .from(cronRuns)
      .where(whereCurrent)
      .orderBy(desc(cronRuns.id)),
    db
      .select({
        success: cronRuns.success,
        processedCount: cronRuns.processedCount,
        durationMs: cronRuns.durationMs,
      })
      .from(cronRuns)
      .where(wherePrevious),
    db
      .select({
        id: cronRuns.id,
        runDate: cronRuns.runDate,
        errorMessage: cronRuns.errorMessage,
        createdAt: cronRuns.createdAt,
      })
      .from(cronRuns)
      .where(and(eq(cronRuns.success, false), whereCurrent))
      .orderBy(desc(cronRuns.id))
      .limit(20),
    db
      .select({
        id: adminAudits.id,
        action: adminAudits.action,
        payload: adminAudits.payload,
        createdAt: adminAudits.createdAt,
      })
      .from(adminAudits)
      .where(and(eq(adminAudits.action, "PAYOS_WEBHOOK_REJECTED_IP"), gte(adminAudits.createdAt, fromDate)))
      .orderBy(desc(adminAudits.id))
      .limit(20),
    db
      .select({ taskName: cronRuns.taskName })
      .from(cronRuns)
      .groupBy(cronRuns.taskName),
    db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(
        inArray(settings.key, [
          "ANALYTICS_MIN_SUCCESS_RATE",
          "ANALYTICS_MAX_AVG_DURATION_MS",
          "ANALYTICS_MAX_WEBHOOK_REJECTS",
        ]),
      ),
    db
      .select({
        incidentId: incidentAcks.incidentId,
        incidentType: incidentAcks.incidentType,
        status: incidentAcks.status,
        acknowledgedAt: incidentAcks.acknowledgedAt,
        resolvedAt: incidentAcks.resolvedAt,
        slaDueAt: incidentAcks.slaDueAt,
        assignedToUserId: incidentAcks.assignedToUserId,
        createdAt: incidentAcks.createdAt,
      })
      .from(incidentAcks)
      .where(gte(incidentAcks.createdAt, fromDate)),
    db.select({ id: users.id, email: users.email }).from(users),
  ]);

  const dailyMap = new Map<string, DailyPoint>();
  const taskMap = new Map<
    string,
    {
      taskName: string;
      totalRuns: number;
      successRuns: number;
      failedRuns: number;
      processedCount: number;
      avgDurationMs: number;
      totalDurationMs: number;
    }
  >();

  for (const run of runs) {
    const found = dailyMap.get(run.runDate) ?? {
      date: run.runDate,
      totalRuns: 0,
      successRuns: 0,
      failedRuns: 0,
      processedCount: 0,
    };

    found.totalRuns += 1;
    found.processedCount += run.processedCount;
    if (run.success) found.successRuns += 1;
    else found.failedRuns += 1;
    dailyMap.set(run.runDate, found);

    const foundTask = taskMap.get(run.taskName) ?? {
      taskName: run.taskName,
      totalRuns: 0,
      successRuns: 0,
      failedRuns: 0,
      processedCount: 0,
      avgDurationMs: 0,
      totalDurationMs: 0,
    };

    foundTask.totalRuns += 1;
    foundTask.processedCount += run.processedCount;
    if (run.success) foundTask.successRuns += 1;
    else foundTask.failedRuns += 1;
    if (run.durationMs) {
      foundTask.totalDurationMs += run.durationMs;
    }

    taskMap.set(run.taskName, foundTask);
  }

  const chart = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  const current = summarizeRuns(runs);
  const previous = summarizeRuns(previousRuns);

  const taskBreakdown = [...taskMap.values()]
    .map((item) => ({
      ...item,
      successRate: item.totalRuns ? Number(((item.successRuns / item.totalRuns) * 100).toFixed(2)) : 0,
      avgDurationMs: item.totalRuns ? Math.round(item.totalDurationMs / item.totalRuns) : 0,
    }))
    .sort((a, b) => b.totalRuns - a.totalRuns);

  const minSuccessRate = Number(thresholdRows.find((r) => r.key === "ANALYTICS_MIN_SUCCESS_RATE")?.value ?? "95");
  const maxAvgDurationMs = Number(thresholdRows.find((r) => r.key === "ANALYTICS_MAX_AVG_DURATION_MS")?.value ?? "4000");
  const maxWebhookRejects = Number(thresholdRows.find((r) => r.key === "ANALYTICS_MAX_WEBHOOK_REJECTS")?.value ?? "3");

  const now = Date.now();
  const incidentDailyMap = new Map<string, { date: string; total: number; breached: number; resolved: number }>();
  const assigneeMap = new Map<string, { email: string; count: number }>();
  const typeMap = new Map<string, { incidentType: string; total: number; breached: number }>();

  let acknowledgedCount = 0;
  let resolvedCount = 0;
  let breachedCount = 0;
  let totalAckMs = 0;
  let totalResolveMs = 0;

  for (const incident of incidentRows) {
    const dateKey = new Date(incident.createdAt).toISOString().slice(0, 10);
    const daily = incidentDailyMap.get(dateKey) ?? { date: dateKey, total: 0, breached: 0, resolved: 0 };

    daily.total += 1;
    if (incident.status === "resolved") {
      daily.resolved += 1;
      resolvedCount += 1;
    }

    const createdAtMs = new Date(incident.createdAt).getTime();

    if (incident.acknowledgedAt) {
      acknowledgedCount += 1;
      totalAckMs += Math.max(0, new Date(incident.acknowledgedAt).getTime() - createdAtMs);
    }

    if (incident.resolvedAt) {
      totalResolveMs += Math.max(0, new Date(incident.resolvedAt).getTime() - createdAtMs);
    }

    const slaDueAtMs = incident.slaDueAt ? new Date(incident.slaDueAt).getTime() : null;
    const resolvedAtMs = incident.resolvedAt ? new Date(incident.resolvedAt).getTime() : null;
    const breached = slaDueAtMs
      ? (incident.status !== "resolved" && slaDueAtMs < now) || (resolvedAtMs != null && resolvedAtMs > slaDueAtMs)
      : false;

    if (breached) {
      daily.breached += 1;
      breachedCount += 1;
    }

    incidentDailyMap.set(dateKey, daily);

    const typeRow = typeMap.get(incident.incidentType) ?? { incidentType: incident.incidentType, total: 0, breached: 0 };
    typeRow.total += 1;
    if (breached) typeRow.breached += 1;
    typeMap.set(incident.incidentType, typeRow);

    if (incident.assignedToUserId) {
      const email = userRows.find((u) => u.id === incident.assignedToUserId)?.email ?? `user#${incident.assignedToUserId}`;
      const assignee = assigneeMap.get(email) ?? { email, count: 0 };
      assignee.count += 1;
      assigneeMap.set(email, assignee);
    }
  }

  const incidentCount = incidentRows.length;
  const breachRate = incidentCount ? Number(((breachedCount / incidentCount) * 100).toFixed(2)) : 0;
  const mttaMs = acknowledgedCount ? Math.round(totalAckMs / acknowledgedCount) : 0;
  const mttrMs = resolvedCount ? Math.round(totalResolveMs / resolvedCount) : 0;

  const slaDaily = [...incidentDailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  const topAssignees = [...assigneeMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  const topIncidentTypes = [...typeMap.values()]
    .map((item) => ({
      ...item,
      breachRate: item.total ? Number(((item.breached / item.total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.breached - a.breached || b.total - a.total)
    .slice(0, 5);

  const anomalies = [
    current.successRate < minSuccessRate
      ? {
          type: "success_rate",
          severity: "high",
          message: `Tỉ lệ thành công thấp (${current.successRate}%), dưới ngưỡng ${minSuccessRate}%.`,
        }
      : null,
    current.avgDurationMs > maxAvgDurationMs
      ? {
          type: "latency",
          severity: "medium",
          message: `Độ trễ trung bình cao (${current.avgDurationMs}ms), vượt ngưỡng ${maxAvgDurationMs}ms.`,
        }
      : null,
    webhookRejects.length > maxWebhookRejects
      ? {
          type: "webhook_reject",
          severity: "medium",
          message: `Có ${webhookRejects.length} lần webhook reject IP trong kỳ, vượt ngưỡng ${maxWebhookRejects}.`,
        }
      : null,
  ].filter(Boolean);

  return NextResponse.json({
    filters: {
      days,
      taskName,
      availableTasks: ["all", ...taskRows.map((item) => item.taskName)],
    },
    kpi: {
      ...current,
      webhookRejectCount: webhookRejects.length,
    },
    compare: {
      currentPeriodDays: days,
      previousPeriodDays: days,
      totalRunsDelta: current.totalRuns - previous.totalRuns,
      successRateDelta: Number((current.successRate - previous.successRate).toFixed(2)),
      processedDelta: current.totalProcessed - previous.totalProcessed,
    },
    thresholds: {
      minSuccessRate,
      maxAvgDurationMs,
      maxWebhookRejects,
    },
    chart,
    taskBreakdown,
    sla: {
      incidentCount,
      breachedCount,
      breachRate,
      mttaMs,
      mttrMs,
      daily: slaDaily,
      topAssignees,
      topIncidentTypes,
    },
    anomalies,
    recentErrors,
    webhookRejects,
  });
}
