import { desc, eq, like, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { servers, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

const updateSchema = z.union([
  z.object({
    action: z.literal("approve_all_pending"),
  }),
  z.object({
    id: z.number().int().positive(),
    status: z.enum(["pending", "active", "archived", "rejected"]).optional(),
    vipPackageType: z.enum(["vip_gold", "vip_silver", "none"]).optional(),
  }),
]);

const deleteSchema = z.object({
  id: z.number().int().positive(),
});

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const searchParam = searchParams.get("search")?.trim().toLowerCase();

    const db = getDb();
    const rows = await db
      .select({
        id: servers.id,
        name: servers.name,
        userId: servers.userId,
        userEmail: users.email,
        version: servers.version,
        exp: servers.exp,
        drop: servers.drop,
        websiteUrl: servers.websiteUrl,
        content: servers.content,
        seoKeywords: servers.seoKeywords,
        slug: servers.slug,
        bannerUrl: servers.bannerUrl,
        facebookUrl: servers.facebookUrl,
        zaloUrl: servers.zaloUrl,
        openBetaDate: servers.openBetaDate,
        alphaTestDate: servers.alphaTestDate,
        vipPackageType: servers.vipPackageType,
        status: servers.status,
        createdAt: servers.createdAt,
      })
      .from(servers)
      .leftJoin(users, eq(servers.userId, users.id))
      .orderBy(desc(servers.id))
      .limit(300);

    let filtered = rows;
    if (statusParam && statusParam !== "all") {
      filtered = filtered.filter((s) => s.status === statusParam);
    }
    if (searchParam) {
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchParam) ||
          s.version?.toLowerCase().includes(searchParam) ||
          s.userEmail?.toLowerCase().includes(searchParam)
      );
    }

    return NextResponse.json({ servers: filtered, total: filtered.length });
  } catch (error) {
    console.error("GET /api/admin/server error:", error);
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

    if ("action" in body && body.action === "approve_all_pending") {
      await db
        .update(servers)
        .set({ status: "active" })
        .where(eq(servers.status, "pending"));

      await logAdminAudit({
        adminUserId: session.userId,
        action: "APPROVE_ALL_PENDING_SERVERS",
        targetType: "servers",
        targetId: "all",
        payload: { action: "approve_all_pending" },
        ipAddress: ip,
      });

      return NextResponse.json({ ok: true, message: "Đã duyệt tất cả server chờ duyệt" });
    }

    if ("id" in body) {
      await db
        .update(servers)
        .set({
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.vipPackageType !== undefined ? { vipPackageType: body.vipPackageType } : {}),
        })
        .where(eq(servers.id, body.id));

      await logAdminAudit({
        adminUserId: session.userId,
        action: "UPDATE_SERVER",
        targetType: "servers",
        targetId: String(body.id),
        payload: body,
        ipAddress: ip,
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ message: "Yêu cầu không hợp lệ" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    console.error("PATCH /api/admin/server error:", error);
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
    console.error("DELETE /api/admin/server error:", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}
