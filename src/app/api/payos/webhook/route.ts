import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { logEvent } from "@/lib/logger";
import { getPayOSClient } from "@/lib/payos";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    const ipAllowlist = (process.env.PAYOS_WEBHOOK_IP_ALLOWLIST ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (ipAllowlist.length > 0 && !ipAllowlist.includes(ip)) {
      return NextResponse.json({ message: "Webhook IP không được phép" }, { status: 403 });
    }

    const guard = enforceRateLimit({
      key: `payos:webhook:${ip}`,
      limit: 60,
      windowMs: 60_000,
    });

    if (!guard.allowed) {
      return rateLimitResponse(guard.retryAfterMs);
    }

    const allowlistRaw = process.env.PAYOS_WEBHOOK_ALLOWLIST_IPS ?? "";
    const allowlist = allowlistRaw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (allowlist.length && !allowlist.includes(ip)) {
      logEvent("warn", "payos_webhook_rejected_ip", { ip });
      return NextResponse.json({ message: "IP không được phép" }, { status: 403 });
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const payos = getPayOSClient();
    const verified = await payos.webhooks.verify(payload as never);

    if (verified.code !== "00") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const orderCode = Number((verified as { orderCode?: number }).orderCode ?? 0);
    if (!Number.isFinite(orderCode) || orderCode <= 0) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const db = getDb();
    const txDescription = `PAYOS_ORDER:${orderCode}`;

    const foundTx = await db
      .select({ id: transactions.id, userId: transactions.userId, amount: transactions.amount, status: transactions.status })
      .from(transactions)
      .where(and(eq(transactions.description, txDescription), eq(transactions.status, "pending")))
      .limit(1);

    const tx = foundTx[0];
    if (!tx) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    await db
      .update(transactions)
      .set({ status: "success" })
      .where(eq(transactions.id, tx.id));

    await db
      .update(users)
      .set({ balance: sql`${users.balance} + ${tx.amount}` })
      .where(eq(users.id, tx.userId));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Webhook không hợp lệ" }, { status: 400 });
  }
}
