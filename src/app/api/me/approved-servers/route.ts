import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { servers } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
  }

  const db = getDb();
  const items = await db
    .select({
      id: servers.id,
      name: servers.name,
      status: servers.status,
      vipPackageType: servers.vipPackageType,
    })
    .from(servers)
    .where(and(eq(servers.userId, session.userId), eq(servers.status, "active")))
    .orderBy(desc(servers.id));

  return NextResponse.json({ servers: items });
}
