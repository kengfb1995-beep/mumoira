import { and, eq, gte, sql } from "drizzle-orm";
import { cronRuns } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

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

function escapeCsv(value: string | number | boolean | null | undefined) {
  if (value == null) return "";
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const searchParams = new URL(req.url).searchParams;
  const days = clampDays(searchParams.get("days"));
  const taskName = searchParams.get("taskName")?.trim() || "all";

  const db = getDb();
  const fromDate = new Date(daysAgoStart(days));
  const where =
    taskName === "all"
      ? gte(cronRuns.createdAt, fromDate)
      : and(gte(cronRuns.createdAt, fromDate), eq(cronRuns.taskName, taskName));

  const rows = await db
    .select({
      id: cronRuns.id,
      taskName: cronRuns.taskName,
      success: cronRuns.success,
      statusCode: cronRuns.statusCode,
      processedCount: cronRuns.processedCount,
      durationMs: cronRuns.durationMs,
      errorMessage: cronRuns.errorMessage,
      runDate: cronRuns.runDate,
      createdAt: cronRuns.createdAt,
    })
    .from(cronRuns)
    .where(where)
    .orderBy(sql`${cronRuns.createdAt} desc`);

  const header = [
    "id",
    "taskName",
    "success",
    "statusCode",
    "processedCount",
    "durationMs",
    "errorMessage",
    "runDate",
    "createdAt",
  ].join(",");

  const body = rows
    .map((row) =>
      [
        row.id,
        row.taskName,
        row.success,
        row.statusCode,
        row.processedCount,
        row.durationMs,
        row.errorMessage,
        row.runDate,
        new Date(row.createdAt).toISOString(),
      ]
        .map(escapeCsv)
        .join(","),
    )
    .join("\n");

  const csv = `${header}\n${body}`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cron-analytics-${taskName}-${days}d-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
