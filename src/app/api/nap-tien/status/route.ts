import { and, eq, like } from "drizzle-orm";
import { NextResponse } from "next/server";
import { transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
    }

    const url = new URL(req.url);
    const orderCode = url.searchParams.get("orderCode");
    const txIdRaw = url.searchParams.get("txId");

    const db = getDb();

    let foundTx = null;

    if (txIdRaw && Number.isFinite(Number(txIdRaw))) {
      const rows = await db
        .select({
          id: transactions.id,
          status: transactions.status,
          amount: transactions.amount,
          description: transactions.description,
          createdAt: transactions.createdAt,
          userId: transactions.userId,
        })
        .from(transactions)
        .where(and(eq(transactions.id, Number(txIdRaw)), eq(transactions.userId, session.userId)))
        .limit(1);
      foundTx = rows[0] ?? null;
    } else if (orderCode) {
      const rows = await db
        .select({
          id: transactions.id,
          status: transactions.status,
          amount: transactions.amount,
          description: transactions.description,
          createdAt: transactions.createdAt,
          userId: transactions.userId,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, session.userId),
            like(transactions.description, `%${orderCode}%`),
          ),
        )
        .limit(1);
      foundTx = rows[0] ?? null;
    }

    if (!foundTx) {
      return NextResponse.json({ found: false, status: "not_found" });
    }

    // Lấy số dư hiện tại của user
    const [userRow] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    return NextResponse.json({
      found: true,
      transactionId: foundTx.id,
      status: foundTx.status,
      amount: foundTx.amount,
      description: foundTx.description,
      createdAt: foundTx.createdAt,
      currentBalance: userRow?.balance ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể kiểm tra trạng thái" },
      { status: 500 },
    );
  }
}
