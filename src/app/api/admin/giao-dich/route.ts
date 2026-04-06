import { count, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
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
    const { page, limit } = listSchema.parse(Object.fromEntries(searchParams));
    const offset = (page - 1) * limit;
    const db = getDb();

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
      .orderBy(desc(transactions.id))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(transactions);

    return NextResponse.json({ transactions: rows, total: total ?? 0, page, limit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}
