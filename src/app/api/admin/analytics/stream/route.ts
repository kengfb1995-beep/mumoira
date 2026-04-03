import { and, desc, eq, gte } from "drizzle-orm";
import { adminAudits, cronRuns } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

function daysAgoStart(days: number) {
  const now = new Date();
  now.setDate(now.getDate() - days);
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

async function loadSnapshot() {
  const db = getDb();
  const fromDate = new Date(daysAgoStart(7));

  const [latestCronFailures, latestWebhookRejects] = await Promise.all([
    db
      .select({
        id: cronRuns.id,
        taskName: cronRuns.taskName,
        runDate: cronRuns.runDate,
        errorMessage: cronRuns.errorMessage,
        createdAt: cronRuns.createdAt,
      })
      .from(cronRuns)
      .where(and(eq(cronRuns.success, false), gte(cronRuns.createdAt, fromDate)))
      .orderBy(desc(cronRuns.id))
      .limit(5),
    db
      .select({
        id: adminAudits.id,
        payload: adminAudits.payload,
        createdAt: adminAudits.createdAt,
      })
      .from(adminAudits)
      .where(and(eq(adminAudits.action, "PAYOS_WEBHOOK_REJECTED_IP"), gte(adminAudits.createdAt, fromDate)))
      .orderBy(desc(adminAudits.id))
      .limit(5),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    latestCronFailures,
    latestWebhookRejects,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let isClosed = false;

      const push = async () => {
        if (isClosed) return;
        const snapshot = await loadSnapshot();
        controller.enqueue(encoder.encode(`event: incidents\ndata: ${JSON.stringify(snapshot)}\n\n`));
      };

      void push();

      const interval = setInterval(() => {
        void push();
      }, 15000);

      const heartbeat = setInterval(() => {
        if (isClosed) return;
        controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${Date.now()}\n\n`));
      }, 10000);

      const close = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      };

      // close stream after 2 minutes to avoid infinite hanging connections
      const timeout = setTimeout(close, 120000);

      // cleanup hook
      return () => {
        clearTimeout(timeout);
        close();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
