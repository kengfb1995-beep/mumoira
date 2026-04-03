import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
  }

  const db = getDb();
  const row = await db
    .select({ balance: users.balance })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return NextResponse.json({ balance: row[0]?.balance ?? 0 });
}
