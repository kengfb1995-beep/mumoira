import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { banners, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

const BANNER_POSITIONS = [
  "center_top",
  "left_sidebar",
  "right_sidebar",
  "center_mid",
  "center_bottom",
] as const;

const BANNER_STATUSES = ["pending", "active", "expired", "rejected"] as const;

const createBannerSchema = z.object({
  imageUrl: z.string().trim().min(1, "Vui lòng nhập link ảnh banner"),
  targetUrl: z.string().trim().min(1, "Vui lòng nhập link đích"),
  position: z.enum(BANNER_POSITIONS),
  status: z.enum(BANNER_STATUSES).default("active"),
  startDate: z.union([z.number(), z.string()]).optional(),
  endDate: z.union([z.number(), z.string()]).optional(),
  userId: z.number().int().positive().optional(),
});

const updateBannerSchema = z.object({
  id: z.number().int().positive(),
  imageUrl: z.string().trim().min(1).optional(),
  targetUrl: z.string().trim().min(1).optional(),
  position: z.enum(BANNER_POSITIONS).optional(),
  status: z.enum(BANNER_STATUSES).optional(),
  startDate: z.union([z.number(), z.string()]).optional(),
  endDate: z.union([z.number(), z.string()]).optional(),
});

function parseDate(val: string | number | undefined, fallback: Date): Date {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const db = getDb();
    const rows = await db
      .select({
        id: banners.id,
        userId: banners.userId,
        userEmail: users.email,
        position: banners.position,
        imageUrl: banners.imageUrl,
        targetUrl: banners.targetUrl,
        startDate: banners.startDate,
        endDate: banners.endDate,
        status: banners.status,
        createdAt: banners.createdAt,
        updatedAt: banners.updatedAt,
      })
      .from(banners)
      .leftJoin(users, eq(banners.userId, users.id))
      .orderBy(desc(banners.id))
      .limit(150);

    return NextResponse.json({ banners: rows });
  } catch (error) {
    console.error("GET /api/admin/banner error:", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const body = createBannerSchema.parse(await req.json());
    const db = getDb();
    const ip = getClientIp(req);

    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const startDate = parseDate(body.startDate, now);
    const endDate = parseDate(body.endDate, defaultEnd);
    const targetUserId = body.userId ?? session.userId;

    const inserted = await db
      .insert(banners)
      .values({
        userId: targetUserId,
        position: body.position,
        imageUrl: body.imageUrl,
        targetUrl: body.targetUrl,
        status: body.status,
        startDate,
        endDate,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await logAdminAudit({
      adminUserId: session.userId,
      action: "CREATE_BANNER",
      targetType: "banners",
      targetId: String(inserted[0]?.id ?? ""),
      payload: body,
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, banner: inserted[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: error.issues }, { status: 400 });
    }
    console.error("POST /api/admin/banner error:", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ message: "Không có quyền" }, { status: 403 });
    }

    const body = updateBannerSchema.parse(await req.json());
    const db = getDb();
    const ip = getClientIp(req);

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.imageUrl !== undefined) updatePayload.imageUrl = body.imageUrl;
    if (body.targetUrl !== undefined) updatePayload.targetUrl = body.targetUrl;
    if (body.position !== undefined) updatePayload.position = body.position;
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.startDate !== undefined) updatePayload.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updatePayload.endDate = new Date(body.endDate);

    await db.update(banners).set(updatePayload).where(eq(banners.id, body.id));

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
    console.error("PATCH /api/admin/banner error:", error);
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
    console.error("DELETE /api/admin/banner error:", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}
