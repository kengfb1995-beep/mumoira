import { count, desc, like } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, search } = listSchema.parse(Object.fromEntries(searchParams));
    const offset = (page - 1) * limit;
    const db = getDb();

    const whereClause = search ? like(users.email, `%${search.toLowerCase()}%`) : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          balance: users.balance,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.id))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(users)
        .where(whereClause),
    ]);

    return NextResponse.json({
      users: rows,
      total: countResult[0]?.total ?? 0,
      page,
      limit,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}
