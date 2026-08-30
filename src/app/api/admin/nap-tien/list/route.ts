import { and, count, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["all", "pending", "success", "cancelled"]).default("all"),
});

export async function GET(req: Request) {
  let session;
  try {
    session = await getSession();
  } catch {
    return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
  }
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, status } = listSchema.parse(Object.fromEntries(searchParams));
    const offset = (page - 1) * limit;
    const db = getDb();

    const condition =
      status === "all"
        ? eq(transactions.serviceType, "topup")
        : and(eq(transactions.serviceType, "topup"), eq(transactions.status, status));

    const rows = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        email: users.email,
        amount: transactions.amount,
        status: transactions.status,
        serviceType: transactions.serviceType,
        description: transactions.description,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(condition)
      .orderBy(desc(transactions.id))
      .limit(limit)
      .offset(offset);

    // Đếm tổng số bản ghi theo bộ lọc
    const [{ total }] = await db
      .select({ total: count() })
      .from(transactions)
      .where(condition);

    // Thống kê nhanh số lượng đơn pending và tổng tiền đã nạp thành công
    const [pendingRow] = await db
      .select({ count: count() })
      .from(transactions)
      .where(and(eq(transactions.serviceType, "topup"), eq(transactions.status, "pending")));

    const [successRow] = await db
      .select({ totalAmount: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(eq(transactions.serviceType, "topup"), eq(transactions.status, "success")));

    return NextResponse.json({
      transactions: rows,
      total: total ?? 0,
      page,
      limit,
      stats: {
        pendingCount: pendingRow?.count ?? 0,
        totalSuccessAmount: Number(successRow?.totalAmount ?? 0),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}
