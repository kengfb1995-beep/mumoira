import { desc, eq, like, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { servers, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { ensureUniqueServerSlug } from "@/lib/server-slug";

const createServerSchema = z.object({
  name: z.string().trim().min(1, "Tên server không được để trống"),
  version: z.string().trim().default("Season 6"),
  exp: z.string().trim().default("x9999"),
  drop: z.string().trim().default("50%"),
  websiteUrl: z.string().trim().min(1, "Link website không được để trống"),
  bannerUrl: z.string().trim().nullable().optional(),
  facebookUrl: z.string().trim().nullable().optional(),
  zaloUrl: z.string().trim().nullable().optional(),
  vipPackageType: z.enum(["vip_gold", "vip_silver", "none"]).default("none"),
  status: z.enum(["pending", "active", "archived", "rejected"]).default("active"),
  openBetaDate: z.union([z.number(), z.string()]).nullable().optional(),
  alphaTestDate: z.union([z.number(), z.string()]).nullable().optional(),
  content: z.string().optional(),
  seoKeywords: z.string().optional(),
});

const updateSchema = z.union([
  z.object({
    action: z.literal("approve_all_pending"),
  }),
  z.object({
    id: z.number().int().positive(),
    name: z.string().trim().min(1).optional(),
    version: z.string().trim().optional(),
    exp: z.string().trim().optional(),
    drop: z.string().trim().optional(),
    websiteUrl: z.string().trim().min(1).optional(),
    bannerUrl: z.string().trim().nullable().optional(),
    facebookUrl: z.string().trim().nullable().optional(),
    zaloUrl: z.string().trim().nullable().optional(),
    vipPackageType: z.enum(["vip_gold", "vip_silver", "none"]).optional(),
    status: z.enum(["pending", "active", "archived", "rejected"]).optional(),
    openBetaDate: z.union([z.number(), z.string()]).nullable().optional(),
    alphaTestDate: z.union([z.number(), z.string()]).nullable().optional(),
    content: z.string().optional(),
    seoKeywords: z.string().optional(),
    slug: z.string().optional(),
  }),
]);

const deleteSchema = z.object({
  id: z.number().int().positive(),
});

function parseDateOrNull(val: string | number | null | undefined): Date | null {
  if (val === null || val === undefined || val === "") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

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
      if (statusParam === "vip") {
        filtered = filtered.filter((s) => s.vipPackageType === "vip_gold" || s.vipPackageType === "vip_silver");
      } else if (statusParam === "vip_gold") {
        filtered = filtered.filter((s) => s.vipPackageType === "vip_gold");
      } else {
        filtered = filtered.filter((s) => s.status === statusParam);
      }
    }
    if (searchParam) {
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchParam) ||
          s.version?.toLowerCase().includes(searchParam) ||
          s.websiteUrl?.toLowerCase().includes(searchParam) ||
          s.userEmail?.toLowerCase().includes(searchParam) ||
          String(s.id) === searchParam
      );
    }

    return NextResponse.json({ servers: filtered, total: filtered.length });
  } catch (error) {
    console.error("GET /api/admin/server error:", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const body = createServerSchema.parse(await req.json());
    const db = getDb();
    const ip = getClientIp(req);

    const now = new Date();
    const slug = await ensureUniqueServerSlug({ db, name: body.name });

    const inserted = await db
      .insert(servers)
      .values({
        userId: session.userId,
        name: body.name,
        slug,
        version: body.version,
        exp: body.exp,
        drop: body.drop,
        websiteUrl: body.websiteUrl,
        bannerUrl: body.bannerUrl || null,
        facebookUrl: body.facebookUrl || null,
        zaloUrl: body.zaloUrl || null,
        vipPackageType: body.vipPackageType,
        status: body.status,
        openBetaDate: parseDateOrNull(body.openBetaDate),
        alphaTestDate: parseDateOrNull(body.alphaTestDate),
        content: body.content ?? "",
        seoKeywords: body.seoKeywords ?? "",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await logAdminAudit({
      adminUserId: session.userId,
      action: "CREATE_SERVER",
      targetType: "servers",
      targetId: String(inserted[0]?.id ?? ""),
      payload: body,
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, server: inserted[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    console.error("POST /api/admin/server error:", error);
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
        .set({ status: "active", updatedAt: new Date() })
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
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (body.name !== undefined) {
        updateData.name = body.name;
        // Optionally update slug if name changed and no slug provided
        if (!body.slug) {
          updateData.slug = await ensureUniqueServerSlug({ db, name: body.name, excludeServerId: body.id });
        }
      }
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.websiteUrl !== undefined) updateData.websiteUrl = body.websiteUrl;
      if (body.bannerUrl !== undefined) updateData.bannerUrl = body.bannerUrl;
      if (body.facebookUrl !== undefined) updateData.facebookUrl = body.facebookUrl;
      if (body.zaloUrl !== undefined) updateData.zaloUrl = body.zaloUrl;
      if (body.version !== undefined) updateData.version = body.version;
      if (body.exp !== undefined) updateData.exp = body.exp;
      if (body.drop !== undefined) updateData.drop = body.drop;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.vipPackageType !== undefined) updateData.vipPackageType = body.vipPackageType;
      if (body.openBetaDate !== undefined) updateData.openBetaDate = parseDateOrNull(body.openBetaDate);
      if (body.alphaTestDate !== undefined) updateData.alphaTestDate = parseDateOrNull(body.alphaTestDate);
      if (body.content !== undefined) updateData.content = body.content;
      if (body.seoKeywords !== undefined) updateData.seoKeywords = body.seoKeywords;

      await db
        .update(servers)
        .set(updateData)
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
