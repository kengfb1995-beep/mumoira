import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
    }

    const url = new URL(req.url);
    const orderCodeRaw = url.searchParams.get("orderCode");
    const orderCode = Number(orderCodeRaw ?? 0);

    if (!Number.isFinite(orderCode) || orderCode <= 0) {
      return NextResponse.json({ message: "orderCode không hợp lệ" }, { status: 400 });
    }

    const txDescription = `PAYOS_ORDER:${orderCode}`;
    const db = getDb();

    const found = await db
      .select({ id: transactions.id, status: transactions.status, amount: transactions.amount, createdAt: transactions.createdAt })
      .from(transactions)
      .where(and(eq(transactions.userId, session.userId), eq(transactions.description, txDescription)))
      .limit(1);

    const tx = found[0];
    if (!tx) {
      return NextResponse.json({ found: false, status: "not_found" });
    }

    return NextResponse.json({
      found: true,
      status: tx.status,
      amount: tx.amount,
      createdAt: tx.createdAt,
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Không thể kiểm tra trạng thái" }, { status: 500 });
  }
}
