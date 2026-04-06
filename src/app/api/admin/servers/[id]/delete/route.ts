import { getAdminSession } from "@/lib/session";
import { servers } from "@/db/schema";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const serverId = parseInt(id);

  if (isNaN(serverId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const db = getDb();
    await db.delete(servers).where(eq(servers.id, serverId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
