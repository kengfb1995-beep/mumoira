import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { banners } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

const updateSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["pending", "active", "expired", "rejected"]).optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(banners)
      .orderBy(desc(banners.id))
      .limit(100);

    return NextResponse.json({ banners: rows });
  } catch (error) {
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const body = updateSchema.parse(await req.json());
    const db = getDb();
    const ip = getClientIp(req);

    await db.update(banners).set({ status: body.status }).where(eq(banners.id, body.id));

    await logAdminAudit({
      adminUserId: session.userId,
      action: "UPDATE_BANNER",
      targetType: "banners",
      targetId: String(body.id),
      payload: body,
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") ?? "");

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const db = getDb();
    const ip = getClientIp(req);

    await db.delete(banners).where(eq(banners.id, id));

    await logAdminAudit({
      adminUserId: session.userId,
      action: "DELETE_BANNER",
      targetType: "banners",
      targetId: String(id),
      payload: { id },
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}
