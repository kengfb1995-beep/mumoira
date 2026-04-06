import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { servers } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

const updateSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["pending", "active", "archived", "rejected"]).optional(),
  vipPackageType: z.enum(["vip_gold", "vip_silver", "none"]).optional(),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const db = getDb();
    const rows = await db
      .select({
        id: servers.id,
        name: servers.name,
        userId: servers.userId,
        version: servers.version,
        exp: servers.exp,
        drop: servers.drop,
        vipPackageType: servers.vipPackageType,
        status: servers.status,
        createdAt: servers.createdAt,
      })
      .from(servers)
      .orderBy(desc(servers.id))
      .limit(100);

    return NextResponse.json({ servers: rows });
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

    await db.update(servers).set({
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.vipPackageType !== undefined ? { vipPackageType: body.vipPackageType } : {}),
    }).where(eq(servers.id, body.id));

    await logAdminAudit({
      adminUserId: session.userId,
      action: "UPDATE_SERVER",
      targetType: "servers",
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

    const body = deleteSchema.parse(await req.json());
    const db = getDb();
    const ip = getClientIp(req);

    await db.delete(servers).where(eq(servers.id, body.id));

    await logAdminAudit({
      adminUserId: session.userId,
      action: "DELETE_SERVER",
      targetType: "servers",
      targetId: String(body.id),
      payload: { serverId: body.id },
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
